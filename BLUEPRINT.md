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
1.  **Atomic Transactional Logic:** Pendaftaran dan pembaruan pegawai kini menggunakan `prisma.$transaction`. Profil dan penugasan jadwal disimpan sekaligus atau tidak sama sekali (menjamin integritas data).
2.  **Flexible Role System:** Mengubah kolom `Role` dari Enum ke **String**. Sistem sekarang mendukung kategori pegawai yang dinamis sesuai nama Kontainer Jadwal yang dibuat user.
3.  **Selective Machine Sync:** Sinkronisasi mesin sekarang mengabaikan "Pegawai Tanpa Nama". Data log absensi hanya akan ditarik jika ID pegawai sudah dikenal di aplikasi.
4.  **Premium Feedback System:** Mengintegrasikan `react-hot-toast` untuk notifikasi melayang yang modern dan informatif (menampilkan detail error dari server).
5.  **Advanced Data Control:** Menambahkan fitur **Pagination** (10 data/halaman) dan **Filter Peran** pada tabel pegawai untuk performa yang lebih ringan.

---

## 🛡️ Protokol Pengembangan (Wajib Diikuti)
1.  **Data Integrity:** Gunakan `Set` untuk memfilter duplikasi `shiftId` sebelum dikirim ke database.
2.  **Error Handling:** Selalu teruskan pesan error asli dari database ke frontend agar diagnosa masalah lebih cepat.
3.  **Responsive Design:** Gunakan utility class Tailwind yang responsif (`md:`, `lg:`) pada setiap tabel dan dashboard.
4.  **Schema Updates:** Jika mengubah `schema.prisma`, pastikan menjalankan `npx prisma generate` setelah menghentikan server untuk mendaftarkan tipe data baru.
