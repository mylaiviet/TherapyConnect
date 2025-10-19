Based on our conversation, here's a comprehensive prompt for Claude.ai to build your safe intake chatbot:

---

**PROMPT FOR CLAUDE.AI:**

# Task: Build HIPAA-Compliant Therapy Matching Chatbot for TherapyConnect

You are building an intake chatbot for a behavioral health provider matching platform called TherapyConnect. This chatbot helps patients find appropriate therapists through **administrative matching only**—it does NOT provide therapy, clinical assessment, or medical advice.

## Critical Constraints

### Legal Requirements
1. **Positioning**: You are an administrative matching assistant, NOT a therapist or clinical tool
2. **No clinical assessment**: Never diagnose, assess symptom severity, or provide therapeutic guidance
3. **State compliance**: Illinois, Nevada, and Utah ban AI therapy—ensure you operate as a matching concierge only
4. **Crisis escalation**: Immediately escalate any mention of suicide, self-harm, or danger to human crisis resources

### PHI Protection Requirements
1. **Zero PHI to LLM**: No protected health information may be sent to external LLM APIs (including Claude, ChatGPT, etc.)
2. **Data minimization**: Collect only information necessary for provider matching
3. **Tokenization**: Encrypt and tokenize any identifiable information before processing

## Architecture: Rule-Based Flow with Limited LLM Enhancement

### Primary System: Deterministic Decision Tree (90% of functionality)

Build a **state machine** with predefined conversation stages:

**Stage 1: Welcome + Legal Disclaimers**
- Hardcoded greeting
- Explicit disclaimer: "I'm an automated assistant designed to help match you with a therapist. I'm not a therapist myself and can't provide medical advice or crisis support."
- Crisis resources displayed upfront: "If you're experiencing a mental health emergency, please call 988 (Suicide & Crisis Lifeline) or go to your nearest emergency room."
- Persistent button: "Speak with a human team member" (available throughout)

**Stage 2: Basic Demographics (Administrative Data Only)**
Safe questions to ask:
- "What would you like me to call you?" → Tokenize immediately, do not send to LLM
- "What city or zip code are you located in?" → Store as range, not exact address
- "What's your age range?" → Provide options: 18-24, 25-34, 35-44, 45-54, 55-64, 65+
- "What pronouns do you use?"
- "What language(s) do you prefer for therapy sessions?"

**Stage 3: Provider Preference Questions (Matching Criteria)**
Safe questions to ask:
- "Do you prefer in-person sessions, virtual sessions, or either?"
- "What days and times typically work best for appointments?" → General windows only
- "Do you have a preference for your therapist's gender or age range?"
- "Would you prefer a therapist who shares your cultural, religious, or ethnic background?"
- "Are you looking for a specific therapy approach?" → Provide options: CBT, DBT, mindfulness-based, talk therapy, psychodynamic, trauma-focused, family therapy
- "Have you worked with a therapist before?" → If yes: "What was helpful or unhelpful about past experiences?"

**Stage 4: General Treatment Goals (Non-Clinical)**
Safe questions to ask:
- "What are you hoping to work on in therapy?" → Open-ended but don't probe for symptoms
- "Are you looking for short-term support for a specific challenge, or longer-term therapy?"

**Stage 5: Insurance/Payment (Delay Until Needed)**
Safe questions to ask:
- "Do you plan to use insurance or pay out-of-pocket?"
- If insurance: "What insurance provider do you have?"
- If out-of-pocket: "What's your budget range per session?"

**Stage 6: Match Presentation**
- Display 3-5 matched providers based on collected preferences
- No LLM needed—simple template: "Based on your preferences, here are [NUMBER] therapists in [CITY] who specialize in [APPROACHES]:"

### Questions You Must NEVER Ask

**Clinical Assessment (creates legal liability)**:
- ❌ "Are you thinking about harming yourself or others?"
- ❌ "On a scale of 1-10, how severe is your depression/anxiety?"
- ❌ "Have you been diagnosed with [condition]?"
- ❌ "What psychiatric medications are you taking?"
- ❌ "How much alcohol/drugs do you use per week?"
- ❌ "Describe traumatic experiences from your past"
- ❌ "Are you experiencing physical symptoms like chest pain or dizziness?"

**Detailed PHI (unnecessary for matching)**:
- ❌ Full birthdate (use age ranges)
- ❌ Full home address (use ZIP code)
- ❌ Social Security Number
- ❌ Medical record numbers
- ❌ Specific appointment dates before match is confirmed

### Limited LLM Usage (10% of functionality)

**Use LLM ONLY for**:
1. **Non-PHI FAQ responses** via RAG:
   - "How does TherapyConnect's matching process work?"
   - "What's your privacy policy?"
   - "What insurance providers do you accept?"
   - RAG retrieves from approved knowledge base (FAQs, policies, provider directory descriptions)

2. **Optional tone personalization** (within rule-based templates):
   - Template: "Based on your preferences for [THERAPY_TYPE] in [CITY], here are [NUMBER] providers"
   - LLM enhancement: Make tone warmer while preserving exact variables
   - Never allow LLM to generate clinical content

**LLM Safeguards**:
- Use HIPAA-compliant endpoint (Azure OpenAI with BAA, AWS Bedrock, Anthropic HIPAA)
- Implement prompt injection protection
- Never send user-entered names, locations, symptoms, or preferences to LLM for generation
- Use LLM only for pre-approved FAQ responses from sanitized knowledge base

### Safety Layer: Keyword Detection (Overrides Everything)

Implement immediate triggers that bypass all LLM logic:

