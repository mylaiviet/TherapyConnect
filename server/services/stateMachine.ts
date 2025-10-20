/**
 * Chatbot State Machine Service
 * Manages 6-stage conversation flow for therapy matching
 *
 * Stages: Welcome → Demographics → Preferences → Goals → Insurance → Matching
 */

import { db } from '../db';
import {
  chatConversations,
  chatMessages,
  chatPreferences,
  type ChatConversation,
  type InsertChatMessage,
} from '@shared/schema';
import { eq } from 'drizzle-orm';
import { detectCrisis, logCrisisEscalation } from './crisisDetection';
import { tokenizeName, tokenizeLocation } from './tokenization';

type ConversationStage = 'welcome' | 'demographics' | 'preferences' | 'goals' | 'insurance' | 'matching';

interface StageQuestion {
  content: string;
  hasButtonOptions: boolean;
  buttonOptions?: Array<{ id: string; label: string; value: string }>;
  validationType?: 'zipCode' | 'age' | 'text';
  fieldName?: string; // Field to store in preferences
}

interface ProcessMessageResult {
  botResponse: InsertChatMessage;
  nextStage?: ConversationStage;
  crisisDetected: boolean;
  shouldEscalate: boolean;
}

/**
 * Get the next question based on current stage and conversation context
 */
export async function getNextQuestion(
  conversationId: string,
  stage: ConversationStage,
  context?: any
): Promise<StageQuestion | null> {
  const questions = getStageQuestions(stage);

  // For now, return the first question in the stage
  // In future, can implement multi-question stages with context tracking
  return questions[0] || null;
}

/**
 * Process user message and generate bot response
 */
export async function processUserResponse(
  conversationId: string,
  userMessage: string,
  currentStage: ConversationStage
): Promise<ProcessMessageResult> {
  // Check for crisis keywords first
  const crisisResult = detectCrisis(userMessage);

  if (crisisResult.detected) {
    // Log the escalation
    await logCrisisEscalation(conversationId, userMessage, crisisResult);

    // Update conversation to mark crisis
    await db
      .update(chatConversations)
      .set({ crisisDetected: true, updatedAt: new Date() })
      .where(eq(chatConversations.id, conversationId));

    return {
      botResponse: {
        conversationId,
        sender: 'system',
        content: "I'm very concerned about your safety. Please contact these resources immediately:\n\n📞 988 - Suicide & Crisis Lifeline\n💬 Text 'HELLO' to 741741 - Crisis Text Line\n🚑 Call 911 or go to your nearest emergency room\n\nWould you like to speak with a human team member?",
        isCrisisAlert: true,
      },
      crisisDetected: true,
      shouldEscalate: true,
    };
  }

  // Process based on current stage
  switch (currentStage) {
    case 'welcome':
      return await processWelcomeResponse(conversationId, userMessage);
    case 'demographics':
      return await processDemographicsResponse(conversationId, userMessage);
    case 'preferences':
      return await processPreferencesResponse(conversationId, userMessage);
    case 'goals':
      return await processGoalsResponse(conversationId, userMessage);
    case 'insurance':
      return await processInsuranceResponse(conversationId, userMessage);
    case 'matching':
      return await processMatchingResponse(conversationId, userMessage);
    default:
      return {
        botResponse: {
          conversationId,
          sender: 'bot',
          content: 'I apologize, but something went wrong. Let me start over.',
        },
        crisisDetected: false,
        shouldEscalate: false,
      };
  }
}

/**
 * Advance conversation to next stage
 */
export async function advanceStage(
  conversationId: string,
  currentStage: ConversationStage
): Promise<ConversationStage> {
  const stageOrder: ConversationStage[] = [
    'welcome',
    'demographics',
    'preferences',
    'goals',
    'insurance',
    'matching',
  ];

  const currentIndex = stageOrder.indexOf(currentStage);
  const nextStage = stageOrder[currentIndex + 1] || 'matching'; // Stay at matching if complete

  // Update conversation stage in database
  await db
    .update(chatConversations)
    .set({ stage: nextStage, updatedAt: new Date() })
    .where(eq(chatConversations.id, conversationId));

  return nextStage;
}

