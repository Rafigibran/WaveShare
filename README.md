# WaveShare

WaveShare is a browser-based file-sharing application with a minimal dark UI and direct peer-to-peer (P2P) transfers powered by WebRTC.

## Features

- Shareable rooms through URLs or QR codes.
- Device discovery within a room using WebSocket signaling.
- Direct file transfers using WebRTC DataChannels.
- 64 KB chunking with backpressure for safer transfers, especially on mobile browsers.
- Multi-file transfers.
- Transfer progress indicators.
- Basic transfer speed information.
- Transfer cancellation.
- File downloads.
- File contents are not uploaded to the server by default.
- Responsive design for Android, iPhone/iPad, Windows, macOS, and Linux using modern browsers.

## Run Locally

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

### Test on the Same Wi-Fi Network

To test WaveShare with other devices connected to the same Wi-Fi network, open the computer's local IP address from another device.

For example:

```text
http://192.168.1.10:3000
```

Replace `192.168.1.10` with the local IP address of the computer running WaveShare.

## Deployment

WaveShare can be deployed on any hosting environment that supports Node.js and WebSocket connections.

For public internet deployment, HTTPS is strongly recommended because modern browsers and networks provide better compatibility with secure contexts and `wss://` WebSocket connections.

## How It Works

WaveShare uses a WebSocket signaling server to help devices discover each other and exchange the information required to establish a WebRTC connection.

Once the WebRTC connection is established, files are transferred directly between the participating devices through a WebRTC DataChannel.

The signaling server does **not** upload or store file contents by default.

```text
Device A
   │
   │ WebSocket Signaling
   ▼
Signaling Server
   ▲
   │ WebSocket Signaling
   │
Device B

Device A ◄──── WebRTC DataChannel ────► Device B
                  File Transfer
```

## File Transfer

WaveShare splits files into **64 KB chunks** before sending them through the WebRTC DataChannel.

Backpressure is used to prevent the browser from being overwhelmed by too much buffered data, which is particularly important when transferring large files on mobile devices.

Multiple files can be transferred in the same session, with progress and basic transfer-speed information displayed to the user.

## Network Limitations

A direct P2P connection cannot always be established successfully.

Strict NAT configurations, firewalls, carrier networks, or other network restrictions may prevent two devices from connecting directly.

WaveShare uses a public STUN server by default to assist with WebRTC connection establishment. For production deployments, it is recommended to configure your own TURN server for better connectivity across restrictive networks.

## Production Recommendations

For a production deployment, consider:

- Using HTTPS.
- Using secure WebSockets (`wss://`).
- Configuring your own STUN/TURN infrastructure.
- Adding rate limiting to the signaling server.
- Adding room expiration and cleanup.
- Limiting room sizes and connection counts.
- Validating signaling messages.
- Monitoring WebSocket connections and server resources.
- Implementing appropriate abuse-prevention measures.

## Privacy

WaveShare is designed around direct peer-to-peer file transfers.

By default, file contents are transferred directly between connected devices rather than being uploaded to the application server.

However, signaling information is still exchanged through the signaling server to establish the WebRTC connection.

Users should understand that actual P2P connectivity depends on their network configuration and WebRTC infrastructure.

## Supported Platforms

WaveShare is designed to work with modern browsers on:

- Android
- iPhone
- iPad
- Windows
- macOS
- Linux

Actual performance and P2P connectivity may vary depending on the browser, device, network, firewall, NAT configuration, and available WebRTC support.

## License

Add your project's license information here.

## Contributing

Contributions, bug reports, feature requests, and improvements are welcome.

Before submitting a pull request, please ensure that your changes have been tested on supported browsers and devices where applicable.
