/**
 * Server-Side Crisis Detection Service
 * CRITICAL: Redundant safety layer beyond client-side detection
 *
 * Detects crisis keywords in user messages and triggers appropriate responses:
 * - Suicide/self-harm
 * - Child abuse (mandatory reporting)
 * - Violence/threats to others
 */

import { db } from '../db';
import { chatEscalations } from '@shared/schema';

// Crisis keyword databases (mirrored from client-side for server validation)
const CRISIS_KEYWORDS = {
  suicide: [
    'suicide',
    'suicidal',
    'kill myself',
    'killing myself',
    'end my life',
    'ending my life',
    'want to die',
    'wanna die',
    'better off dead',
    'no reason to live',
    'ready to die',
    'not worth living',
  ],
  selfHarm: [
    'hurt myself',
    'hurting myself',
    'harm myself',
    'harming myself',
    'cut myself',
    'cutting myself',
    'self-harm',
    'self harm',
    'overdose',
    'burn myself',
    'burning myself',
  ],
  methods: [
    'jump off',
    'hang myself',
    'hanging myself',
    'shoot myself',
    'shooting myself',
    'pills',
    'slit my wrists',
  ],
};

const ABUSE_KEYWORDS = [
  'child abuse',
  'abusing a child',
  'molesting',
  'sexual abuse of child',
  'hurting a child',
  'child neglect',
];

const VIOLENCE_KEYWORDS = [
  'kill someone',
  'hurt someone',
  'going to hurt',
  'planning to hurt',
  'murder',
  'homicide',
  'shoot',
  'stab',
];

export type CrisisType = 'suicide' | 'self-harm' | 'abuse' | 'violence' | null;

export interface CrisisDetectionResult {
  detected: boolean;
  type: CrisisType;
  keywords: string[];
  severity: 'high' | 'medium' | 'low';
  actionRequired: string[];
}

/**
 * Main crisis detection function
 * @param message - User message to analyze
 * @returns Detection result with type, keywords, and severity
 */
export function detectCrisis(message: string): CrisisDetectionResult {
  const normalizedMessage = message.toLowerCase().trim();

  // Check for suicide keywords
  const suicideKeywords = detectKeywords(normalizedMessage, CRISIS_KEYWORDS.suicide);
  if (suicideKeywords.length > 0) {
    return {
      detected: true,
      type: 'suicide',
      keywords: suicideKeywords,
      severity: 'high',
      actionRequired: [
        'display_crisis_resources',
        'log_escalation',
        'notify_staff',
        'pause_conversation',
      ],
    };
  }

  // Check for self-harm keywords
  const selfHarmKeywords = detectKeywords(normalizedMessage, CRISIS_KEYWORDS.selfHarm);
  if (selfHarmKeywords.length > 0) {
    return {
      detected: true,
      type: 'self-harm',
      keywords: selfHarmKeywords,
      severity: 'high',
      actionRequired: [
        'display_crisis_resources',
        'log_escalation',
        'notify_staff',
        'pause_conversation',
      ],
    };
  }

  // Check for specific methods (highest risk)
  const methodKeywords = detectKeywords(normalizedMessage, CRISIS_KEYWORDS.methods);
  if (methodKeywords.length > 0) {
    return {
      detected: true,
      type: 'suicide',
      keywords: methodKeywords,
      severity: 'high',
      actionRequired: [
        'display_crisis_resources',
        'log_escalation',
        'notify_staff_immediately',
        'pause_conversation',
      ],
    };
  }

  // Check for abuse keywords (mandatory reporting)
  const abuseKeywords = detectKeywords(normalizedMessage, ABUSE_KEYWORDS);
  if (abuseKeywords.length > 0) {
    return {
      detected: true,
      type: 'abuse',
      keywords: abuseKeywords,
      severity: 'high',
      actionRequired: [
        'display_reporting_resources',
        'log_escalation',
        'notify_staff_immediately',
        'mandatory_reporting_protocol',
      ],
    };
  }

  // Check for violence keywords
  const violenceKeywords = detectKeywords(normalizedMessage, VIOLENCE_KEYWORDS);
  if (violenceKeywords.length > 0) {
    return {
      detected: true,
      type: 'violence',
      keywords: violenceKeywords,
      severity: 'high',
      actionRequired: [
        'display_safety_resources',
        'log_escalation',
        'notify_staff_immediately',
        'pause_conversation',
      ],
    };
  }

  // No crisis detected
  return {
    detected: false,
    type: null,
    keywords: [],
    severity: 'low',
    actionRequired: [],
  };
}

/**
 * Detect specific keywords in message
 * @param message - Normalized message
 * @param keywords - Array of keywords to check
 * @returns Array of detected keywords
 */
function detectKeywords(message: string, keywords: string[]): string[] {
  return keywords.filter((keyword) => message.includes(keyword.toLowerCase()));
}

/**
 * Log crisis escalation to database
 * @param conversationId - Conversation ID
 * @param message - Trigger message
 * @param result - Crisis detection result
 */
