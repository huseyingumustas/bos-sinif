# Classroom Availability System

A Flask-based web application that helps students quickly find available classrooms by displaying real-time classroom availability using Supabase as the backend database.

The application features an intuitive dashboard with classroom status filtering, floor plan support, logo integration, and a secure admin panel protected against repeated failed login attempts.

> **Note:** This project was developed using AI-assisted programming tools (OpenAI Codex/ChatGPT) under my direction. I defined the project requirements, reviewed and integrated the generated code, tested the application, and made iterative improvements throughout the development process.

---

## Features

- Real-time classroom availability
- Interactive dashboard
- Classroom status filtering
- Floor plan support
- Secure admin authentication
- Login lockout protection against repeated failed attempts
- CSRF protection for admin forms
- Responsive user interface

---

## Technologies

- Python
- Flask
- Supabase
- HTML
- CSS
- JavaScript

---

## Installation

### 1. Create a virtual environment

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### 2. Install dependencies

```powershell
pip install -r requirements.txt
```

### 3. Create the environment file

```powershell
copy .env.example .env
```

### 4. Configure environment variables

Fill the `.env` file with your own values:

```text
SUPABASE_URL=
SUPABASE_KEY=
ADMIN_PASSWORD=
FLASK_SECRET_KEY=
SESSION_COOKIE_SECURE=
```

`FLASK_SECRET_KEY` should be a strong, randomly generated secret key.

---

### 5. Run the application

```powershell
python app.py
```

---

### 6. Open in your browser

| Page | URL |
|------|-----|
| Home | http://127.0.0.1:5000/ |
| Admin Login | http://127.0.0.1:5000/admin-login |
| Admin Dashboard | http://127.0.0.1:5000/admin |
| Admin Logout | http://127.0.0.1:5000/admin-logout |

---

## Database Schema

The application expects a Supabase table named **`dersler`** containing at least the following fields:

- `id`
- `blok`
- `sinif`
- `gun`
- `baslangic`
- `bitis`

---

## Project Structure

```
.
├── app.py
├── requirements.txt
├── .env.example
├── static/
│   ├── css/
│   ├── js/
│   ├── images/
│   └── katplanlar/
├── templates/
└── README.md
```

---

## Security

- Production-ready session management
- Secure admin authentication
- CSRF protection
- Login lockout protection
- Sensitive configuration stored in `.env`
- HTTPS support through `SESSION_COOKIE_SECURE`

---

## Production Recommendations

- Keep `FLASK_DEBUG` disabled.
- Set `SESSION_COOKIE_SECURE=true` when using HTTPS.
- Use a strong and unpredictable `FLASK_SECRET_KEY`.
- Never commit your `.env` file to GitHub.
- Rotate secrets if they become compromised.

---

## Future Improvements

- Role-based authentication
- Classroom reservation system
- Live schedule synchronization
- Mobile-friendly interface
- Notification system
- Analytics dashboard

---

## License

This project is intended for educational purposes.
