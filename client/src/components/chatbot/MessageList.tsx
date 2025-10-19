import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Message } from './types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  onSelectOption?: (optionValue: string) => void;
}

/**
 * Scrollable list of messages with auto-scroll to bottom
 * Shows typing indicator when bot is composing a response
 */
export default function MessageList({
  messages,
  isTyping,
  onSelectOption,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        <p>Starting conversation...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onSelectOption={onSelectOption}
        />
      ))}

      {isTyping && <TypingIndicator />}

      {/* Invisible div for auto-scroll */}
      <div ref={bottomRef} />
    </div>
  );
}
