import React, { useState, useRef, useEffect } from 'react';

interface ChatBubbleProps {
  isVisible: boolean;
  onDismiss: () => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ isVisible, onDismiss }) => {
  const [position, setPosition] = useState({
    x: window.innerWidth / 2 - 100, // Center horizontally (100 is half of bubble width)
    y: window.innerHeight / 2 - 40  // Center vertically (40 is half of bubble height)
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Reset position to center when bubble becomes visible
  useEffect(() => {
    if (isVisible) {
      setPosition({
        x: window.innerWidth / 2 - 100,
        y: window.innerHeight / 2 - 40
      });
    }
  }, [isVisible]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      setPosition({ x: newX, y: newY });

      // Check if dragged to bottom-right corner (within 100px of bottom-right)
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const threshold = 100;

      if (
        newX > windowWidth - threshold - 200 && // 200 is bubble width
        newY > windowHeight - threshold - 100   // 100 is bubble height
      ) {
        // Add dismiss effect
        if (bubbleRef.current) {
          bubbleRef.current.style.transform = 'scale(0.8)';
          bubbleRef.current.style.opacity = '0.5';
        }

        setTimeout(() => {
          onDismiss();
        }, 300);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (bubbleRef.current) {
        bubbleRef.current.style.transform = 'scale(1)';
        bubbleRef.current.style.opacity = '1';
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, onDismiss]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  if (!isVisible) return null;

  return (
    <div
      ref={bubbleRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: 200,
        height: 80,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 20,
        padding: 16,
        color: 'white',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        zIndex: 1000,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        transition: 'transform 0.2s ease, opacity 0.2s ease',
        border: '2px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      <div>
        <div style={{ marginBottom: 4 }}>👋 Hello!</div>
        <div style={{ fontSize: 12, opacity: 0.9 }}>
          Drag me to bottom-right to dismiss
        </div>
      </div>

      {/* Speech bubble tail */}
      <div
        style={{
          position: 'absolute',
          bottom: -10,
          left: 20,
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: '10px solid #667eea',
        }}
      />

      {/* Dismiss zone indicator when dragging */}
      {isDragging && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: 100,
            height: 100,
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px dashed rgba(255, 255, 255, 0.5)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: 12,
            textAlign: 'center',
            zIndex: 999,
            animation: 'pulse 1s infinite',
          }}
        >
          Drop here to dismiss
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); opacity: 0.7; }
          }
        `}
      </style>
    </div>
  );
};

export default ChatBubble;