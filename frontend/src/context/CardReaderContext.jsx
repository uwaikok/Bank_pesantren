import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

const CardReaderContext = createContext(null);

export const useCardReader = () => {
  const context = useContext(CardReaderContext);
  if (!context) {
    throw new Error('useCardReader must be used within a CardReaderProvider');
  }
  return context;
};

export const CardReaderProvider = ({ children }) => {
  const [lastCard, setLastCard] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [alertMessage, setAlertMessage] = useState(null);
  
  // Buffers for HID Keyboard Emulation
  const bufferRef = useRef([]);
  const lastKeyTimeRef = useRef(0);
  const scanCallbacksRef = useRef(new Set());

  // Function to register direct components listeners (e.g. Kasir or Registration Form)
  const registerListener = (callback) => {
    scanCallbacksRef.current.add(callback);
    return () => {
      scanCallbacksRef.current.delete(callback);
    };
  };

  // Process a card UID scan from any source
  const handleCardScan = (cardUid, tipeKartu = 'RFID') => {
    const cleanedUid = cardUid.trim();
    if (!cleanedUid) return;

    console.log(`🎴 Card Scanned: ${cleanedUid} (${tipeKartu})`);
    
    const cardData = {
      uid: cleanedUid,
      tipe: tipeKartu,
      timestamp: new Date().toLocaleTimeString('id-ID')
    };

    setLastCard(cardData);
    
    // Trigger temporary alert banner
    setAlertMessage(`Kartu terdeteksi: ${cleanedUid} (${tipeKartu})`);
    setTimeout(() => setAlertMessage(null), 4000);

    // Notify all registered page listeners
    scanCallbacksRef.current.forEach(callback => {
      try {
        callback(cardData);
      } catch (err) {
        console.error('Error executing scan callback:', err);
      }
    });
  };

  // --- MODE A: Keyboard Emulation (HID USB Reader) Listener ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Card readers type extremely fast (usually < 30ms between characters)
      // Humans type slower (> 80ms). We reset the buffer if the gap is too long.
      // But if it's the first key in a while, that's fine.
      if (timeDiff > 50 && bufferRef.current.length > 0 && e.key !== 'Enter') {
        bufferRef.current = [];
      }

      // Buffer printable characters
      if (e.key.length === 1) {
        bufferRef.current.push(e.key);
      } 
      // Most readers send 'Enter' at the end of the sequence
      else if (e.key === 'Enter') {
        const fullString = bufferRef.current.join('');
        // Validate card scanner speed and length (most card UIDs are 8-15 digits long)
        if (fullString.length >= 4) {
          e.preventDefault(); // Stop form submission if focused on a form
          handleCardScan(fullString, 'KeyboardEmulation');
        }
        bufferRef.current = [];
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // --- MODE B: WebSockets (Serial COM Port Reader) Listener ---
  useEffect(() => {
    let ws;
    let reconnectTimer;

    const connect = () => {
      // Build WebSocket URL relative to the backend server
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Express and WebSocket reside on localhost:5000 during dev, or can be overridden in production
      const wsUrl = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.hostname}:5000`;
      
      setWsStatus('connecting');
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsStatus('connected');
        console.log('🔌 WebSocket connected to card reader hub.');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'card_scanned') {
            handleCardScan(data.card_uid, data.tipe_kartu);
          }
        } catch (err) {
          console.error('Error parsing WebSocket data:', err);
        }
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        reconnectTimer = setTimeout(connect, 4000);
      };

      ws.onerror = (err) => {
        console.error('WS Error:', err);
        ws.close();
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimer);
    };
  }, []);

  return (
    <CardReaderContext.Provider value={{ lastCard, wsStatus, registerListener, handleCardScan }}>
      {children}
      {/* Real-time Toast/Banner indicating a Card was Tapped */}
      {alertMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-4 rounded-xl shadow-2xl border border-emerald-500/30 animate-bounce duration-500">
          <div className="w-3 h-3 rounded-full bg-white animate-ping"></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Sensor Kartu Aktif</p>
            <p className="font-bold text-sm">{alertMessage}</p>
          </div>
        </div>
      )}
    </CardReaderContext.Provider>
  );
};
