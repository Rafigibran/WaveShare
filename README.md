# WaveShare

![WaveShare Preview](docs/images/waveshare-preview.jpg)

**WaveShare** is a self-hosted, browser-based file sharing application designed to make transferring files between phones, tablets, and computers simple, fast, and private.

It uses **WebRTC peer-to-peer connections** for file transfer whenever possible, while a lightweight server handles device discovery and signaling. No desktop or mobile application is required: users only need a modern web browser.

> **White-label ready:** replace the WaveShare name, logo, colors, screenshots, and copy with your own brand before distributing the project.

## ✨ Highlights

- **Cross-platform** — works with modern browsers on Android, iPhone, iPad, Windows, macOS, and Linux.
- **Peer-to-peer transfer** — files are transferred directly between connected browsers whenever a P2P path is available.
- **Room-based sharing** — devices can join the same room and discover each other automatically.
- **QR and share links** — make pairing another device quick and convenient.
- **Multiple files** — send several files in one transfer queue.
- **Transfer progress** — show file size, progress, speed, and transfer state.
- **Mobile-first UI** — designed for touch screens as well as desktop browsers.
- **No file storage by default** — the signaling server does not need to store the contents of transferred files.
- **Self-hostable** — run it on your own server and use your own domain.

## 🖼️ Preview

The interface is built around a minimal dark theme, electric-blue accents, a device radar visualization, and a simple transfer workflow.

![WaveShare interface preview](docs/images/waveshare-preview.jpg)

## 🔒 How It Works

WaveShare separates **signaling** from **file transfer**:

1. A browser opens WaveShare and joins a room.
2. The server exchanges signaling information so devices can discover and negotiate a connection.
3. WebRTC establishes a peer-to-peer DataChannel when the network allows it.
4. The selected file is split into chunks and sent through the DataChannel.
5. The receiving browser rebuilds the chunks into the original file and provides it for download.

The server is therefore primarily responsible for **presence and signaling**, not for storing the transferred file contents.

### Network compatibility

Direct P2P connections are not guaranteed on every network. Strict NAT, firewalls, corporate networks, carrier-grade NAT, or other network policies can prevent a direct connection.

For reliable public-internet deployments, configure a **TURN server** in addition to STUN.

## 🚀 Getting Started

### Requirements

- Node.js 18 or newer
- npm
- A modern web browser with WebRTC support

### Install

```bash
npm install
```

### Start

```bash
npm start
```

The application will be available at:

```text
http://localhost:3000
```

For testing on another device on the same local network, open the host machine's LAN address, for example:

```text
http://192.168.1.10:3000
```

For public deployment, use HTTPS and a WebSocket-compatible reverse proxy.

## 🌐 Production Deployment

WaveShare can be deployed on any environment capable of running Node.js and WebSocket connections.

Recommended production setup:

```text
Browser A ───────┐
                 │
                 ├── WebRTC P2P ── Browser B
                 │
Browser C ───────┘
                      
                 ↕ signaling
              WaveShare Server
```

For production:

- Use **HTTPS**.
- Use **WSS** for WebSocket signaling.
- Configure a **TURN server** for difficult networks.
- Put the Node.js application behind a reverse proxy such as Nginx, Caddy, or another WebSocket-aware proxy.
- Add rate limiting and authentication if your deployment is exposed publicly.
- Monitor connection errors, signaling traffic, and server resources.

## 🏷️ White-Label Customization

WaveShare is designed to be customized for your own product or organization.

Typical white-label changes include:

- Product name and tagline
- Logo and favicon
- Primary/accent colors
- Page title and metadata
- Hero text and descriptions
- Device name wording
- Privacy/legal pages
- Screenshots and marketing assets
- Domain name

Search the codebase for the existing **WaveShare** branding and replace it with your own product identity.

### Suggested brand areas

```text
WaveShare
├── Product name
├── Logo / favicon
├── UI accent colors
├── Browser title
├── Meta description
├── Landing-page copy
└── README / documentation
```

## 🧩 Architecture

```text
Frontend
  └─ Browser UI
      ├─ Device discovery
      ├─ Room management
      ├─ File picker / drag & drop
      └─ Transfer UI

Signaling Server
  ├─ Room presence
  ├─ Peer discovery
  └─ WebRTC signaling messages

WebRTC
  └─ DataChannel
      └─ File chunks
```

## 🛡️ Privacy

WaveShare is designed around direct browser-to-browser transfer. The application does not require uploading the selected file to a central file-storage service as part of the normal P2P transfer flow.

However, infrastructure operators can still observe normal server-level metadata such as network connections, request timing, IP addresses, or signaling traffic depending on the deployment configuration. Review and adapt the privacy policy before offering the service publicly.

## ⚙️ Configuration

Before production use, review the server and client configuration for:

- WebRTC STUN/TURN servers
- Allowed origins
- Room expiration / cleanup
- Signaling rate limits
- Maximum file sizes
- Reverse-proxy settings
- HTTPS certificates
- Logging and monitoring

## 📁 Project Structure

```text
WaveShare/
├── docs/
│   └── images/
│       └── waveshare-preview.jpg
├── public/
├── server.js
├── package.json
└── README.md
```

## 🧪 Development Notes

When modifying the project, verify the complete flow after every major change:

1. Open WaveShare in two separate browsers or devices.
2. Join the same room.
3. Confirm both devices become visible.
4. Start a small file transfer.
5. Test a larger file.
6. Test cancellation and failed connections.
7. Test the deployment over HTTPS/WSS.

## 📄 License

Add your preferred license here before publishing or redistributing this project.

## 🙌 Credits

WaveShare is an independent white-label file-sharing project inspired by the idea of simple browser-to-browser file transfer.

Replace this section with your own company, project, author, and attribution information when publishing your customized version.
