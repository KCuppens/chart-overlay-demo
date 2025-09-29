import React, { useState } from 'react';
import TradingChart from './components/TradingChart';
import ChatBubble from './components/ChatBubble';

function App() {
  const [showChatBubble, setShowChatBubble] = useState(false);

  const handleChartReady = () => {
    // Chart is ready, can add additional initialization logic here
  };

  const handleOverlayActivation = () => {
    // Show chat bubble every time dream mode is activated
    setTimeout(() => {
      setShowChatBubble(true);
    }, 1000);
  };

  const handleChatBubbleDismiss = () => {
    setShowChatBubble(false);
  };

  return (
    <div className="app" style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Main Trading Interface */}
      <TradingChart
        onChartReady={handleChartReady}
        onOverlayActivate={handleOverlayActivation}
      />

      {/* Chat Bubble */}
      <ChatBubble
        isVisible={showChatBubble}
        onDismiss={handleChatBubbleDismiss}
      />

      {/* Instructions Overlay */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '12px 24px',
        borderRadius: 25,
        fontSize: 14,
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
      }}>
        📈 Click "Activate Dream Mode" to see the magic happen!
      </div>

      {/* Global Styles */}
      <style>
        {`
          .app {
            background: #131722;
            overflow: hidden;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          }
        `}
      </style>
    </div>
  );
}

export default App;