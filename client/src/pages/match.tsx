import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

type Stage = 'welcome' | 'demographics' | 'preferences' | 'goals' | 'insurance' | 'matching';

const STAGES: Stage[] = ['welcome', 'demographics', 'preferences', 'goals', 'insurance', 'matching'];

const STAGE_LABELS: Record<Stage, string> = {
  welcome: 'Welcome',
  demographics: 'Demographics',
  preferences: 'Preferences',
  goals: 'Goals',
  insurance: 'Insurance',
  matching: 'Results',
};

export default function Match() {
  const [, setLocation] = useLocation();
  const [currentStage, setCurrentStage] = useState<Stage>('welcome');
  const [formData, setFormData] = useState({
    location: '',
    sessionFormat: '',
    specialty: '',
    modality: '',
    goals: '',
    paymentMethod: '',
    insuranceProvider: '',
  });

  const currentIndex = STAGES.indexOf(currentStage);
  const progress = ((currentIndex + 1) / STAGES.length) * 100;

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < STAGES.length) {
      setCurrentStage(STAGES[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStage(STAGES[prevIndex]);
    }
  };

  const handleSubmit = () => {
    // Redirect to therapist search with filters
    const params = new URLSearchParams();
    if (formData.location) params.set('location', formData.location);
    if (formData.specialty) params.set('specialties', formData.specialty);
    if (formData.sessionFormat) params.set('sessionTypes', formData.sessionFormat);
    if (formData.insuranceProvider) params.set('insurance', formData.insuranceProvider);

    setLocation(`/therapists?${params.toString()}`);
  };

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Find Your Perfect Match
          </h1>
          <p className="text-muted-foreground">
            Answer a few questions to get personalized therapist recommendations
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentIndex + 1} of {STAGES.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />

          {/* Stage Indicators */}
          <div className="flex items-center justify-between mt-4">
            {STAGES.map((stage, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;

              return (
                <div key={stage} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                  </div>
                  <span className={`text-xs mt-1 hidden sm:block ${isCurrent ? 'font-semibold' : ''}`}>
                    {STAGE_LABELS[stage]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStage === 'welcome' && (
                  <div className="text-center py-8">
                    <h2 className="text-2xl font-bold mb-4">Welcome! 👋</h2>
                    <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                      We're here to help you find a therapist who's the right fit for you. This questionnaire takes about 5-10 minutes to complete.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
                      <p className="text-sm text-amber-900">
                        ⚠️ <strong>Important:</strong> This is a matching tool, not therapy. If you're experiencing a mental health emergency, please call 988 (Suicide & Crisis Lifeline) or go to your nearest emergency room.
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      🔒 Your information is kept confidential and HIPAA-compliant
                    </p>
                  </div>
                )}

                {currentStage === 'demographics' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Location & Demographics</h2>
                      <p className="text-muted-foreground">Help us find therapists in your area</p>
                    </div>

                    <div>
                      <Label htmlFor="location">City or ZIP Code</Label>
                      <Input
                        id="location"
                        placeholder="e.g., Minneapolis, MN or 55401"
                        value={formData.location}
                        onChange={(e) => updateFormData('location', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}

                {currentStage === 'preferences' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Session Preferences</h2>
                      <p className="text-muted-foreground">How would you like to meet with your therapist?</p>
                    </div>

                    <div>
                      <Label>Session Format</Label>
                      <RadioGroup
                        value={formData.sessionFormat}
                        onValueChange={(value) => updateFormData('sessionFormat', value)}
                        className="mt-4 space-y-3"
                      >
                        <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value="in-person" id="in-person" />
                          <Label htmlFor="in-person" className="cursor-pointer flex-1">
                            <div className="font-medium">In-Person</div>
                            <div className="text-sm text-muted-foreground">Meet face-to-face at therapist's office</div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value="virtual" id="virtual" />
                          <Label htmlFor="virtual" className="cursor-pointer flex-1">
                            <div className="font-medium">Virtual/Telehealth</div>
                            <div className="text-sm text-muted-foreground">Video sessions from anywhere</div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value="either" id="either" />
                          <Label htmlFor="either" className="cursor-pointer flex-1">
                            <div className="font-medium">Either works for me</div>
                            <div className="text-sm text-muted-foreground">Flexible with format</div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="specialty">What do you want to work on?</Label>
                      <Input
                        id="specialty"
                        placeholder="e.g., Anxiety, Depression, Trauma"
                        value={formData.specialty}
                        onChange={(e) => updateFormData('specialty', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}

                {currentStage === 'goals' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Treatment Goals</h2>
                      <p className="text-muted-foreground">Tell us more about what you hope to achieve</p>
                    </div>

                    <div>
                      <Label htmlFor="goals">What are you hoping to work on in therapy?</Label>
                      <Textarea
                        id="goals"
                        placeholder="Share as much or as little as you'd like..."
                        value={formData.goals}
                        onChange={(e) => updateFormData('goals', e.target.value)}
                        className="mt-2 min-h-[120px]"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        This helps us match you with therapists who specialize in your needs
                      </p>
                    </div>
                  </div>
                )}

                {currentStage === 'insurance' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Payment & Insurance</h2>
                      <p className="text-muted-foreground">How do you plan to pay for therapy?</p>
                    </div>

                    <div>
                      <Label>Payment Method</Label>
                      <RadioGroup
                        value={formData.paymentMethod}
                        onValueChange={(value) => updateFormData('paymentMethod', value)}
                        className="mt-4 space-y-3"
                      >
                        <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value="insurance" id="insurance" />
                          <Label htmlFor="insurance" className="cursor-pointer flex-1">
                            <div className="font-medium">Insurance</div>
                            <div className="text-sm text-muted-foreground">I'll use my insurance coverage</div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value="out-of-pocket" id="out-of-pocket" />
                          <Label htmlFor="out-of-pocket" className="cursor-pointer flex-1">
                            <div className="font-medium">Out-of-Pocket</div>
                            <div className="text-sm text-muted-foreground">I'll pay directly</div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {formData.paymentMethod === 'insurance' && (
                      <div>
                        <Label htmlFor="insurance-provider">Insurance Provider</Label>
                        <Input
                          id="insurance-provider"
                          placeholder="e.g., Blue Cross Blue Shield, Aetna"
                          value={formData.insuranceProvider}
                          onChange={(e) => updateFormData('insuranceProvider', e.target.value)}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </div>
                )}

                {currentStage === 'matching' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">All Set!</h2>
                    <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                      Based on your answers, we'll show you therapists who match your preferences. You can refine your search further on the results page.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {currentStage === 'matching' ? (
                <Button onClick={handleSubmit} size="lg">
                  View My Matches
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  {currentStage === 'welcome' ? "Let's Begin" : 'Continue'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Need help? Click the chat assistant in the bottom-right corner
          </p>
        </div>
      </div>
    </div>
  );
}