// ============================================
// STAGE PROCESSORS
// ============================================

async function processWelcomeResponse(conversationId: string, message: string): Promise<ProcessMessageResult> {
  const messageLower = message.toLowerCase();

  // Check if user wants to proceed or has questions
  if (messageLower.includes('yes') || messageLower.includes('begin') || messageLower.includes('start')) {
    const nextStage = await advanceStage(conversationId, 'welcome');

    return {
      botResponse: {
        conversationId,
        sender: 'bot',
        content: 'Great! What city or ZIP code are you located in? This helps us find therapists near you.',
      },
      nextStage,
      crisisDetected: false,
      shouldEscalate: false,
    };
  }

  // User has questions - provide FAQ
  return {
    botResponse: {
      conversationId,
      sender: 'bot',
      content: "I'm here to help match you with a therapist based on your preferences like location, therapy type, and insurance. The process takes about 5-10 minutes. Your information is kept confidential and HIPAA-compliant.\n\nReady to get started?",
    },
    crisisDetected: false,
    shouldEscalate: false,
  };
}

async function processDemographicsResponse(conversationId: string, message: string): Promise<ProcessMessageResult> {
  // TODO: Implement preference tracking state machine
  // For now, assume we're collecting location

  // Check if it's a ZIP code
  const zipMatch = message.match(/\b\d{5}\b/);
  if (zipMatch) {
    const zipCode = zipMatch[0];

    // Store ZIP code in preferences (non-PHI, safe to store)
    await db.insert(chatPreferences).values({
      conversationId,
      locationZip: zipCode,
    }).onConflictDoUpdate({
      target: chatPreferences.conversationId,
      set: { locationZip: zipCode, updatedAt: new Date() },
    });

    const nextStage = await advanceStage(conversationId, 'demographics');

    return {
      botResponse: {
        conversationId,
        sender: 'bot',
        content: `Thanks! Do you prefer in-person sessions, video sessions, or would either work for you?`,
        hasButtonOptions: true,
      },
      nextStage,
      crisisDetected: false,
      shouldEscalate: false,
    };
  }

  // City name - store it (simplified - just store the city name in locationZip for now)
  // In production, you'd tokenize and geocode this
  await db.insert(chatPreferences).values({
    conversationId,
    locationZip: message, // Store city name temporarily
  }).onConflictDoUpdate({
    target: chatPreferences.conversationId,
    set: { locationZip: message, updatedAt: new Date() },
  });

  const nextStage = await advanceStage(conversationId, 'demographics');

  return {
    botResponse: {
      conversationId,
      sender: 'bot',
      content: `Thanks! Do you prefer in-person sessions, video sessions, or would either work for you?`,
      hasButtonOptions: true,
    },
    nextStage,
    crisisDetected: false,
    shouldEscalate: false,
  };
}

async function processPreferencesResponse(conversationId: string, message: string): Promise<ProcessMessageResult> {
  const messageLower = message.toLowerCase();

  // Store session format preference
  let sessionFormat: string | null = null;
  if (messageLower.includes('in-person') || messageLower.includes('in person')) {
    sessionFormat = 'in-person';
  } else if (messageLower.includes('virtual') || messageLower.includes('video') || messageLower.includes('online')) {
    sessionFormat = 'virtual';
  } else if (messageLower.includes('either') || messageLower.includes('both')) {
    sessionFormat = 'either';
  }

  if (sessionFormat) {
    await db.update(chatPreferences)
      .set({ sessionFormat, updatedAt: new Date() })
      .where(eq(chatPreferences.conversationId, conversationId));
  }

  const nextStage = await advanceStage(conversationId, 'preferences');

  return {
    botResponse: {
      conversationId,
      sender: 'bot',
      content: `Perfect! What are you hoping to work on in therapy? Feel free to share as much or as little as you'd like.`,
    },
    nextStage,
    crisisDetected: false,
    shouldEscalate: false,
  };
}

