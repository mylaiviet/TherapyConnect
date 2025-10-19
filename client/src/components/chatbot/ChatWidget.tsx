import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import ChatButton from './ChatButton';
import ChatWindow from './ChatWindow';
import { ConversationState } from './types';

/**
 * Main ChatWidget component - HIPAA-compliant therapy matching chatbot
 * Renders a floating button that expands into a chat window
 */
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0); // Clear unread when opening
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleNewMessage = () => {
    if (!isOpen) {
      setUnreadCount((prev) => prev + 1);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <ChatWindow
            key="chat-window"
            onClose={handleClose}
          />
        ) : (
          <ChatButton
            key="chat-button"
            onClick={handleOpen}
            unreadCount={unreadCount}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
