import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { Message } from './types';
import ButtonOptions from './ButtonOptions';
import TherapistMatchCard from './TherapistMatchCard';

/**
 * Simple function to render text with clickable links
 * Converts markdown-style links [text](url) to clickable <a> tags
 */
function renderMessageContent(content: string) {
  // Split by lines to preserve line breaks
  const lines = content.split('\n');

  return lines.map((line, lineIndex) => {
    // Match markdown links: [text](url) or just URLs starting with /
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;

    // Regex to find markdown links or plain /therapists/ URLs
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)|(?:👉 View profile: )(\/therapists\/[a-f0-9-]+)/g;
    let match;

    while ((match = linkRegex.exec(line)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }

      // Add the link
      const linkText = match[1] || 'View profile';
      const linkUrl = match[2] || match[3];

      parts.push(
        <a
          key={`${lineIndex}-${match.index}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline font-medium"
        >
          {linkText}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    // If no links found, just return the line
    if (parts.length === 0) {
      parts.push(line);
    }

    // Return the line with a line break (except for last line)
    return (
      <span key={lineIndex}>
        {parts}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    );
  });
}

interface MessageBubbleProps {
  message: Message;
  onSelectOption?: (optionValue: string) => void;
}

/**
 * Individual message bubble for bot, user, or system messages
 * Supports text, button options, disclaimers, and therapist match cards
 */
export default function MessageBubble({ message, onSelectOption }: MessageBubbleProps) {
  const { sender, content, timestamp, options, metadata } = message;

  const isBot = sender === 'bot';
  const isUser = sender === 'user';
  const isSystem = sender === 'system';

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      className={`flex flex-col mb-4 ${
        isUser ? 'items-end' : 'items-start'
      }`}
    >
      {/* Message bubble */}
      <div
        className={`max-w-[75%] ${
          isBot
            ? 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm'
            : isUser
            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
            : 'bg-amber-100 text-amber-900 rounded-xl border-l-4 border-amber-500'
        } px-4 py-3 shadow-sm`}
      >
        {/* Disclaimer badge */}
        {metadata?.isDisclaimer && (
          <div className="flex items-center gap-2 mb-2 text-amber-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-semibold">IMPORTANT</span>
          </div>
        )}

        {/* Message content */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {renderMessageContent(content)}
        </div>

        {/* Button options */}
        {options && options.length > 0 && (
          <ButtonOptions options={options} onSelect={onSelectOption} />
        )}

        {/* Therapist match cards */}
        {metadata?.therapistMatches && metadata.therapistMatches.length > 0 && (
          <div className="mt-4 space-y-3">
            {metadata.therapistMatches.map((therapist) => (
              <TherapistMatchCard key={therapist.id} therapist={therapist} />
            ))}
          </div>
        )}
      </div>

      {/* Timestamp */}
      <span className="text-xs text-gray-500 mt-1 px-2">
        {format(timestamp, 'h:mm a')}
      </span>
    </motion.div>
  );
}
