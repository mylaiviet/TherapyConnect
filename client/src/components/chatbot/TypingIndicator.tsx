import { motion } from 'framer-motion';

/**
 * Animated typing indicator shown when bot is composing a response
 */
export default function TypingIndicator() {
  const dotVariants = {
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className="flex items-start mb-4">
      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600 mr-2">
            TherapyConnect is typing
          </span>
          <div className="flex gap-1">
            <motion.div
              className="w-2 h-2 bg-gray-500 rounded-full"
              variants={dotVariants}
              animate="animate"
              transition={{ delay: 0 }}
            />
            <motion.div
              className="w-2 h-2 bg-gray-500 rounded-full"
              variants={dotVariants}
              animate="animate"
              transition={{ delay: 0.2 }}
            />
            <motion.div
              className="w-2 h-2 bg-gray-500 rounded-full"
              variants={dotVariants}
              animate="animate"
              transition={{ delay: 0.4 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
