/**
 * Santri Pocket Money Card Reader - Serial Listener & Broadcaster
 * 
 * This script connects to the main server's WebSocket channel and listens to
 * physical RFID/NFC/Magstripe reader inputs on a Serial/COM port.
 * 
 * If no hardware reader is connected, it runs in simulation mode so you can
 * test card-taps and UI response without needing physical hardware!
 */

const WebSocket = require('ws');
require('dotenv').config();

const port = process.env.PORT || 5000;
const wsUrl = `ws://localhost:${port}`;
const comPort = process.env.SERIAL_PORT || 'COM3';
const baudRate = parseInt(process.env.SERIAL_BAUD_RATE || '9600');

console.log('==================================================');
console.log('📡 RFID/NFC/Magnetic Stripe Hardware Listener');
console.log('==================================================');

let ws;
let reconnectInterval = 5000;

function connectWebsocket() {
  console.log(`Connecting to WebSocket server at ${wsUrl}...`);
  ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    console.log('✅ Connected to WebSockets server successfully.');
    console.log('🔊 Ready to transmit card scans to backend and frontend.');
  });

  ws.on('close', () => {
    console.log(`❌ Lost connection to server. Retrying in ${reconnectInterval/1000}s...`);
    setTimeout(connectWebsocket, reconnectInterval);
  });

  ws.on('error', (err) => {
    console.error('WebSocket connection error:', err.message);
  });
}

connectWebsocket();

// Try to initialize physical SerialPort
let physicalPortInitialized = false;

try {
  const { SerialPort } = require('serialport');
  const { ReadlineParser } = require('@serialport/parser-readline');

  console.log(`🔌 Attempting to open physical Serial Port ${comPort} at ${baudRate} baud...`);
  
  const serial = new SerialPort({
    path: comPort,
    baudRate: baudRate,
    autoOpen: false
  });

  serial.open((err) => {
    if (err) {
      console.warn(`⚠️ Could not open physical serial port ${comPort}: ${err.message}`);
      startSimulationMode();
      return;
    }

    physicalPortInitialized = true;
    console.log(`✅ Serial port ${comPort} is OPEN and active!`);

    const parser = serial.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    
    parser.on('data', (data) => {
      const cardUid = data.toString().trim();
      if (!cardUid) return;

      console.log(`✨ Card Tap Detected on Serial: [${cardUid}]`);
      sendScanEvent(cardUid, 'RFID');
    });
  });

} catch (error) {
  console.warn('⚠️ serialport module is not installed or failed to load.');
  console.warn('💡 Running in Simulator Mode. (You can also install serialport via "npm install serialport")');
  startSimulationMode();
}

function sendScanEvent(cardUid, tipeKartu = 'RFID') {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const payload = JSON.stringify({
      type: 'scan',
      card_uid: cardUid,
      tipe_kartu: tipeKartu
    });
    ws.send(payload);
    console.log(`📡 Broadcasted scanned card: ${cardUid} (${tipeKartu})`);
  } else {
    console.log(`🔴 Cannot send scan. Websocket state is not open. Card ID: ${cardUid}`);
  }
}

// Simulator Mode - triggers mock card taps for developer testing
function startSimulationMode() {
  if (physicalPortInitialized) return;

  const mockCards = [
    { uid: '1234567890', type: 'RFID', name: 'Ahmad Fauzi' },
    { uid: '0987654321', type: 'NFC', name: 'Muhammad Rizky' },
    { uid: '1122334455', type: 'MagneticStripe', name: 'Siti Aminah' },
    { uid: '9998887776', type: 'RFID', name: 'Unregistered Card' }
  ];

  console.log('\n--- 🎮 SIMULATOR MODE ACTIVE ---');
  console.log('To simulate a card tap, you can:');
  console.log('1. Press standard keys in your console OR');
  console.log('2. The simulator will automatically TAP a random mock card every 30 seconds.');
  console.log('--------------------------------\n');

  // Periodic mock taps
  setInterval(() => {
    const randomCard = mockCards[Math.floor(Math.random() * mockCards.length)];
    console.log(`🎮 [Simulation] Mock Tap Card: ${randomCard.uid} (${randomCard.type}) - ${randomCard.name}`);
    sendScanEvent(randomCard.uid, randomCard.type);
  }, 30000);

  // Read console input for custom simulation
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (text) => {
    const input = text.trim();
    if (!input) return;

    if (input === '1' || input === '2' || input === '3' || input === '4') {
      const idx = parseInt(input) - 1;
      const card = mockCards[idx];
      console.log(`🎮 [Simulation Key] Mock Tap Card: ${card.uid} (${card.type}) - ${card.name}`);
      sendScanEvent(card.uid, card.type);
    } else {
      console.log(`🎮 [Simulation Key] Custom Tap Card: [${input}]`);
      sendScanEvent(input, 'RFID');
    }
  });

  console.log('Type 1, 2, 3, or 4 in this terminal to tap a seeded card, or type any custom string to simulate an unregistered card scan:\n');
}
