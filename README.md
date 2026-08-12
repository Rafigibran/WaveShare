# WaveShare

WaveShare adalah aplikasi berbagi file berbasis browser dengan UI dark minimalis dan transfer langsung P2P menggunakan WebRTC.

## Fitur
- Room yang bisa dibagikan lewat URL atau QR.
- Discovery perangkat dalam room melalui WebSocket signaling.
- WebRTC DataChannel untuk transfer file langsung.
- Chunking 64 KB + backpressure agar lebih aman untuk browser mobile.
- Multi-file transfer, progress, kecepatan sederhana, cancel, dan download.
- Tidak mengunggah isi file ke server sebagai default.
- Responsive untuk Android, iPhone/iPad, Windows, macOS, dan Linux selama memakai browser modern.

## Jalankan lokal
```bash
npm install
npm start
```
Buka `http://localhost:3000`.

Untuk pengujian di jaringan Wi‑Fi yang sama, buka IP komputer, misalnya `http://192.168.1.10:3000`, dari perangkat lain.

## Deploy
Gunakan hosting yang menjalankan Node.js dan WebSocket. Untuk penggunaan internet publik, aktifkan HTTPS karena browser dan jaringan modern lebih kompatibel dengan `wss://` dan konteks aman.

### Catatan penting
Tidak ada jaminan semua kombinasi jaringan dapat membuat koneksi P2P langsung. NAT/firewall ketat dapat membutuhkan TURN server. Aplikasi ini memasang STUN publik sebagai default; untuk produksi skala besar, tambahkan TURN sendiri dan rate-limiting pada signaling server.
