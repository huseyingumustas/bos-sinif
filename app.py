from datetime import datetime, timedelta
from flask import Flask, render_template, jsonify, request, redirect, session, url_for
from supabase import create_client
from dotenv import load_dotenv
import json
import logging
import os
import secrets

load_dotenv()

app = Flask(__name__)
app.logger.setLevel(logging.INFO)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
ADMIN_SIFRE = os.getenv('ADMIN_SIFRE')

# Development fallback: if FLASK_SECRET_KEY is missing, generate a temporary key
# so sessions still work locally. Production should always set FLASK_SECRET_KEY.
app.secret_key = os.getenv('FLASK_SECRET_KEY') or secrets.token_hex(32)

ALLOWED_GUNLER = [
    'Pazartesi',
    'Salı',
    'Çarşamba',
    'Perşembe',
    'Cuma',
]

DAY_LABELS = {
    'Pazartesi': 'Monday',
    'Salı': 'Tuesday',
    'Çarşamba': 'Wednesday',
    'Perşembe': 'Thursday',
    'Cuma': 'Friday',
}

MAX_FAILED_LOGIN_ATTEMPTS = 5
LOGIN_LOCKOUT_SECONDS = 60

SINIF_CONFIG = {
    'B': {
        '5': ['B-501', 'B-502', 'B-511', 'B-512'],
    },
    'F': {
        '3': ['F-301'],
    },
}


def supabase_hazirla():
    if not SUPABASE_URL or not SUPABASE_KEY:
        app.logger.error('Supabase ortam degiskenleri eksik.')
        return None

    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception:
        app.logger.exception('Supabase istemcisi olusturulamadi.')
        return None


supabase = supabase_hazirla()
FAILED_LOGIN_ATTEMPTS = {}


def admin_oturumu_var_mi():
    return session.get('admin_authenticated') is True


def client_ip_adresi():
    forwarded_for = request.headers.get('X-Forwarded-For', '')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()
    return request.remote_addr or 'unknown'


def login_deneme_kaydi(ip_adresi):
    kayit = FAILED_LOGIN_ATTEMPTS.setdefault(
        ip_adresi,
        {
            'failed_count': 0,
            'locked_until': None,
        },
    )
    locked_until = kayit.get('locked_until')
    if locked_until is not None and locked_until <= datetime.utcnow():
        kayit['failed_count'] = 0
        kayit['locked_until'] = None
    return kayit


def login_engelli_mi(kayit):
    locked_until = kayit.get('locked_until')
    return locked_until is not None and locked_until > datetime.utcnow()


def kalan_kilit_suresi(kayit):
    locked_until = kayit.get('locked_until')
    if locked_until is None:
        return 0
    remaining = int((locked_until - datetime.utcnow()).total_seconds())
    return remaining if remaining > 0 else 0


def basarisiz_login_kaydet(ip_adresi):
    kayit = login_deneme_kaydi(ip_adresi)
    kayit['failed_count'] += 1
    if kayit['failed_count'] >= MAX_FAILED_LOGIN_ATTEMPTS:
        kayit['locked_until'] = datetime.utcnow() + timedelta(seconds=LOGIN_LOCKOUT_SECONDS)


def login_kaydini_temizle(ip_adresi):
    FAILED_LOGIN_ATTEMPTS.pop(ip_adresi, None)


def admin_login_sayfasini_render_et(error_message=None, status_code=200, lockout_seconds=0):
    return render_template(
        'admin_login.html',
        error_message=error_message,
        lockout_seconds=lockout_seconds,
    ), status_code


def supabase_gerekli_json():
    if supabase is None:
        return jsonify({'error': 'The data source is currently unavailable.'}), 503
    return None


def supabase_gerekli_html():
    if supabase is None:
        return 'The data source is currently unavailable.', 503
    return None


def bos_admin_formu():
    return {
        'blok': '',
        'kat': '',
        'sinif': '',
        'gun': '',
        'baslangic': '',
        'bitis': '',
    }


def admin_formunu_hazirla(source=None):
    form_data = bos_admin_formu()
    if not source:
        return form_data

    for alan in form_data:
        form_data[alan] = (source.get(alan) or '').strip()
    return form_data


def saati_dakikaya_cevir(saat_metni):
    try:
        parsed = datetime.strptime(saat_metni, '%H:%M')
        return parsed.hour * 60 + parsed.minute
    except ValueError:
        return None


def admin_formunu_dogrula(form_data):
    blok = form_data['blok']
    kat = form_data['kat']
    sinif = form_data['sinif']
    gun = form_data['gun']
    baslangic = form_data['baslangic']
    bitis = form_data['bitis']

    if not blok:
        return 'Please select a block.'
    if blok not in SINIF_CONFIG:
        return 'Invalid block selected.'

    katlar = SINIF_CONFIG[blok]
    if not kat:
        return 'Please select a floor.'
    if kat not in katlar:
        return 'Invalid floor selected for the chosen block.'

    siniflar = katlar[kat]
    if not sinif:
        return 'Please select a classroom.'
    if sinif not in siniflar:
        return 'Invalid classroom selected for the chosen block and floor.'

    if not gun:
        return 'Please select a day.'
    if gun not in ALLOWED_GUNLER:
        return 'Invalid day selected.'

    if not baslangic or not bitis:
        return 'Start and end times are required.'

    baslangic_dakika = saati_dakikaya_cevir(baslangic)
    bitis_dakika = saati_dakikaya_cevir(bitis)
    if baslangic_dakika is None or bitis_dakika is None:
        return 'Invalid time format.'
    if baslangic_dakika >= bitis_dakika:
        return 'Start time must be earlier than end time.'

    return None


