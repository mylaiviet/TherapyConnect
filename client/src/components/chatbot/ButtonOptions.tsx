import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ButtonOption } from './types';

interface ButtonOptionsProps {
  options: ButtonOption[];
  onSelect?: (value: string) => void;
}

/**
 * Multi-choice button options for user responses
 * Disables all buttons after one is selected
 */
export default function ButtonOptions({ options, onSelect }: ButtonOptionsProps) {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    onSelect?.(value);
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {options.map((option, index) => (
        <motion.div
          key={option.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <Button
            variant={selectedValue === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSelect(option.value)}
            disabled={selectedValue !== null && selectedValue !== option.value}
            className={`
              transition-all duration-200
              ${selectedValue === option.value
                ? 'bg-blue-600 text-white'
                : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
              }
              ${selectedValue !== null && selectedValue !== option.value
                ? 'opacity-50 cursor-not-allowed'
                : ''
              }
            `}
          >
            {option.label}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
