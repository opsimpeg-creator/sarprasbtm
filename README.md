# SMKN 1 Batumandi - Sarpras & Siteplan System

Sistem Manajemen Sarana Prasarana dan Peta Interactive Siteplan SMKN 1 Batumandi.

## Deployment ke Vercel

Proyek ini telah dikonfigurasi agar dapat di-deploy secara langsung ke **Vercel** sebagai aplikasi Full-Stack (Frontend Vite + Backend Express Serverless API).

### Langkah-Langkah Deployment:
1. Commit dan Push seluruh perubahan terbaru ke repository GitHub Anda (`main` branch):
   ```bash
   git add .
   git commit -m "Add Vercel serverless configuration for API backend"
   git push origin main
   ```
2. Buka Dashboard Vercel dan pilih proyek Anda (`sarprasbtm`).
3. Masuk ke **Settings** -> **Environment Variables**, kemudian tambahkan variabel berikut:
   - `GOOGLE_SHEETS_ID` : `1eLuivd_i6h3vl1CtM2n7ousp98NP5cwkyPFMEzUveC0`
   - `GOOGLE_APPS_SCRIPT_URL` : `https://script.google.com/macros/s/AKfycbzi4ytGLJtfbDEQqLA-m5MnOTqJsKP5Aj2ALuZyMPhphUPz45o4d1FqvsoeQZt5QC36KA/exec`
4. Klik **Redeploy** di Vercel.
5. Selesai! Semua endpoint API (`/api/rooms`, `/api/sarpras`, `/api/stats`, dll.) akan secara otomatis terhubung dan diproses oleh Vercel Serverless Function.
