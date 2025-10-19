import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

/**
 * Chat input component with character limit and validation
 * Supports Enter to send, Shift+Enter for new line
 */
export default function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = 'Type your message...',
  maxLength = 500,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const remainingChars = maxLength - message.length;

  const handleSend = () => {
    const trimmedMessage = message.trim();

    // Validation
    if (!trimmedMessage) {
      setError('Please enter a message');
      return;
    }

    if (trimmedMessage.length > maxLength) {
      setError(`Message must be ${maxLength} characters or less`);
      return;
    }

    // Send message
    onSendMessage(trimmedMessage);
    setMessage('');
    setError(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (value: string) => {
    setMessage(value);
    if (error) setError(null);
  };

  return (
    <div className="p-4 bg-white">
      <div className="flex gap-2">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            rows={2}
            className={`resize-none ${error ? 'border-red-500' : ''}`}
            aria-label="Type your message"
            aria-invalid={!!error}
          />

          {/* Character counter and error */}
          <div className="flex items-center justify-between mt-1">
            {error ? (
              <p className="text-xs text-red-600">❌ {error}</p>
            ) : (
              <p className="text-xs text-gray-500">
                {remainingChars < 100 && (
                  <span
                    className={remainingChars < 20 ? 'text-amber-600 font-semibold' : ''}
                  >
                    {remainingChars} characters remaining
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          size="icon"
          className="h-[72px] w-12 bg-blue-600 hover:bg-blue-700"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {/* Keyboard hint */}
      <p className="text-[10px] text-gray-400 mt-1 text-center">
        Press Enter to send • Shift + Enter for new line
      </p>
    </div>
  );
}
