import { Check, ChevronRight, Circle } from 'lucide-react';
import { ConversationStage } from './types';
import { Progress } from '@/components/ui/progress';

interface ProgressIndicatorProps {
  stage: ConversationStage;
}

const stages: { key: ConversationStage; label: string }[] = [
  { key: 'welcome', label: 'Welcome' },
  { key: 'demographics', label: 'Demographics' },
  { key: 'preferences', label: 'Preferences' },
  { key: 'goals', label: 'Goals' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'matching', label: 'Matching' },
];

/**
 * Visual progress indicator showing the current stage in the conversation flow
 */
export default function ProgressIndicator({ stage }: ProgressIndicatorProps) {
  const currentIndex = stages.findIndex((s) => s.key === stage);
  const progress = ((currentIndex + 1) / stages.length) * 100;

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>
            Step {currentIndex + 1} of {stages.length}: {stages[currentIndex]?.label}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Stage indicators */}
      <div className="flex items-center justify-between gap-1">
        {stages.map((s, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : isCurrent ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <Circle className="w-3 h-3" />
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1 hidden sm:block ${
                    isCurrent ? 'font-semibold text-blue-700' : 'text-gray-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