async function processGoalsResponse(conversationId: string, message: string): Promise<ProcessMessageResult> {
  // Store treatment goals
  await db.update(chatPreferences)
    .set({ treatmentGoals: message, updatedAt: new Date() })
    .where(eq(chatPreferences.conversationId, conversationId));

  const nextStage = await advanceStage(conversationId, 'goals');

  return {
    botResponse: {
      conversationId,
      sender: 'bot',
      content: `Thank you for sharing. Do you plan to use insurance or pay out-of-pocket?`,
      hasButtonOptions: true,
    },
    nextStage,
    crisisDetected: false,
    shouldEscalate: false,
  };
}

async function processInsuranceResponse(conversationId: string, message: string): Promise<ProcessMessageResult> {
  const messageLower = message.toLowerCase();

  // Determine payment method
  let paymentMethod: string | null = null;
  let insuranceProvider: string | null = null;

  if (messageLower.includes('insurance')) {
    paymentMethod = 'insurance';

    // Try to extract insurance provider name
    if (messageLower.includes('blue cross') || messageLower.includes('bcbs')) {
      insuranceProvider = 'Blue Cross Blue Shield';
    } else if (messageLower.includes('aetna')) {
      insuranceProvider = 'Aetna';
    } else if (messageLower.includes('united')) {
      insuranceProvider = 'UnitedHealthcare';
    } else if (messageLower.includes('cigna')) {
      insuranceProvider = 'Cigna';
    } else if (messageLower.includes('kaiser')) {
      insuranceProvider = 'Kaiser Permanente';
    }
  } else if (messageLower.includes('out-of-pocket') || messageLower.includes('self-pay') || messageLower.includes('out of pocket')) {
    paymentMethod = 'out-of-pocket';
  }

  if (paymentMethod) {
    await db.update(chatPreferences)
      .set({
        paymentMethod,
        insuranceProvider,
        updatedAt: new Date()
      })
      .where(eq(chatPreferences.conversationId, conversationId));
  }

  const nextStage = await advanceStage(conversationId, 'insurance');

  // Automatically trigger matching when advancing to matching stage
  const { findMatchingTherapists } = await import('./therapistMatcher');

  try {
    // Find matching therapists
    const result = await findMatchingTherapists(conversationId);
    const matches = result.therapists;

    if (matches.length === 0) {
      return {
        botResponse: {
          conversationId,
          sender: 'bot',
          content: `I apologize, but I couldn't find any therapists that match all of your preferences. However, I recommend:\n\n1. Broadening your search criteria (e.g., considering both in-person and virtual)\n2. Browsing our full therapist directory at /therapists\n3. Contacting us directly for personalized assistance\n\nWould you like to start a new search with different preferences?`,
          hasButtonOptions: true,
        },
        nextStage,
        crisisDetected: false,
        shouldEscalate: false,
      };
    }

    // Format the matches into a readable message
    let matchMessage = `Excellent! I found ${matches.length} therapist${matches.length > 1 ? 's' : ''} who match your preferences:\n\n`;

    matches.forEach((therapist, index) => {
      const name = therapist.firstName && therapist.lastName
        ? `${therapist.firstName} ${therapist.lastName}`
        : therapist.firstName || therapist.lastName || 'Unknown';
      const credentials = therapist.credentials || '';
      const location = therapist.city ? `${therapist.city}, ${therapist.state || ''}` : 'Location not specified';
      const score = therapist.matchScore;
      const reasons = therapist.matchReasons.slice(0, 2).join(', '); // Top 2 reasons

      matchMessage += `${index + 1}. ${name}, ${credentials}\n`;
      matchMessage += `   📍 ${location}\n`;
      matchMessage += `   ⭐ ${score}% match - ${reasons}\n`;
      matchMessage += `   👉 View profile: /therapists/${therapist.id}\n\n`;
    });

    matchMessage += `You can click on each therapist's profile link to learn more and book a consultation. Would you like help with anything else?`;

    return {
      botResponse: {
        conversationId,
        sender: 'bot',
        content: matchMessage,
        hasButtonOptions: false,
      },
      nextStage,
      crisisDetected: false,
      shouldEscalate: false,
    };
  } catch (error) {
    console.error('[MATCHING ERROR]', error);
    return {
      botResponse: {
        conversationId,
        sender: 'bot',
        content: `I encountered an error while searching for therapists. Please try browsing our directory directly at /therapists or contact our support team.`,
        hasButtonOptions: false,
      },
      nextStage,
      crisisDetected: false,
      shouldEscalate: false,
    };
  }
}

