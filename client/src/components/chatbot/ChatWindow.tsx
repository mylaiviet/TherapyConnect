import { motion } from 'framer-motion';
import { X, Minimize2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import CrisisAlert from './CrisisAlert';
import ProgressIndicator from './ProgressIndicator';
import { useChatConversation } from './useChatConversation';

interface ChatWindowProps {
  onClose: () => void;
}

/**
 * Expanded chat window with message area, input, and header
 * HIPAA-compliant with crisis detection and human escalation
 */
export default function ChatWindow({ onClose }: ChatWindowProps) {
  const {
    messages,
    stage,
    crisisDetected,
    isTyping,
    sendMessage,
    requestHumanEscalation,
  } = useChatConversation();

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, originX: 1, originY: 1 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">KareMatch Assistant</h3>
            <p className="text-xs text-blue-100">Administrative Matching</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={requestHumanEscalation}
            className="h-8 w-8 text-white hover:bg-white/20"
            title="Speak with a human team member"
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-white hover:bg-white/20"
            title="Minimize chat"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-white hover:bg-white/20"
            title="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Indicator */}
      <ProgressIndicator stage={stage} />

      {/* Crisis Alert (conditional) */}
      {crisisDetected && <CrisisAlert onRequestHuman={requestHumanEscalation} />}

      {/* Message Area */}
      <ScrollArea className="flex-1 p-4">
        <MessageList messages={messages} isTyping={isTyping} />
      </ScrollArea>

      <Separator />

      {/* Input Area */}
      <ChatInput onSendMessage={sendMessage} />

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-2 text-center">
        <p className="text-xs text-gray-600">
          🔒 Your privacy is protected - HIPAA compliant
        </p>
      </div>
    </motion.div>
  );
}
