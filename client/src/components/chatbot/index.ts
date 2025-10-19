/**
 * Chatbot Component Exports
 * HIPAA-compliant therapy matching chatbot for TherapyConnect
 */

// Main widget
export { default as ChatWidget } from './ChatWidget';

// Core components
export { default as ChatButton } from './ChatButton';
export { default as ChatWindow } from './ChatWindow';
export { default as ChatInput } from './ChatInput';
export { default as MessageList } from './MessageList';
export { default as MessageBubble } from './MessageBubble';

// UI elements
export { default as ButtonOptions } from './ButtonOptions';
export { default as ProgressIndicator } from './ProgressIndicator';
export { default as CrisisAlert } from './CrisisAlert';
export { default as TherapistMatchCard } from './TherapistMatchCard';
export { default as TypingIndicator } from './TypingIndicator';

// Hooks
export { useChatConversation } from './useChatConversation';

// Utilities
export * from './crisisDetection';
export * from './conversationFlow';

// Types
export type * from './types';