def admin_panelini_render_et(error_message=None, form_data=None, status_code=200):
    supabase_hatasi = supabase_gerekli_html()
    if supabase_hatasi:
        return supabase_hatasi

    try:
        dersler = supabase.table('dersler').select('*').order('sinif').execute()
        return render_template(
            'admin.html',
            dersler=dersler.data or [],
            error_message=error_message,
            form_data=form_data or bos_admin_formu(),
            bloklar=list(SINIF_CONFIG.keys()),
            gunler=ALLOWED_GUNLER,
            day_labels=DAY_LABELS,
            sinif_config_json=json.dumps(SINIF_CONFIG, ensure_ascii=True),
        ), status_code
    except Exception:
        app.logger.exception('Admin paneli icin dersler alinamadi.')
        return 'Lesson data is currently unavailable.', 502


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/dersler')
def dersler():
    supabase_hatasi = supabase_gerekli_json()
    if supabase_hatasi:
        return supabase_hatasi

    try:
        response = supabase.table('dersler').select('*').execute()
        return jsonify(response.data or [])
    except Exception:
        app.logger.exception('/dersler verisi alinamadi.')
        return jsonify({'error': 'Lesson data is currently unavailable.'}), 502


@app.route('/admin-login')
def admin_login():
    if admin_oturumu_var_mi():
        return redirect(url_for('admin'))
    return admin_login_sayfasini_render_et()


@app.route('/admin-login', methods=['POST'])
def admin_login_post():
    ip_adresi = client_ip_adresi()
    kayit = login_deneme_kaydi(ip_adresi)
    girilen_sifre = (request.form.get('sifre') or '').strip()

    if login_engelli_mi(kayit):
        return admin_login_sayfasini_render_et(
            error_message=f'Too many failed attempts. Try again in {kalan_kilit_suresi(kayit)} seconds.',
            status_code=429,
            lockout_seconds=kalan_kilit_suresi(kayit),
        )

    if girilen_sifre != ADMIN_SIFRE:
        basarisiz_login_kaydet(ip_adresi)
        kayit = login_deneme_kaydi(ip_adresi)
        if login_engelli_mi(kayit):
            return admin_login_sayfasini_render_et(
                error_message=f'Too many failed attempts. Try again in {kalan_kilit_suresi(kayit)} seconds.',
                status_code=429,
                lockout_seconds=kalan_kilit_suresi(kayit),
            )
        return admin_login_sayfasini_render_et(
            error_message='Incorrect password. Please try again.',
            status_code=401,
        )

    login_kaydini_temizle(ip_adresi)
    session['admin_authenticated'] = True
    return redirect(url_for('admin'))


@app.route('/admin-logout')
def admin_logout():
    session.pop('admin_authenticated', None)
    return redirect(url_for('admin_login'))


@app.route('/admin')
def admin():
    if not admin_oturumu_var_mi():
        return redirect(url_for('admin_login'))

    return admin_panelini_render_et()


@app.route('/admin/ekle', methods=['POST'])
def admin_ekle():
    if not admin_oturumu_var_mi():
        return 'Unauthorized', 403

    form_data = admin_formunu_hazirla(request.form)
    dogrulama_hatasi = admin_formunu_dogrula(form_data)
    if dogrulama_hatasi:
        return admin_panelini_render_et(
            error_message=dogrulama_hatasi,
            form_data=form_data,
            status_code=400,
        )

    supabase_hatasi = supabase_gerekli_html()
    if supabase_hatasi:
        return supabase_hatasi

    try:
        supabase.table('dersler').insert({
            'blok': form_data['blok'],
            'sinif': form_data['sinif'],
            'gun': form_data['gun'],
            'baslangic': form_data['baslangic'],
            'bitis': form_data['bitis'],
        }).execute()
    except Exception:
        app.logger.exception('Ders ekleme islemi basarisiz oldu.')
        return admin_panelini_render_et(
            error_message='Lesson could not be added. Please try again.',
            form_data=form_data,
            status_code=502,
        )

    return redirect(url_for('admin'))


@app.route('/admin/sil', methods=['POST'])
def admin_sil():
    if not admin_oturumu_var_mi():
        return 'Unauthorized', 403

    supabase_hatasi = supabase_gerekli_html()
    if supabase_hatasi:
        return supabase_hatasi

    try:
        supabase.table('dersler').delete().eq('id', request.form.get('id')).execute()
    except Exception:
        app.logger.exception('Ders silme islemi basarisiz oldu.')
        return 'Lesson could not be deleted.', 502

    return redirect(url_for('admin'))


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