```
IF user_input contains ["suicide", "kill myself", "end my life", "want to die", "overdose", "hurt myself"]:
  → PAUSE chatbot immediately
  → DISPLAY: "I'm concerned about your safety. Please contact these resources immediately:
     • Call 988 (Suicide & Crisis Lifeline)
     • Text 'HELLO' to 741741 (Crisis Text Line)
     • Call 911 or go to your nearest emergency room
     Would you like to speak with a human team member right now?"
  → LOG incident with timestamp
  → ALERT human staff for follow-up
  → DO NOT attempt to assess or respond clinically
```

Additional triggers:
- Child abuse mentions → Mandatory reporting notice + human escalation
- Severe psychiatric symptoms (psychosis, mania) → Immediate human handoff
- Violence/threats to others → Human escalation + safety protocol

### Technical Implementation for PHI Protection

**Data Flow**:
1. User enters information in frontend
2. Client-side validation (required fields only)
3. TLS 1.3 encrypted transmission
4. API gateway authenticates request
5. **PHI Detection**: Check if input contains identifiable information
   - Names → Tokenize immediately, store as [TOKEN_001]
   - Email/phone → Tokenize immediately, store as [TOKEN_002]
   - Location → Store only ZIP code, not full address
6. **Conversation state**: Store only tokens + non-PHI preferences
7. **Matching logic**: Runs on tokenized data + preference ranges
8. **LLM calls**: ONLY sent non-PHI questions ("How does matching work?")—never user data
9. When user selects provider → Retrieve real contact info from token vault → Send to scheduling system

**Storage Architecture**:
- **Conversation logs**: Store in HIPAA-compliant DB with tokens only
- **Token vault**: Separate encrypted database mapping tokens to real values
- **Matching preferences**: Non-PHI data (therapy type, session format) stored unencrypted
- **Retention**: Delete conversation logs after 30 days or successful booking, whichever comes first

### Output Requirements

Provide code/pseudocode for:

1. **State machine definition** for the 6-stage conversation flow
2. **Hardcoded question templates** for each stage with button-based responses where possible
3. **Keyword detection rules** for safety triggers
4. **Tokenization functions** that encrypt PHI before storage
5. **RAG implementation** for FAQ responses (knowledge base queries only)
6. **Crisis escalation protocol** (UI components + backend alerts)
7. **Conversation flow diagram** showing all possible paths

### Sample Safe Conversation Flow

```
Bot: "Hi! I'm the TherapyConnect matching assistant. I'm here to help you find a therapist who's the right fit for you. Just so you know, I'm an automated assistant, not a therapist, and I can't provide medical advice or crisis support. If you're experiencing a mental health emergency, please call 988 or visit your nearest ER. Are you ready to get started?"

User: "Yes"

Bot: "Great! To help find the best match, I'll ask a few questions about your preferences. Let's start with: What city or ZIP code are you located in?"

User: "Austin, TX 78701"

Bot: "Thanks! Do you prefer in-person sessions, video sessions, or would either work for you?"
[Display buttons: In-person | Virtual | Either]

User: [Clicks "Virtual"]

Bot: "Got it. What days and times typically work best for appointments?"
[Display buttons: Weekday mornings | Weekday evenings | Weekends | Flexible]

User: [Clicks "Weekday evenings"]

Bot: "Are you looking for a therapist who uses a specific approach? Here are some common ones:"
[Display buttons: CBT | Mindfulness-based | Talk therapy | Trauma-focused | Not sure]

User: [Clicks "CBT"]

Bot: "Perfect. One last question: Do you plan to use insurance or pay out-of-pocket?"
[Display buttons: Insurance | Out-of-pocket]

User: [Clicks "Insurance"]

Bot: "What insurance provider do you have?"
[Display dropdown or text input]

User: "Blue Cross Blue Shield"

Bot: "Excellent! Based on your preferences for virtual CBT sessions on weekday evenings in Austin with BCBS insurance, here are 4 therapists who might be a great fit:

1. Dr. Sarah Johnson - Licensed Psychologist, specializes in CBT for anxiety and depression
2. Michael Chen, LCSW - 10+ years experience, evening availability
3. Dr. Amanda Rodriguez - Bilingual (English/Spanish), trauma-informed CBT
4. James Thompson, LPC - Accepts BCBS, focuses on young adults

Would you like to schedule a consultation with any of these providers?"
```

## Success Criteria

✅ Chatbot collects only necessary matching information
✅ Zero PHI sent to external LLM APIs
✅ All clinical questions avoided
✅ Crisis situations immediately escalated to humans
✅ User can complete intake in 5-10 minutes
✅ Conversation feels friendly but clearly administrative
✅ HIPAA-compliant data handling throughout
✅ Explicit disclaimers prevent scope creep into therapy

Build this system prioritizing **legal safety and PHI protection** over conversational sophistication. A slightly robotic but legally compliant chatbot is far superior to a smooth conversationalist that exposes the platform to wrongful death lawsuits or HIPAA violations.

---

**END OF PROMPT**

This prompt synthesizes all the key requirements from our discussion into actionable instructions that maintain legal compliance while building a functional matching tool.[1][2][3][4]

[1](https://www.psychologytoday.com/us/blog/on-vitality/202509/ai-chatbots-in-therapy)
[2](https://theselfspace.com/therapist-matching/)
[3](https://bastiongpt.com/post/tokenization-anonymization-hipaa-compliance-risks)
[4](https://www.atlantic.net/hipaa-compliant-hosting/hipaa-ready-ai-chatbots-secure-hosting-for-healthcare-innovation/)