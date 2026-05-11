# 🚀 Jariku MANSABA - Sistem Presensi & Honorarium

Sistem manajemen kehadiran Guru & Karyawan **MA NU 01 Banyuputih** berbasis web yang terintegrasi langsung dengan mesin sidik jari **Solution X105**.

---

## ✨ Fitur Utama
- **Sinkronisasi Multi-Mesin:** Tarik data log otomatis dari perangkat ZKTeco/Solution via jaringan lokal.
- **Logika Jadwal Fleksibel:** Penanganan shift kerja yang dinamis (Guru, Staff, Security, dll).
- **Kalkulasi Honor Transport:** Perhitungan otomatis biaya transportasi berdasarkan kehadiran bulanan.
- **Laporan Cetak Modern:** Laporan detil & rekapitulasi siap cetak dengan format Kop Lembaga resmi.
- **Universal Deployment:** Dapat dijalankan di PC Lokal (Windows), VPS, Docker, maupun Shared Hosting (aaPanel/cPanel).

---

## 🛠️ Tech Stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Database:** MySQL + Prisma ORM
- **Perangkat:** node-zklib (Integration with Solution X105)

---

## 🚀 Panduan Instalasi Lokal

### 1. Persiapan
- Install **Node.js** (v18 ke atas)
- Install **MySQL** (XAMPP/Laragon)

### 2. Setup Project
```bash
# Clone repository
git clone https://github.com/mansaba85/jempol-mansaba.git
cd jempol-mansaba

# Install semua dependensi (Root, Client, Server)
npm run install:all
```

### 3. Konfigurasi
Copy file `.env.example` menjadi `.env` dan sesuaikan pengaturan database Anda:
```env
DATABASE_URL="mysql://root:@localhost:3306/mansaba_absensi"
PORT=3001
```

### 4. Jalankan Development
Jalankan backend & frontend secara bersamaan:
```bash
# Di terminal 1 (Server)
cd server
npm run dev

# Di terminal 2 (Frontend)
cd client
npm run dev
```

---

## 📦 Panduan Deployment (Produksi)

Aplikasi ini mendukung **Single-Port Deployment** di mana backend melayani frontend secara langsung.

### Mode Panel (aaPanel / cPanel)
1. Upload semua file ke server.
2. Jalankan perintah build di root:
   ```bash
   npm run build
   ```
3. Setup Node.js Application pada panel:
   - **Main File:** `server/dist/index.js`
   - **Port:** `3001` (atau sesuai `.env`)
4. Jalankan `npx prisma migrate deploy` di folder server untuk menyiapkan tabel database.

### Mode Docker / Portainer
Cukup jalankan:
```bash
docker-compose up -d --build
```
Aplikasi akan aktif di `http://localhost:3001`.

---

## ⚙️ Mengganti Port
- **Backend:** Ubah variabel `PORT` di file `.env`.
- **Frontend (Dev):** Jika port backend berubah, update `target` di `client/vite.config.ts`.

---

## 🛠️ Buku Saku IT: Troubleshooting Jaringan & Server
**Kombinasi:** Proxmox (Lokal Sekolah) + Portainer + VPS aaPanel (IP VPS: 62.72.7.236)

### KASUS 1: Internet Sekolah Sempat Mati / Mati Lampu
**Gejala:** Website `jariku.manubanyuputih.id` bisa dibuka tampilannya (karena PWA/Cache), tapi tidak bisa login (gagal sinkronisasi / semua data 0).
**Penyebab:** Terowongan SSH (*Reverse Tunnel*) antara Proxmox Sekolah dan VPS terputus, dan port di VPS mengalami "nyangkut" (*zombie port*).

**Solusi Langkah Demi Langkah:**
1. **Buka Terminal di VPS aaPanel (IP: 62.72.7.236)** dan bersihkan port yang nyangkut dengan mengetik:
   ```bash
   fuser -k 8080/tcp
   ```
2. **Buka Terminal di Proxmox Lokal Sekolah (CT Portainer)** dan jalankan ulang terowongan:
   ```bash
   systemctl restart mansaba-tunnel.service
   ```
3. **(Opsional)** Jika masih lambat, masuk ke web Portainer lokal, centang kontainer `mansaba_app`, lalu tekan **Restart**.

### KASUS 2: Cek Cepat Kesehatan Server Lokal
Jika ada guru komplain tidak bisa absen melalui HP dari rumah:
1. Saat di lingkungan sekolah (pakai WiFi lokal), coba akses alamat ini:
   ```text
   http://192.168.8.138:8085/
   ```
2. Jika halaman ini **bisa dibuka** dengan lancar, berarti server lokal 100% sehat. Masalah utamanya pasti ada di jaringan/tunnel (kembali lakukan Solusi KASUS 1).

---

## 📜 Lisensi
Dikembangkan untuk internal **MA NU 01 Banyuputih**. Seluruh data dan hak cipta milik institusi terkait.