async function processMatchingResponse(conversationId: string, message: string): Promise<ProcessMessageResult> {
  const messageLower = message.toLowerCase();

  // User wants to see matches or just acknowledged the search
  if (messageLower.includes('yes') || messageLower.includes('show') || messageLower.includes('see') || messageLower.includes('moment')) {
    // Import the matcher service dynamically
    const { findMatchingTherapists } = await import('./therapistMatcher');

    try {
      // Check if user wants to see more results
      const offset = userMessage.toLowerCase().includes('more') || userMessage.toLowerCase().includes('next')
        ? 5 // Show next 5
        : 0; // Show first 5

      // Find matching therapists with pagination
      const result = await findMatchingTherapists(conversationId, offset, 5);
      const { therapists: matches, hasMore, total } = result;

      if (matches.length === 0 && offset === 0) {
        return {
          botResponse: {
            conversationId,
            sender: 'bot',
            content: `I apologize, but I couldn't find any therapists that match all of your preferences. However, I recommend:\n\n1. Broadening your search criteria (e.g., considering both in-person and virtual)\n2. Browsing our full therapist directory at /therapists\n3. Contacting us directly for personalized assistance\n\nWould you like to start a new search with different preferences?`,
            hasButtonOptions: true,
          },
          crisisDetected: false,
          shouldEscalate: false,
        };
      }

      // Format the matches into a readable message
      let matchMessage = offset === 0
        ? `Great news! I found ${total} therapist${total > 1 ? 's' : ''} near you. Here are the top ${matches.length} matches:\n\n`
        : `Here are ${matches.length} more therapists that match your preferences:\n\n`;

      matches.forEach((therapist, index) => {
        const name = therapist.firstName && therapist.lastName
          ? `${therapist.firstName} ${therapist.lastName}`
          : therapist.firstName || therapist.lastName || 'Unknown';
        const credentials = therapist.credentials || '';
        const location = therapist.city ? `${therapist.city}, ${therapist.state || ''}` : 'Location not specified';
        const score = therapist.matchScore;
        const reasons = therapist.matchReasons.slice(0, 2).join(', '); // Top 2 reasons

        matchMessage += `${offset + index + 1}. **${name}, ${credentials}**\n`;
        matchMessage += `   📍 ${location}\n`;
        matchMessage += `   ⭐ ${score}% match - ${reasons}\n`;
        matchMessage += `   👉 View profile: /therapists/${therapist.id}\n\n`;
      });

      if (hasMore) {
        matchMessage += `\n💡 I have ${total - offset - matches.length} more therapists that match your criteria. Type "show more" to see them.\n\n`;
      }

      matchMessage += `You can click on each therapist's profile link to learn more and book an appointment. Would you like help with anything else?`;

      return {
        botResponse: {
          conversationId,
          sender: 'bot',
          content: matchMessage,
          hasButtonOptions: hasMore,
        },
        crisisDetected: false,
        shouldEscalate: false,
      };
    } catch (error) {
      console.error('[MATCHING ERROR]', error);
      return {
        botResponse: {
          conversationId,
          sender: 'bot',
          content: `I encountered an error while searching for therapists. Please try browsing our directory directly at /therapists or contact our support team.`,
        },
        crisisDetected: false,
        shouldEscalate: false,
      };
    }
  }

  // Default response for other inputs at matching stage
  return {
    botResponse: {
      conversationId,
      sender: 'bot',
      content: `I've prepared therapist recommendations based on your preferences. Would you like to see them?`,
      hasButtonOptions: true,
    },
    crisisDetected: false,
    shouldEscalate: false,
  };
}

// ============================================
// STAGE QUESTIONS (Hardcoded Templates)
// ============================================

