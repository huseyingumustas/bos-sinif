# Bos Sinif

Okuldaki anlik bos siniflari gosteran kucuk bir Flask uygulamasi.

Son guncellemelerle birlikte dashboard tarafinda logo destekli gorunum, status filtresi ve admin tarafinda lockout korumasi bulunur.

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
- `FLASK_SECRET_KEY`

`FLASK_SECRET_KEY` production ortaminda zorunludur ve guvenli bir oturum anahtari olarak ayarlanmalidir.

5. Uygulamayi baslatin:

```powershell
python app.py
```

6. Tarayicida su adresleri acin:

- Ana ekran: `http://127.0.0.1:5000/`
- Admin girisi: `http://127.0.0.1:5000/admin-login`
- Admin paneli: giris sonrasinda `http://127.0.0.1:5000/admin`
- Admin cikisi: `http://127.0.0.1:5000/admin-logout`

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
- `/admin?sifre=...` akisi artik kullanilmaz.
- Admin girisi artik `/admin-login` uzerinden yapilir ve cikis `/admin-logout` ile yapilir.
- Dashboard arayuzunde logo destekli gorunum ve status filtresi bulunur.
- Admin girisinde tekrarli hatali denemelere karsi lockout korumasi vardir.
