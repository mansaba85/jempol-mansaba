# Blueprint Project: Absensi MANSABA 🚀
**Instansi:** MA NU 01 Banyuputih
**Tech Stack:** React, TypeScript, Node.js, Prisma, MySQL, Cloudflare Tunnel.

---

## 📅 Objektif Utama
1.  Menggantikan desktop *Attendance Manager* ke sistem berbasis web yang bisa diakses via internet.
2.  Sinkronisasi data otomatis/manual dari mesin **Solution X105 (IP: 192.168.8.200)**.
3.  Pengelolaan data kehadiran Guru & Karyawan secara terpusat.
4.  **Fitur Utama:** Perhitungan otomatis **Honor Transportasi** berdasarkan jumlah kehadiran bulanan.

---

## ✅ Progres Terakhir (April 2026)

### Tahap 1: Core Foundation & Sync Logic
1.  **Atomic Transactional Logic:** Pendaftaran dan pembaruan pegawai kini menggunakan `prisma.$transaction`.
2.  **Flexible Role System:** Kolom `Role` bersifat dinamis (String) mendukung kategori sesuai jam kerja.
3.  **Selective Machine Sync:** Data log hanya ditarik jika ID pegawai sudah terdaftar di sistem.
4.  **Advanced UI:** Pagination, Filter Peran, dan `react-hot-toast` untuk feedback real-time.

### Tahap 2: Attendance Reporting & Printing Excellence
1.  **Robust Report Backend:** Endpoint `/api/reports/detailed` telah distabilkan dengan library `date-fns` untuk parsing tanggal ISO (YYYY-MM-DD) dan formatting tampilan (DD/MM/YYYY).
2.  **Standardized Admin UI:** Menambahkan padding atas (`pt-8`) pada `AppContent.tsx` untuk menjaga konsistensi judul halaman di seluruh modul admin.
3.  **Professional Printing System:** Implementasi cetak ke tab baru berbasis HTML/CSS murni (tanpa library PDF yang berat). 
    - Menghasilkan file cetak yang ringan dan sangat tajam.
    - Mendukung format **Kop Lembaga Modern** (Logo, Nama Sekolah, Alamat).
    - Layout identitas pegawai menggunakan sistem grid yang rapi.
4.  **Bulk Printing Feature:** Menambahkan kemampuan cetak laporan detil seluruh pegawai sekaligus dengan fitur otomatis pindah halaman (*page-break-after*) di setiap pergantian data pegawai.
5.  **Enhanced Table Readability:** Header tabel global diperbarui dengan font lebih besar (13px), ultra-bold, dan uppercase untuk kesan institusi yang lebih tegas.

---

## 🛡️ Protokol Pengembangan (Wajib Diikuti)
1.  **Data Consistency:** Backend menggunakan format ISO (`YYYY-MM-DD`) untuk kalkulasi internal. Hanya transform ke format lokal (`DD/MM/YYYY`) di layer presentasi atau output print.
2.  **Institutional Aesthetics:** Setiap elemen cetak wajib menyertakan identitas lembaga yang diambil dari tabel `Settings` agar dinamis.
3.  **Print Performance:** Gunakan `page-break-after: always` untuk pemisah data pegawai pada laporan grup agar hasil cetak tidak terpotong (terutama di kertas A4).
4.  **UI Integrity:** Jangan menghapus padding global di `AppContent.tsx` agar elemen UI tidak menempel ke border atas jendela browser.
5.  **Schema Consistency:** Pastikan tipe data `employeeId` konsisten antara `String` dan `Number` (saat ini sistem banyak melakukan casting ke String untuk fleksibilitas ID mesin).

---

---

## 📦 Deployment Guide

Project ini sudah dirancang untuk **Universal Deployment** (Single Port).

### 1. Panel Biasa (aaPanel / cPanel / FastPanel)
- Paste kode project ke root directory.
- Setup **Node.js Manager**:
  - Run Script: `npm run build` (di root) untuk compile Frontend & Backend.
  - Startup File: `server/dist/index.js`.
  - Port: `3001` (atau sesuaikan di `.env`).
- Database: Gunakan MySQL asli yang ada di panel, masukkan URL-nya ke `.env`.

### 2. Portainer / Docker
- Gunakan `docker-compose.yml` yang sudah disediakan.
- Jalankan perintah: `docker-compose up -d --build`.
- Aplikasi akan otomatis melakukan `prisma migrate deploy` saat container menyala.

### 3. Akses Mandiri (LAN)
- Jalankan di komputer PC Windows yang satu jaringan dengan Mesin Absensi.
- Gunakan `npm run dev` pada folder `client` dan server.
- Akses via IP LAN (contoh: `http://192.168.1.100:5173`).