export async function logCrisisEscalation(
  conversationId: string,
  message: string,
  result: CrisisDetectionResult
): Promise<void> {
  try {
    await db.insert(chatEscalations).values({
      conversationId,
      escalationType: result.type === 'abuse' ? 'abuse_report' : 'crisis',
      triggerMessage: message,
      crisisKeywords: result.keywords,
      actionTaken: result.actionRequired.join(', '),
      staffNotified: result.actionRequired.includes('notify_staff_immediately') ||
                     result.actionRequired.includes('notify_staff'),
      staffNotifiedAt: new Date(),
    });

    console.log(`[CRISIS] Escalation logged for conversation ${conversationId}`, {
      type: result.type,
      severity: result.severity,
      keywords: result.keywords,
    });
  } catch (error) {
    console.error('Failed to log crisis escalation:', error);
    // Don't throw - logging failure shouldn't block crisis response
  }
}

/**
 * Get crisis resources based on crisis type
 * @param type - Type of crisis
 * @returns Crisis resources object
 */
export function getCrisisResources(type: CrisisType): {
  title: string;
  message: string;
  resources: Array<{ name: string; contact: string; description: string }>;
} {
  switch (type) {
    case 'suicide':
    case 'self-harm':
      return {
        title: '🚨 CRISIS RESOURCES - PLEASE READ',
        message: "If you're experiencing a mental health emergency, please contact these resources immediately:",
        resources: [
          {
            name: '988 Suicide & Crisis Lifeline',
            contact: 'Call or text 988',
            description: '24/7 support for people in suicidal crisis or emotional distress',
          },
          {
            name: 'Crisis Text Line',
            contact: 'Text "HELLO" to 741741',
            description: 'Free, 24/7 support via text message',
          },
          {
            name: 'Emergency Services',
            contact: 'Call 911',
            description: 'For immediate life-threatening emergencies',
          },
          {
            name: 'Trevor Project (LGBTQ+ Youth)',
            contact: 'Call 1-866-488-7386 or text START to 678678',
            description: 'Crisis intervention and suicide prevention for LGBTQ+ young people',
          },
        ],
      };

    case 'abuse':
      return {
        title: '⚠️ REPORTING RESOURCES',
        message: 'If you are aware of child abuse or neglect:',
        resources: [
          {
            name: 'Childhelp National Child Abuse Hotline',
            contact: 'Call 1-800-422-4453',
            description: '24/7 professional crisis counselors',
          },
          {
            name: 'Local Child Protective Services',
            contact: 'Call 911 or your local authorities',
            description: 'Mandatory reporting to protect children',
          },
        ],
      };

    case 'violence':
      return {
        title: '🚨 SAFETY RESOURCES',
        message: 'If you or someone else is in immediate danger:',
        resources: [
          {
            name: 'Emergency Services',
            contact: 'Call 911 immediately',
            description: 'For threats or danger to yourself or others',
          },
          {
            name: 'National Domestic Violence Hotline',
            contact: 'Call 1-800-799-7233',
            description: '24/7 support for domestic violence situations',
          },
        ],
      };

    default:
      return {
        title: 'Support Resources',
        message: 'If you need support:',
        resources: [
          {
            name: '988 Lifeline',
            contact: 'Call or text 988',
            description: '24/7 mental health support',
          },
        ],
      };
  }
}

/**
 * Determine if message requires immediate staff notification
 * @param result - Crisis detection result
 * @returns true if immediate notification required
 */
export function requiresImmediateNotification(result: CrisisDetectionResult): boolean {
  return (
    result.detected &&
    (result.severity === 'high' ||
     result.type === 'abuse' ||
     result.actionRequired.includes('notify_staff_immediately'))
  );
}

/**
 * Get recommended actions for staff
 * @param result - Crisis detection result
 * @returns Array of recommended actions
 */
export function getStaffActions(result: CrisisDetectionResult): string[] {
  const actions: string[] = [];

  if (!result.detected) return actions;

  switch (result.type) {
    case 'suicide':
    case 'self-harm':
      actions.push('Review conversation history');
      actions.push('Assess if user needs emergency intervention');
      actions.push('Prepare to make wellness check call if contact info available');
      actions.push('Document incident per HIPAA guidelines');
      break;

    case 'abuse':
      actions.push('Follow mandatory reporting protocol');
      actions.push('Contact local child protective services');
      actions.push('Document all details of disclosure');
      actions.push('Consult legal team if needed');
      break;

    case 'violence':
      actions.push('Assess threat level and immediacy');
      actions.push('Contact appropriate authorities if credible threat');
      actions.push('Document conversation');
      actions.push('Consider duty to warn protocols');
      break;

    default:
      actions.push('Review conversation');
      actions.push('Follow up if contact info available');
  }

  return actions;
}

/**
 * Check if message contains potential crisis indicators (less severe)
 * Used for flagging messages that might need human review
 * @param message - User message
 * @returns true if potential concern detected
 */
export function detectPotentialConcern(message: string): boolean {
  const concernKeywords = [
    'hopeless',
    'worthless',
    'can\'t go on',
    'no point',
    'give up',
    'despair',
    'unbearable',
    'can\'t take it',
  ];

  const normalizedMessage = message.toLowerCase();
  return concernKeywords.some((keyword) => normalizedMessage.includes(keyword));
}
