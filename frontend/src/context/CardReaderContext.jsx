import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

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
  // readerActivity: tracks when last card was tapped (for honest status indicator)
  const [readerActivity, setReaderActivity] = useState(null); // { uid, timestamp }

  // Buffers for HID Keyboard Emulation
  const bufferRef = useRef([]);
  const lastKeyTimeRef = useRef(0);
  const scanCallbacksRef = useRef(new Set());

  // Debounce guard: prevent double-scan within 1500ms
  const lastScanTimeRef = useRef(0);
  const lastScanUidRef = useRef('');

  // Function to register direct component listeners (e.g. Kasir or Registration Form)
  const registerListener = useCallback((callback) => {
    scanCallbacksRef.current.add(callback);
    return () => {
      scanCallbacksRef.current.delete(callback);
    };
  }, []);

  // Process a card UID scan from any source
  const handleCardScan = useCallback((cardUid, tipeKartu = 'RFID') => {
    const cleanedUid = cardUid.trim();
    if (!cleanedUid) return;

    // ── Debounce: Ignore duplicate scan of same card within 1500ms ──
    const now = Date.now();
    if (cleanedUid === lastScanUidRef.current && now - lastScanTimeRef.current < 1500) {
      console.warn(`⏱️ Double-scan blocked: ${cleanedUid} (${now - lastScanTimeRef.current}ms ago)`);
      return;
    }
    lastScanTimeRef.current = now;
    lastScanUidRef.current = cleanedUid;

    console.log(`🎴 Card Scanned: ${cleanedUid} (${tipeKartu})`);

    const cardData = {
      uid: cleanedUid,
      tipe: tipeKartu,
      timestamp: new Date().toLocaleTimeString('id-ID')
    };

    setLastCard(cardData);
    setReaderActivity({ uid: cleanedUid, at: now });

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
  }, []);

  // ─── MODE A: Keyboard Emulation (HID USB Reader) Listener ───────────────
  // Strategy:
  //   - RFID readers type characters < 30ms apart; humans type > 80ms apart.
  //   - When we detect "fast" typing, we PREVENT the keystrokes from reaching
  //     whatever field is currently focused (e.preventDefault), buffering them
  //     internally until Enter arrives.
  //   - This prevents reader input from "leaking" into Keterangan / Operator fields.
  useEffect(() => {
    // Track whether we're "inside" a reader sequence
    let inReaderSequence = false;

    const handleKeyDown = (e) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // ── Detect start of a possible reader sequence ──
      // If gap since last key is short (< 50ms) and a printable char arrives,
      // assume reader is typing — start blocking it from focused fields.
      if (timeDiff < 50 && e.key.length === 1) {
        inReaderSequence = true;
      }

      // ── Reset buffer if gap is too long (human resumed normal typing) ──
      if (timeDiff > 50 && bufferRef.current.length > 0 && e.key !== 'Enter') {
        bufferRef.current = [];
        inReaderSequence = false;
      }

      // ── Buffer printable characters ──
      if (e.key.length === 1) {
        if (inReaderSequence) {
          // Block this keystroke from going to the currently focused field
          e.preventDefault();
          e.stopPropagation();
        }
        bufferRef.current.push(e.key);
      }
      // ── Enter = end of reader sequence ──
      else if (e.key === 'Enter') {
        const fullString = bufferRef.current.join('');

        // Validate: card UIDs are typically 4-20 characters long and arrived fast
        if (fullString.length >= 4 && inReaderSequence) {
          e.preventDefault(); // Stop form submissions
          e.stopPropagation();
          handleCardScan(fullString, 'HID-KeyboardEmulation');
        }

        bufferRef.current = [];
        inReaderSequence = false;
      }
    };

    // Use 'capture: true' so we intercept before the event reaches input fields
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [handleCardScan]);

  // ─── MODE B: WebSockets (Serial COM Port Reader) Listener ───────────────
  useEffect(() => {
    let ws;
    let reconnectTimer;

    const connect = () => {
      // Build WebSocket URL relative to the backend server
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
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
  }, [handleCardScan]);

  return (
    <CardReaderContext.Provider value={{ lastCard, wsStatus, readerActivity, registerListener, handleCardScan }}>
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
