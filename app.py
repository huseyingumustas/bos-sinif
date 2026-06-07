from datetime import datetime
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


def admin_oturumu_var_mi():
    return session.get('admin_authenticated') is True


def supabase_gerekli_json():
    if supabase is None:
        return jsonify({'error': 'Veri kaynagina su anda ulasilamiyor.'}), 503
    return None


def supabase_gerekli_html():
    if supabase is None:
        return 'Veri kaynagina su anda ulasilamiyor.', 503
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
        return 'Lutfen blok secin.'
    if blok not in SINIF_CONFIG:
        return 'Gecersiz blok secildi.'

    katlar = SINIF_CONFIG[blok]
    if not kat:
        return 'Lutfen kat secin.'
    if kat not in katlar:
        return 'Secilen blok icin gecersiz kat secildi.'

    siniflar = katlar[kat]
    if not sinif:
        return 'Lutfen sinif secin.'
    if sinif not in siniflar:
        return 'Secilen blok ve kat icin gecersiz sinif secildi.'

    if not gun:
        return 'Lutfen gun secin.'
    if gun not in ALLOWED_GUNLER:
        return 'Gecersiz gun secildi.'

    if not baslangic or not bitis:
        return 'Baslangic ve bitis saatleri zorunludur.'

    baslangic_dakika = saati_dakikaya_cevir(baslangic)
    bitis_dakika = saati_dakikaya_cevir(bitis)
    if baslangic_dakika is None or bitis_dakika is None:
        return 'Saat formati gecersiz.'
    if baslangic_dakika >= bitis_dakika:
        return 'Baslangic saati bitis saatinden once olmalidir.'

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
            sinif_config_json=json.dumps(SINIF_CONFIG, ensure_ascii=True),
        ), status_code
    except Exception:
        app.logger.exception('Admin paneli icin dersler alinamadi.')
        return 'Ders verileri su anda getirilemiyor.', 502


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
        return jsonify({'error': 'Ders verileri su anda getirilemiyor.'}), 502


@app.route('/admin-login')
def admin_login():
    if admin_oturumu_var_mi():
        return redirect(url_for('admin'))
    return render_template('admin_login.html', error_message=None), 200


@app.route('/admin-login', methods=['POST'])
def admin_login_post():
    girilen_sifre = (request.form.get('sifre') or '').strip()

    if girilen_sifre != ADMIN_SIFRE:
        return render_template(
            'admin_login.html',
            error_message='Sifre hatali. Lutfen tekrar deneyin.',
        ), 401

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
        return 'Yetkisiz', 403

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
            error_message='Ders eklenemedi. Lutfen tekrar deneyin.',
            form_data=form_data,
            status_code=502,
        )

    return redirect(url_for('admin'))


@app.route('/admin/sil', methods=['POST'])
def admin_sil():
    if not admin_oturumu_var_mi():
        return 'Yetkisiz', 403

    supabase_hatasi = supabase_gerekli_html()
    if supabase_hatasi:
        return supabase_hatasi

    try:
        supabase.table('dersler').delete().eq('id', request.form.get('id')).execute()
    except Exception:
        app.logger.exception('Ders silme islemi basarisiz oldu.')
        return 'Ders silinemedi.', 502

    return redirect(url_for('admin'))


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
