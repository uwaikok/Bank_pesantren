const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const app = require('./src/app');
const port = process.env.PORT || 5000;

// API endpoint to manually broadcast a card scan (alternative to raw WebSockets)
app.post('/api/kartu/scan', (req, res) => {
  const { card_uid, tipe_kartu } = req.body;
  if (!card_uid) {
    return res.status(400).json({ success: false, message: 'Card UID is required.' });
  }

  const broadcastMessage = JSON.stringify({
    type: 'card_scanned',
    card_uid,
    tipe_kartu: tipe_kartu || 'RFID',
    timestamp: new Date().toISOString()
  });

  // Broadcast to all connected WebSocket clients
  let clientsCount = 0;
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(broadcastMessage);
      clientsCount++;
    }
  });

  console.log(`📡 Broadcasted scan: ${card_uid} to ${clientsCount} clients`);
  res.json({ success: true, message: `Scan broadcasted to ${clientsCount} clients.` });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('🔌 New client connected to WebSocket Server');

  // Handle incoming messages (e.g. from the hardware_listener.js)
  ws.on('message', (messageText) => {
    try {
      const message = JSON.parse(messageText);
      console.log('📥 Received WS message:', message);

      // If hardware scanned a card, broadcast it to all frontend clients
      if (message.type === 'scan') {
        const broadcastData = JSON.stringify({
          type: 'card_scanned',
          card_uid: message.card_uid,
          tipe_kartu: message.tipe_kartu || 'RFID',
          timestamp: new Date().toISOString()
        });

        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(broadcastData);
          }
        });
        console.log(`📡 Broadcasted hardware scan: ${message.card_uid} from serial listener`);
      }
    } catch (e) {
      console.error('Failed to parse WS message:', e.message);
    }
  });

  ws.on('close', () => {
    console.log('🔌 Client disconnected from WebSocket Server');
  });
});

// Start Server
server.listen(port, () => {
  console.log(`🚀 Admin Server is running on http://localhost:${port}`);
  console.log(`🔌 WebSocket server is active on ws://localhost:${port}`);
});
