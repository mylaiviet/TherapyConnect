import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ChatButtonProps {
  onClick: () => void;
  unreadCount: number;
}

/**
 * Floating chat button that opens the chatbot
 * Shows unread message count badge
 */
export default function ChatButton({ onClick, unreadCount }: ChatButtonProps) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow focus:outline-none focus:ring-4 focus:ring-blue-300"
      aria-label="Open therapy matching assistant"
    >
      <MessageCircle className="w-7 h-7" />

      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center rounded-full p-0 text-xs font-bold animate-pulse"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}

      {/* Pulse animation on first load */}
      <motion.span
        className="absolute inset-0 rounded-full bg-blue-600"
        initial={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
        }}
      />
    </motion.button>
  );
}
