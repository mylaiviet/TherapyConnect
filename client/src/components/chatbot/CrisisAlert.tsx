import { motion } from 'framer-motion';
import { AlertTriangle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CrisisAlertProps {
  onRequestHuman: () => void;
}

/**
 * Crisis alert banner displayed when crisis keywords are detected
 * Shows immediate safety resources and human escalation option
 */
export default function CrisisAlert({ onRequestHuman }: CrisisAlertProps) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="border-b-2 border-red-600"
    >
      <Alert variant="destructive" className="rounded-none border-0 bg-red-50">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="text-base font-bold mb-2">
          🚨 CRISIS RESOURCES - PLEASE READ
        </AlertTitle>
        <AlertDescription className="space-y-3">
          <p className="text-sm">
            If you're experiencing a mental health emergency, please contact
            these resources immediately:
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <a
                href="tel:988"
                className="font-semibold hover:underline"
              >
                988 - Suicide & Crisis Lifeline
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">💬</span>
              <span>
                Text <strong>"HELLO"</strong> to{' '}
                <a href="sms:741741" className="font-semibold hover:underline">
                  741741
                </a>{' '}
                - Crisis Text Line
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🚑</span>
              <span>
                Call <strong>911</strong> or go to your nearest emergency room
              </span>
            </div>
          </div>

          <Button
            onClick={onRequestHuman}
            className="w-full bg-red-700 hover:bg-red-800"
            size="sm"
          >
            <Phone className="w-4 h-4 mr-2" />
            Speak with Human Team Member Now
          </Button>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}
