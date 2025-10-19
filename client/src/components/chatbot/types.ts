/**
 * Type definitions for the HIPAA-compliant therapy matching chatbot
 */

export type ConversationStage =
  | 'welcome'
  | 'demographics'
  | 'preferences'
  | 'goals'
  | 'insurance'
  | 'matching';

export type MessageSender = 'bot' | 'user' | 'system';

export type SessionFormat = 'in-person' | 'virtual' | 'either';

export type TherapyApproach =
  | 'CBT'
  | 'DBT'
  | 'mindfulness'
  | 'talk-therapy'
  | 'psychodynamic'
  | 'trauma-focused'
  | 'family-therapy'
  | 'not-sure';

export interface ButtonOption {
  id: string;
  label: string;
  value: string;
}

export interface TherapistMatch {
  id: string;
  name: string;
  credentials: string;
  specialties: string[];
  location: string;
  sessionFormat: SessionFormat[];
  insurance: string[];
  photoUrl?: string;
  bio?: string;
}

export interface Message {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: Date;
  options?: ButtonOption[];
  metadata?: {
    isDisclaimer?: boolean;
    isCrisisAlert?: boolean;
    therapistMatches?: TherapistMatch[];
    validationType?: 'zipCode' | 'age' | 'phone' | 'email';
  };
}

export interface UserPreferences {
  // Demographics (tokenized in backend)
  preferredName?: string;
  location?: string;
  ageRange?: string;
  pronouns?: string;
  language?: string;

  // Preferences
  sessionFormat?: SessionFormat;
  availability?: string[];
  therapistGenderPreference?: string;
  therapistAgePreference?: string;
  culturalBackgroundMatch?: boolean;
  therapyApproach?: TherapyApproach[];
  hasPreviousTherapyExperience?: boolean;
  previousTherapyFeedback?: string;

  // Goals
  treatmentGoals?: string;
  treatmentDuration?: 'short-term' | 'long-term';

  // Insurance/Payment
  paymentMethod?: 'insurance' | 'out-of-pocket';
  insuranceProvider?: string;
  budgetRange?: string;
}

export interface ConversationState {
  conversationId: string | null;
  stage: ConversationStage;
  messages: Message[];
  userPreferences: UserPreferences;
  isTyping: boolean;
  crisisDetected: boolean;
  escalationRequested: boolean;
  isOpen: boolean;
  unreadCount: number;
}

export interface ChatResponse {
  message: Message;
  nextStage?: ConversationStage;
  crisisDetected?: boolean;
  therapistMatches?: TherapistMatch[];
}

export interface ConversationHistory {
  id: string;
  messages: Message[];
  stage: ConversationStage;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}
