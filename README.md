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
   - `GOOGLE_SHEETS_ID` : Masukkan ID Google Spreadsheet database sarpras Anda
   - `GOOGLE_APPS_SCRIPT_URL` : Masukkan URL deployment Web App Google Apps Script Anda
4. Klik **Redeploy** di Vercel.
5. Selesai! Semua endpoint API (`/api/rooms`, `/api/sarpras`, `/api/stats`, dll.) akan secara otomatis terhubung dan diproses oleh Vercel Serverless Function.
