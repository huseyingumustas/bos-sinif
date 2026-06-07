# Bos Sinif

Okuldaki anlik bos siniflari gosteran kucuk bir Flask uygulamasi.

## Teknolojiler

- Python
- Flask
- Supabase
- Duz HTML, CSS ve JavaScript

## Kurulum

1. Sanal ortam olusturun:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

2. Bagimliliklari yukleyin:

```powershell
pip install -r requirements.txt
```

3. Ortam degiskenlerini hazirlayin:

```powershell
copy .env.example .env
```

4. `.env` icini kendi degerlerinizle doldurun:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `ADMIN_SIFRE`

5. Uygulamayi baslatin:

```powershell
python app.py
```

6. Tarayicida su adresleri acin:

- Ana ekran: `http://127.0.0.1:5000/`
- Admin paneli: `http://127.0.0.1:5000/admin?sifre=ADMIN_SIFRE`

## Beklenen Supabase Tablosu

`dersler` tablosunda en az su alanlar bekleniyor:

- `id`
- `blok`
- `sinif`
- `gun`
- `baslangic`
- `bitis`

## Notlar

- Bos veya dolu hesaplamasi istemci tarafinda yapilir.
- Kat planlari su an statik dosya olarak `static/katplanlar/` altinda tutulur.
- Admin girisi su an basit bir sifre kontrolu ile calisir.
