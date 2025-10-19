import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WelcomeModalProps {
  onDismiss?: () => void;
}

export default function WelcomeModal({ onDismiss }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user has seen the modal before
    const hasSeenModal = localStorage.getItem('therapyconnect_welcome_seen');

    if (!hasSeenModal) {
      // Show modal after a brief delay for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleChoice = (choice: 'match' | 'browse') => {
    // Track user choice
    localStorage.setItem('therapyconnect_welcome_seen', 'true');
    localStorage.setItem('therapyconnect_user_preference', choice);

    // Analytics tracking (placeholder - integrate with your analytics service)
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Welcome Modal Choice', {
        choice,
        timestamp: new Date().toISOString(),
      });
    }

    setIsOpen(false);

    if (choice === 'match') {
      // Redirect to full-page matching questionnaire
      setLocation('/match');
    } else {
      // Trigger navigation highlight animation
      const sidebar = document.querySelector('[data-sidebar]');
      if (sidebar) {
        sidebar.classList.add('highlight-pulse');
        setTimeout(() => {
          sidebar.classList.remove('highlight-pulse');
        }, 3000);
      }
    }

    onDismiss?.();
  };

  const handleClose = () => {
    localStorage.setItem('therapyconnect_welcome_seen', 'true');
    setIsOpen(false);
    onDismiss?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            Welcome to TherapyConnect! 👋
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Would you like help navigating our website or finding a therapist?
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {/* Option 1: Matching Assistance */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              onClick={() => handleChoice('match')}
              className="w-full h-full p-6 rounded-lg border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all group text-left"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Help me match with a therapist
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Answer a few questions and we'll recommend therapists who match your needs
                  </p>
                </div>
                <Button className="w-full mt-2">
                  Start Matching
                </Button>
              </div>
            </button>
          </motion.div>

          {/* Option 2: Browse Independently */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              onClick={() => handleChoice('browse')}
              className="w-full h-full p-6 rounded-lg border-2 border-muted hover:border-primary/50 hover:bg-muted/50 transition-all group text-left"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Search className="w-8 h-8 text-muted-foreground group-hover:text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    I'll browse on my own
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Explore therapist profiles using our directory and filter by your preferences
                  </p>
                </div>
                <Button variant="outline" className="w-full mt-2">
                  Browse Directory
                </Button>
              </div>
            </button>
          </motion.div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleClose}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            I'll decide later
          </button>
        </div>

        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            💬 Need help anytime? Look for the chat assistant in the bottom-right corner
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
