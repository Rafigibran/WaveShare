import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const rooms = new Map();

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

function safeSend(ws, payload) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
}
function getRoom(code) {
  if (!rooms.has(code)) rooms.set(code, new Map());
  return rooms.get(code);
}
function broadcastPresence(code) {
  const room = rooms.get(code);
  if (!room) return;
  const devices = [...room.values()].map(({ id, name }) => ({ id, name }));
  for (const peer of room.values()) safeSend(peer.ws, { type: 'presence', devices });
}
function remove(ws) {
  const meta = ws.meta;
  if (!meta) return;
  const room = rooms.get(meta.room);
  if (!room) return;
  room.delete(meta.id);
  if (room.size === 0) rooms.delete(meta.room);
  else broadcastPresence(meta.room);
}

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.type === 'join') {
      const roomCode = String(msg.room || '').slice(0, 64);
      if (!roomCode) return safeSend(ws, { type: 'error', message: 'Room tidak valid.' });
      const id = crypto.randomUUID();
      const name = String(msg.name || 'Unknown Device').slice(0, 40);
      ws.meta = { room: roomCode, id, name };
      getRoom(roomCode).set(id, { ws, id, name });
      safeSend(ws, { type: 'joined', id, room: roomCode });
      broadcastPresence(roomCode);
      return;
    }

    if (!ws.meta) return;
    const room = rooms.get(ws.meta.room);
    if (!room) return;

    if (msg.type === 'rename') {
      const name = String(msg.name || '').trim().slice(0, 40) || 'Unnamed Device';
      ws.meta.name = name;
      const self = room.get(ws.meta.id);
      if (self) self.name = name;
      broadcastPresence(ws.meta.room);
      return;
    }

    if (msg.type === 'signal') {
      const target = room.get(msg.to);
      if (!target) return safeSend(ws, { type: 'signal-error', message: 'Perangkat tujuan sudah tidak tersedia.' });
      safeSend(target.ws, { type: 'signal', from: ws.meta.id, data: msg.data });
    }
  });
  ws.on('close', () => remove(ws));
  ws.on('error', () => remove(ws));
});

const port = Number(process.env.PORT || 3000);
server.listen(port, '0.0.0.0', () => {
  console.log(`WaveShare running on http://localhost:${port}`);
});
