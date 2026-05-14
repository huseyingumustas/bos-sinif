from flask import Flask, render_template, jsonify, request, redirect 
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dersler')
def dersler():
    response = supabase.table('dersler').select('*').execute()
    return jsonify(response.data)

ADMIN_SIFRE = os.getenv('ADMIN_SIFRE')

@app.route('/admin')
def admin():
    sifre = request.args.get('sifre')
    if sifre != ADMIN_SIFRE:
        return '''
        <form action="/admin">
            <input name="sifre" type="password" placeholder="Şifre">
            <button type="submit">Giriş</button>
        </form>
        '''
    dersler = supabase.table('dersler').select('*').order('sinif').execute()
    return render_template('admin.html', dersler=dersler.data, sifre=sifre)
@app.route('/admin/ekle', methods=['POST'])
def admin_ekle():
    sifre = request.form.get('sifre')
    if sifre != ADMIN_SIFRE:
        return 'Yetkisiz', 403
    
    supabase.table('dersler').insert({
        'blok': request.form.get('blok'),
        'sinif': request.form.get('sinif'),
        'gun': request.form.get('gun'),
        'baslangic': request.form.get('baslangic'),
        'bitis': request.form.get('bitis'),
    }).execute()
    
    return redirect(f'/admin?sifre={sifre}')

@app.route('/admin/sil', methods=['POST'])
def admin_sil():
    sifre = request.form.get('sifre')
    if sifre != ADMIN_SIFRE:
        return 'Yetkisiz', 403
    
    supabase.table('dersler').delete().eq('id', request.form.get('id')).execute()
    
    return redirect(f'/admin?sifre={sifre}')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
