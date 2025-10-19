/**
 * Crisis keyword detection utility
 * Immediately flags conversations that mention self-harm, suicide, or danger
 *
 * IMPORTANT: This is a client-side safety check only.
 * Backend must also implement server-side crisis detection for reliability.
 */

const CRISIS_KEYWORDS = [
  // Suicide-related
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

  // Self-harm
  'hurt myself',
  'hurting myself',
  'harm myself',
  'harming myself',
  'cut myself',
  'cutting myself',
  'self-harm',
  'self harm',
  'overdose',

  // Method-specific (high risk)
  'jump off',
  'hang myself',
  'hanging myself',
  'shoot myself',
  'shooting myself',
];

const ABUSE_KEYWORDS = [
  'child abuse',
  'abusing a child',
  'molesting',
  'sexual abuse of child',
];

const VIOLENCE_KEYWORDS = [
  'kill someone',
  'hurt someone',
  'going to hurt',
  'planning to hurt',
  'murder',
];

/**
 * Detect crisis-related keywords in user input
 * @param input - User message text
 * @returns true if crisis keywords detected
 */
export function detectCrisisKeywords(input: string): boolean {
  const normalizedInput = input.toLowerCase().trim();

  return CRISIS_KEYWORDS.some((keyword) =>
    normalizedInput.includes(keyword.toLowerCase())
  );
}

/**
 * Detect child abuse mentions (mandatory reporting)
 * @param input - User message text
 * @returns true if abuse keywords detected
 */
export function detectAbuseKeywords(input: string): boolean {
  const normalizedInput = input.toLowerCase().trim();

  return ABUSE_KEYWORDS.some((keyword) =>
    normalizedInput.includes(keyword.toLowerCase())
  );
}

/**
 * Detect violence/threat keywords
 * @param input - User message text
 * @returns true if violence keywords detected
 */
export function detectViolenceKeywords(input: string): boolean {
  const normalizedInput = input.toLowerCase().trim();

  return VIOLENCE_KEYWORDS.some((keyword) =>
    normalizedInput.includes(keyword.toLowerCase())
  );
}

/**
 * Get crisis type for logging and escalation
 */
export function getCrisisType(
  input: string
): 'suicide' | 'self-harm' | 'abuse' | 'violence' | null {
  if (detectCrisisKeywords(input)) return 'suicide';
  if (detectAbuseKeywords(input)) return 'abuse';
  if (detectViolenceKeywords(input)) return 'violence';
  return null;
}