function getStageQuestions(stage: ConversationStage): StageQuestion[] {
  switch (stage) {
    case 'welcome':
      return [
        {
          content: "Hi! I'm the KareMatch matching assistant. I'm here to help you find a therapist who's the right fit for you.\n\n⚠️ Important: I'm an automated assistant, not a therapist. I can't provide medical advice or crisis support.\n\nIf you're experiencing a mental health emergency, please call 988 (Suicide & Crisis Lifeline) or go to your nearest emergency room.\n\nAre you ready to get started?",
          hasButtonOptions: true,
          buttonOptions: [
            { id: '1', label: "Yes, let's begin", value: 'yes' },
            { id: '2', label: 'I have questions first', value: 'questions' },
          ],
        },
      ];

    case 'demographics':
      return [
        {
          content: 'What city or ZIP code are you located in?',
          hasButtonOptions: false,
          validationType: 'zipCode',
          fieldName: 'locationZip',
        },
        {
          content: 'What age range are you in?',
          hasButtonOptions: true,
          buttonOptions: [
            { id: '1', label: '18-24', value: '18-24' },
            { id: '2', label: '25-34', value: '25-34' },
            { id: '3', label: '35-44', value: '35-44' },
            { id: '4', label: '45-54', value: '45-54' },
            { id: '5', label: '55-64', value: '55-64' },
            { id: '6', label: '65+', value: '65+' },
          ],
          fieldName: 'ageRange',
        },
      ];

    case 'preferences':
      return [
        {
          content: 'Do you prefer in-person sessions, video sessions, or would either work for you?',
          hasButtonOptions: true,
          buttonOptions: [
            { id: '1', label: 'In-person', value: 'in-person' },
            { id: '2', label: 'Virtual', value: 'virtual' },
            { id: '3', label: 'Either', value: 'either' },
          ],
          fieldName: 'sessionFormat',
        },
        {
          content: 'Are you looking for a therapist who uses a specific approach?',
          hasButtonOptions: true,
          buttonOptions: [
            { id: '1', label: 'CBT', value: 'CBT' },
            { id: '2', label: 'DBT', value: 'DBT' },
            { id: '3', label: 'Mindfulness-based', value: 'mindfulness' },
            { id: '4', label: 'Talk therapy', value: 'talk-therapy' },
            { id: '5', label: 'Trauma-focused', value: 'trauma-focused' },
            { id: '6', label: "Not sure", value: 'not-sure' },
          ],
          fieldName: 'therapyApproach',
        },
      ];

    case 'goals':
      return [
        {
          content: 'What are you hoping to work on in therapy? (Feel free to share as much or as little as you like)',
          hasButtonOptions: false,
          validationType: 'text',
          fieldName: 'treatmentGoals',
        },
      ];

    case 'insurance':
      return [
        {
          content: 'Do you plan to use insurance or pay out-of-pocket?',
          hasButtonOptions: true,
          buttonOptions: [
            { id: '1', label: 'Insurance', value: 'insurance' },
            { id: '2', label: 'Out-of-pocket', value: 'out-of-pocket' },
            { id: '3', label: 'Not sure', value: 'not-sure' },
          ],
          fieldName: 'paymentMethod',
        },
      ];

    case 'matching':
      return [
        {
          content: "I'm searching for therapists who match your preferences...",
          hasButtonOptions: false,
        },
      ];

    default:
      return [];
  }
}

/**
 * Initialize a new conversation
 */
export async function initializeConversation(sessionId?: string, userId?: string): Promise<string> {
  // Set expiration to 30 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const [conversation] = await db.insert(chatConversations).values({
    sessionId,
    userId,
    stage: 'welcome',
    expiresAt,
  }).returning();

  // Send welcome messages
  const welcomeQuestions = getStageQuestions('welcome');
  for (const question of welcomeQuestions) {
    await db.insert(chatMessages).values({
      conversationId: conversation.id,
      sender: 'bot',
      content: question.content,
      hasButtonOptions: question.hasButtonOptions || false,
      isDisclaimer: question.content.includes('⚠️'),
    });
  }

  return conversation.id;
}

/**
 * Get conversation context (all collected preferences)
 */
export async function getConversationContext(conversationId: string) {
  const [conversation] = await db
    .select()
    .from(chatConversations)
    .where(eq(chatConversations.id, conversationId))
    .limit(1);

  const [preferences] = await db
    .select()
    .from(chatPreferences)
    .where(eq(chatPreferences.conversationId, conversationId))
    .limit(1);

  return {
    conversation,
    preferences,
  };
}
