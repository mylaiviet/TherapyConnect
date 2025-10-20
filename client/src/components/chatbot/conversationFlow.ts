import { v4 as uuidv4 } from 'uuid';
import { Message, ConversationStage, ButtonOption } from './types';

/**
 * Rule-based conversation flow with hardcoded questions
 * 90% of chatbot functionality - deterministic and HIPAA-safe
 */

/**
 * Get welcome stage messages (disclaimer + greeting)
 */
export function getWelcomeMessages(): Message[] {
  return [
    {
      id: uuidv4(),
      sender: 'bot',
      content:
        "Hi! I'm the KareMatch matching assistant. I'm here to help you find a therapist who's the right fit for you.",
      timestamp: new Date(),
    },
    {
      id: uuidv4(),
      sender: 'bot',
      content:
        "⚠️ Important: I'm an automated assistant, not a therapist. I can't provide medical advice or crisis support.\n\nIf you're experiencing a mental health emergency, please call 988 (Suicide & Crisis Lifeline) or go to your nearest emergency room.",
      timestamp: new Date(),
      metadata: { isDisclaimer: true },
    },
    {
      id: uuidv4(),
      sender: 'bot',
      content: 'Are you ready to get started?',
      timestamp: new Date(),
      options: [
        { id: uuidv4(), label: "Yes, let's begin", value: 'yes' },
        { id: uuidv4(), label: 'I have questions first', value: 'questions' },
      ],
    },
  ];
}

/**
 * Get questions for a specific conversation stage
 */
export function getStageQuestions(stage: ConversationStage): Partial<Message>[] {
  switch (stage) {
    case 'welcome':
      return [
        {
          content: 'Great! What city or ZIP code are you located in?',
        },
      ];

    case 'demographics':
      return [
        {
          content: 'Thanks! What age range are you in?',
          options: [
            { id: uuidv4(), label: '18-24', value: '18-24' },
            { id: uuidv4(), label: '25-34', value: '25-34' },
            { id: uuidv4(), label: '35-44', value: '35-44' },
            { id: uuidv4(), label: '45-54', value: '45-54' },
            { id: uuidv4(), label: '55-64', value: '55-64' },
            { id: uuidv4(), label: '65+', value: '65+' },
          ],
        },
        {
          content: 'What language(s) do you prefer for therapy sessions?',
          options: [
            { id: uuidv4(), label: 'English', value: 'english' },
            { id: uuidv4(), label: 'Spanish', value: 'spanish' },
            { id: uuidv4(), label: 'Bilingual (English/Spanish)', value: 'bilingual' },
            { id: uuidv4(), label: 'Other', value: 'other' },
          ],
        },
      ];

    case 'preferences':
      return [
        {
          content:
            'Do you prefer in-person sessions, video sessions, or would either work for you?',
          options: [
            { id: uuidv4(), label: 'In-person', value: 'in-person' },
            { id: uuidv4(), label: 'Virtual', value: 'virtual' },
            { id: uuidv4(), label: 'Either', value: 'either' },
          ],
        },
        {
          content: 'What days and times typically work best for appointments?',
          options: [
            { id: uuidv4(), label: 'Weekday mornings', value: 'weekday-morning' },
            { id: uuidv4(), label: 'Weekday evenings', value: 'weekday-evening' },
            { id: uuidv4(), label: 'Weekends', value: 'weekend' },
            { id: uuidv4(), label: 'Flexible', value: 'flexible' },
          ],
        },
        {
          content:
            'Are you looking for a therapist who uses a specific approach? Here are some common ones:',
          options: [
            { id: uuidv4(), label: 'CBT (Cognitive Behavioral)', value: 'CBT' },
            { id: uuidv4(), label: 'DBT (Dialectical Behavioral)', value: 'DBT' },
            { id: uuidv4(), label: 'Mindfulness-based', value: 'mindfulness' },
            { id: uuidv4(), label: 'Talk therapy', value: 'talk-therapy' },
            { id: uuidv4(), label: 'Trauma-focused', value: 'trauma-focused' },
            { id: uuidv4(), label: "Not sure / I'm open", value: 'not-sure' },
          ],
        },
      ];

    case 'goals':
      return [
        {
          content:
            'What are you hoping to work on in therapy? (Feel free to share as much or as little as you like)',
        },
        {
          content:
            'Are you looking for short-term support for a specific challenge, or longer-term therapy?',
          options: [
            {
              id: uuidv4(),
              label: 'Short-term (a few months)',
              value: 'short-term',
            },
            {
              id: uuidv4(),
              label: 'Long-term (ongoing support)',
              value: 'long-term',
            },
            { id: uuidv4(), label: "Not sure yet", value: 'not-sure' },
          ],
        },
      ];

    case 'insurance':
      return [
        {
          content: 'Do you plan to use insurance or pay out-of-pocket?',
          options: [
            { id: uuidv4(), label: 'Insurance', value: 'insurance' },
            { id: uuidv4(), label: 'Out-of-pocket', value: 'out-of-pocket' },
            { id: uuidv4(), label: 'Not sure', value: 'not-sure' },
          ],
        },
        {
          content: 'What insurance provider do you have?',
          options: [
            {
              id: uuidv4(),
              label: 'Blue Cross Blue Shield',
              value: 'bcbs',
            },
            { id: uuidv4(), label: 'Aetna', value: 'aetna' },
            { id: uuidv4(), label: 'UnitedHealthcare', value: 'united' },
            { id: uuidv4(), label: 'Cigna', value: 'cigna' },
            { id: uuidv4(), label: 'Kaiser', value: 'kaiser' },
            { id: uuidv4(), label: 'Other', value: 'other' },
          ],
        },
      ];

    case 'matching':
      return [
        {
          content:
            "Perfect! I'm searching for therapists who match your preferences...",
        },
      ];

    default:
      return [];
  }
}

/**
 * Get FAQ responses (for optional LLM enhancement later)
 */
export function getFAQResponse(question: string): string | null {
  const faqMap: Record<string, string> = {
    'how does matching work': `Our matching process uses the preferences you share (location, therapy type, availability, insurance) to find therapists who are a good fit. You'll see 3-5 recommendations with profiles and booking options.`,

    'what is your privacy policy': `We take your privacy seriously. All conversations are encrypted and HIPAA-compliant. We only collect information necessary for matching you with therapists. Your data is never sold to third parties.`,

    'what insurance do you accept': `Our therapists accept a wide range of insurance providers including Blue Cross Blue Shield, Aetna, UnitedHealthcare, Cigna, and more. During the matching process, you can specify your insurance provider to see only therapists who accept it.`,

    'how much does therapy cost': `Therapy costs vary by provider. Many therapists accept insurance, and some offer sliding scale fees for out-of-pocket payments. You'll see pricing information on each therapist's profile.`,
  };

  const normalizedQuestion = question.toLowerCase();
  const matchedKey = Object.keys(faqMap).find((key) =>
    normalizedQuestion.includes(key)
  );

  return matchedKey ? faqMap[matchedKey] : null;
}
