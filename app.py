from flask import Flask, render_template, jsonify
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

if __name__ == '__main__':
    app.run(debug=True)