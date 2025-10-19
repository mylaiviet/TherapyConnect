# TherapyConnect Chatbot UI Mockup & Design Specification

## Overview
HIPAA-compliant therapy matching chatbot with button-based interactions, crisis detection, and administrative matching focus.

---

## 1. Chat Widget States

### State A: Collapsed/Minimized (Default)
```
┌────────────────────────────────────────────────────────────┐
│                                    Browser Window          │
│                                                            │
│  [Header: TherapyConnect Logo | Nav | Login]              │
│                                                            │
│                                                            │
│                    Page Content Here                       │
│                                                            │
│                                                            │
│                                              ┌───────────┐ │
│                                              │  💬       │ │
│                                              │  Chat     │ │
│                                              │  (1)      │ │ <- Unread badge
│                                              └───────────┘ │
│                                                      ↑     │
│                                    Fixed bottom-right      │
└────────────────────────────────────────────────────────────┘
```

**Design Details:**
- Circular or rounded square button
- Gradient background (blue/teal matching brand)
- Pulse animation on first load
- Badge shows unread messages
- Always visible, z-index: 9999

---

### State B: Expanded Chat Window
```
┌────────────────────────────────────────────────────────────┐
│                                    Browser Window          │
│                                                            │
│  [Header: TherapyConnect Logo | Nav | Login]              │
│                                                            │
│                                      ┌──────────────────┐  │
│                                      │ Chat Header      │  │
│                  Page Content        │ ──────────────── │  │
│                  (Dimmed/Blurred)    │                  │  │
│                                      │  Chat Messages   │  │
│                                      │                  │  │
│                                      │                  │  │
│                                      │  ──────────────  │  │
│                                      │  Input Area      │  │
│                                      └──────────────────┘  │
│                                                ↑           │
│                                   Fixed bottom-right       │
│                                   400px W × 600px H        │
└────────────────────────────────────────────────────────────┘
```

**Dimensions:**
- Width: 400px (mobile: 100vw)
- Height: 600px (mobile: 100vh)
- Position: Bottom-right, 20px margin
- Shadow: Large drop shadow
- Border radius: 16px

---

## 2. Detailed Chat Window Layout

### Full Chat Window Anatomy
```
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────┐ │
│ │  HEADER                                             │ │
│ │  🤖 TherapyConnect Assistant        [Speak to Human│ │
│ │                                      ─ □ ✕]        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  CRISIS ALERT (Conditional - Only if triggered)     │ │
│ │  ⚠️  IMPORTANT SAFETY RESOURCES                     │ │
│ │  If you're in crisis, please contact:               │ │
│ │  • 988 - Suicide & Crisis Lifeline                  │ │
│ │  • 741741 - Crisis Text Line                        │ │
│ │  • 911 - Emergency Services                         │ │
│ │  [Speak with Human Now]                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  MESSAGE AREA (Scrollable)                          │ │
│ │                                                      │ │
│ │  ┌────────────────────────────────────────────┐     │ │
│ │  │ BOT MESSAGE (Left-aligned, Gray bubble)    │     │ │
│ │  │ Hi! I'm the TherapyConnect matching        │     │ │
│ │  │ assistant. I'm here to help you find a     │     │ │
│ │  │ therapist who's the right fit for you.     │     │ │
│ │  └────────────────────────────────────────────┘     │ │
│ │       10:23 AM                                       │ │
│ │                                                      │ │
│ │  ┌────────────────────────────────────────────┐     │ │
│ │  │ DISCLAIMER BOX (Yellow/Warning background) │     │ │
│ │  │ ⚠️ Important: I'm an automated assistant,  │     │ │
│ │  │ not a therapist. I can't provide medical   │     │ │
│ │  │ advice or crisis support.                  │     │ │
│ │  └────────────────────────────────────────────┘     │ │
│ │                                                      │ │
│ │  ┌────────────────────────────────────────────┐     │ │
│ │  │ BOT MESSAGE (Button Options)               │     │ │
│ │  │ Are you ready to get started?              │     │ │
│ │  │                                             │     │ │
│ │  │  [Yes, let's begin]  [I have questions]    │     │ │
│ │  └────────────────────────────────────────────┘     │ │
│ │                                                      │ │
│ │          ┌──────────────────────────────────┐        │ │
│ │          │ USER MESSAGE (Right, Blue bubble)│        │ │
│ │          │ Yes, let's begin                 │        │ │
│ │          └──────────────────────────────────┘        │ │
│ │                                      10:24 AM        │ │
│ │                                                      │ │
│ │  ┌────────────────────────────────────────────┐     │ │
│ │  │ BOT MESSAGE                                │     │ │
│ │  │ Great! What city or ZIP code are you       │     │ │
│ │  │ located in?                                │     │ │
│ │  └────────────────────────────────────────────┘     │ │
│ │                                                      │ │
│ │                                                      │ │
│ │  [Auto-scroll to bottom]                            │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  TYPING INDICATOR (when bot is "thinking")          │ │
│ │  🤖 TherapyConnect is typing... ● ● ●              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  INPUT AREA                                         │ │
│ │  ┌───────────────────────────────────────────────┐  │ │
│ │  │ Type your message...                    [📎] │  │ │
│ │  └───────────────────────────────────────────────┘  │ │
│ │                                          [Send ➤]   │ │
│ │                                                      │ │
│ │  Character limit: 500 characters remaining          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  FOOTER                                             │ │
│ │  🔒 Your privacy is protected - HIPAA compliant     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Message Types & Components

### A. Bot Message (Left-aligned)
```
┌──────────────────────────────────────────┐
│ BOT MESSAGE                              │
│ Background: #F3F4F6 (gray-100)           │
│ Border-radius: 16px (top-right only)     │
│                                          │
│ What city or ZIP code are you located    │
│ in? This helps us find therapists near   │
│ you.                                     │
└──────────────────────────────────────────┘
10:25 AM
```

**Styling:**
- Text color: #111827 (gray-900)
- Padding: 12px 16px
- Max-width: 75%
- Font: 14px, line-height 1.5
- Timestamp: 11px, gray-500

---

### B. User Message (Right-aligned)
```
                    ┌──────────────────────┐
                    │ USER MESSAGE         │
                    │ Background: #3B82F6  │
                    │ (blue-500)           │
                    │                      │
                    │ Austin, TX 78701     │
                    └──────────────────────┘
                                    10:25 AM
```

**Styling:**
- Text color: #FFFFFF (white)
- Padding: 12px 16px
- Max-width: 75%
- Border-radius: 16px (top-left only)
- Font: 14px, line-height 1.5

---

### C. Button Options (Multi-choice)
```
┌──────────────────────────────────────────┐
│ BOT MESSAGE                              │
│                                          │
│ Do you prefer in-person sessions, video  │
│ sessions, or would either work?          │
│                                          │
│  ┌──────────────┐  ┌──────────────┐     │
│  │  In-person   │  │   Virtual    │     │
│  └──────────────┘  └──────────────┘     │
│           ┌──────────────┐              │
│           │    Either    │              │
│           └──────────────┘              │
└──────────────────────────────────────────┘
```

**Button Styling:**
- Border: 2px solid #3B82F6
- Background: #FFFFFF (hover: #EFF6FF)
- Color: #3B82F6 (hover: #2563EB)
- Padding: 10px 20px
- Border-radius: 8px
- Font-weight: 500
- Transition: all 0.2s
- Disabled after selection (grayed out)

---

### D. Disclaimer/Alert Box
```
┌──────────────────────────────────────────┐
│ ⚠️  IMPORTANT                            │
│ ────────────────────────────────────────│
│ I'm an automated assistant, not a        │
│ therapist. I can't provide medical       │
│ advice or crisis support.                │
│                                          │
│ Emergency? Call 988 or 911               │
└──────────────────────────────────────────┘
```

**Styling:**
- Background: #FEF3C7 (amber-100)
- Border-left: 4px solid #F59E0B (amber-500)
- Padding: 12px 16px
- Icon: ⚠️ or alert-triangle from lucide-react
- Font-size: 13px

---

### E. Crisis Alert (Full-width Banner)
```
╔═══════════════════════════════════════════╗
║ 🚨 CRISIS RESOURCES - PLEASE READ         ║
╠═══════════════════════════════════════════╣
║ If you're experiencing a mental health    ║
║ emergency, please contact:                ║
║                                           ║
║ 📞 988 - Suicide & Crisis Lifeline        ║
║ 💬 Text "HELLO" to 741741                 ║
║ 🚑 Call 911 or go to nearest ER           ║
║                                           ║
║  [Speak with Human Team Member Now]       ║
╚═══════════════════════════════════════════╝
```

**Styling:**
- Background: #FEE2E2 (red-100)
- Border: 2px solid #DC2626 (red-600)
- Padding: 16px
- Position: Top of message area (sticky)
- Button: Red, prominent
- Animation: Fade-in, pulse

---

### F. Therapist Match Results
```
┌──────────────────────────────────────────┐
│ BOT MESSAGE                              │
│                                          │
│ Based on your preferences, here are 4    │
│ therapists who might be a great fit:     │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ 👤 Dr. Sarah Johnson                 │ │
│ │ Licensed Psychologist                │ │
│ │ Specialties: CBT, Anxiety, Depression│ │
│ │ 📍 Austin, TX | 💻 Virtual available │ │
│ │ 💰 Accepts Blue Cross Blue Shield    │ │
│ │                                      │ │
│ │ [View Profile]  [Book Consultation] │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ 👤 Michael Chen, LCSW                │ │
│ │ Licensed Clinical Social Worker      │ │
│ │ Specialties: Trauma, Mindfulness     │ │
│ │ 📍 Austin, TX | 🏢 In-person         │ │
│ │ 💰 Sliding scale available           │ │
│ │                                      │ │
│ │ [View Profile]  [Book Consultation] │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ [See all 4 matches]                      │
└──────────────────────────────────────────┘
```

**Card Styling:**
- Background: #FFFFFF
- Border: 1px solid #E5E7EB
- Border-radius: 12px
- Padding: 16px
- Shadow: sm
- Hover: shadow-md, border-blue-300

---

## 4. Conversation Stage Indicators

### Progress Bar (Top of chat window)
```
┌─────────────────────────────────────────────────────┐
│ Step 2 of 6: Demographics                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                                     │
│ ✓ Welcome   ➤ Demographics   ○ Preferences  ...    │
└─────────────────────────────────────────────────────┘
```

**Stages:**
1. Welcome
2. Demographics
3. Preferences
4. Goals
5. Insurance
6. Matching

**Icons:**
- ✓ Completed (green)
- ➤ Current (blue)
- ○ Upcoming (gray)

---

## 5. Input Validation & Feedback

### Real-time Validation
```
┌───────────────────────────────────────────────┐
│ Type your ZIP code...                   [📎] │
│ 7870                                          │
└───────────────────────────────────────────────┘
❌ Please enter a valid 5-digit ZIP code

OR

┌───────────────────────────────────────────────┐
│ Type your ZIP code...                   [📎] │
│ 78701                                         │
└───────────────────────────────────────────────┘
✅ Valid ZIP code
                                      [Send ➤]
```

**Validation Rules:**
- ZIP code: 5 digits
- Age: 18-100
- Text input: Max 500 characters
- Phone (optional): Standard format
- Email: RFC 5322 validation

---

## 6. Mobile Responsive Design

### Mobile View (< 768px)
```
┌─────────────────────────┐
│ ← TherapyConnect        │ <- Full-screen modal
│   Assistant     [Human] │
├─────────────────────────┤
│                         │
│ ┌─────────────────────┐ │
│ │ Bot message...      │ │
│ └─────────────────────┘ │
│        10:23 AM         │
│                         │
│     ┌─────────────────┐ │
│     │ User message... │ │
│     └─────────────────┘ │
│            10:24 AM     │
│                         │
│                         │
│ [Button Options]        │
│ [Go Full Width]         │
│                         │
├─────────────────────────┤
│ Type message...   [➤]  │
└─────────────────────────┘
```

**Mobile Adjustments:**
- Full-screen overlay
- Slide-up animation
- Back button to close
- Larger touch targets (min 44px)
- Simplified header
- Bottom-fixed input

---

## 7. Accessibility Features

### ARIA Labels & Keyboard Navigation
```
Chat Widget Button:
  - aria-label="Open therapy matching assistant"
  - role="button"
  - tabindex="0"
  - Enter/Space to activate

Message Area:
  - role="log"
  - aria-live="polite"
  - aria-atomic="false"

Input Field:
  - aria-label="Type your message"
  - aria-required="true"
  - aria-invalid="false"

Button Options:
  - role="group"
  - aria-label="Select your preference"
  - Tab navigation between buttons
  - Enter to select
```

**Keyboard Shortcuts:**
- `Esc` - Close chat window
- `Tab` - Navigate between elements
- `Enter` - Send message / Select button
- `Shift + Tab` - Navigate backwards

---

## 8. Animation & Transitions

### Message Animations
```typescript
// Framer Motion variants
const messageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

const chatWindowVariants = {
  collapsed: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.2 }
  },
  expanded: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};
```

**Animations:**
1. **Message entry:** Fade-in + slide-up
2. **Chat open:** Scale + fade-in
3. **Chat close:** Scale + fade-out
4. **Typing indicator:** Bouncing dots
5. **Button hover:** Scale 1.02 + shadow
6. **Crisis alert:** Pulse border

---

## 9. Color Palette (Tailwind Classes)

### Primary Colors
- **Bot messages:** `bg-gray-100 text-gray-900`
- **User messages:** `bg-blue-500 text-white`
- **Buttons (primary):** `bg-blue-600 hover:bg-blue-700 text-white`
- **Buttons (outline):** `border-blue-600 text-blue-600 hover:bg-blue-50`
- **Links:** `text-blue-600 hover:text-blue-800 underline`

### Alert Colors
- **Warning (disclaimer):** `bg-amber-100 border-amber-500 text-amber-900`
- **Crisis (danger):** `bg-red-100 border-red-600 text-red-900`
- **Success:** `bg-green-100 border-green-500 text-green-900`
- **Info:** `bg-blue-100 border-blue-500 text-blue-900`

### Neutral Colors
- **Background:** `bg-white`
- **Border:** `border-gray-200`
- **Text primary:** `text-gray-900`
- **Text secondary:** `text-gray-600`
- **Disabled:** `bg-gray-200 text-gray-400`

---

## 10. Component Architecture

### React Component Hierarchy
```
<ChatWidget>
  ├── <ChatButton collapsed={!isOpen} />
  │
  └── <ChatWindow isOpen={isOpen}>
        │
        ├── <ChatHeader>
        │     ├── <ChatTitle />
        │     ├── <HumanEscalationButton />
        │     └── <WindowControls />
        │
        ├── <ProgressIndicator stage={currentStage} />
        │
        ├── <CrisisAlert visible={crisisDetected} />
        │
        ├── <MessageArea>
        │     ├── <Message type="bot" />
        │     │     ├── <MessageBubble />
        │     │     ├── <ButtonOptions />
        │     │     └── <Timestamp />
        │     │
        │     ├── <Message type="user" />
        │     │     ├── <MessageBubble />
        │     │     └── <Timestamp />
        │     │
        │     └── <TypingIndicator visible={botTyping} />
        │
        ├── <ChatInput>
        │     ├── <TextArea />
        │     ├── <ValidationMessage />
        │     ├── <CharacterCounter />
        │     └── <SendButton />
        │
        └── <ChatFooter>
              └── <PrivacyNotice />
```

---

## 11. State Management

### Conversation State
```typescript
interface ConversationState {
  conversationId: string | null;
  stage: ConversationStage;
  messages: Message[];
  userPreferences: {
    location?: string;
    sessionFormat?: 'in-person' | 'virtual' | 'either';
    availability?: string[];
    therapyType?: string[];
    insurance?: string;
    budget?: string;
  };
  isTyping: boolean;
  crisisDetected: boolean;
  escalationRequested: boolean;
}

type ConversationStage =
  | 'welcome'
  | 'demographics'
  | 'preferences'
  | 'goals'
  | 'insurance'
  | 'matching';

interface Message {
  id: string;
  sender: 'bot' | 'user' | 'system';
  content: string;
  timestamp: Date;
  options?: ButtonOption[];
  metadata?: {
    isDisclaimer?: boolean;
    isCrisisAlert?: boolean;
    therapistMatches?: Therapist[];
  };
}
```

---

## 12. Example Conversation Flow Wireframes

### Flow 1: Welcome Stage
```
[BOT] Hi! I'm the TherapyConnect matching assistant...

      ⚠️ DISCLAIMER BOX

[BOT] Are you ready to get started?

      [Yes, let's begin]  [I have questions]
```

### Flow 2: Demographics Stage
```
[USER] Yes, let's begin

[BOT] Great! What city or ZIP code are you located in?

      [Text input: 78701]

[USER] Austin, TX 78701

[BOT] Thanks! What age range are you in?

      [18-24] [25-34] [35-44] [45-54] [55-64] [65+]
```

### Flow 3: Crisis Detection
```
[USER] I'm feeling really hopeless and don't want to live

🚨 CRISIS ALERT BANNER APPEARS 🚨

[BOT] I'm very concerned about your safety. Please
      contact these resources immediately:

      📞 988 - Suicide & Crisis Lifeline
      💬 Text "HELLO" to 741741
      🚑 Call 911 or go to nearest ER

      [Speak with Human Team Member Now]

      Would you like to continue finding a therapist
      for ongoing support?

      [Yes, continue]  [Speak with human]
```

### Flow 4: Matching Results
```
[BOT] Perfect! Based on your preferences for virtual
      CBT sessions in Austin with BCBS insurance,
      here are 4 therapists who might be a great fit:

      ┌─────────────────────────────────────┐
      │ 👤 Dr. Sarah Johnson                │
      │ Licensed Psychologist               │
      │ CBT, Anxiety, Depression            │
      │ 📍 Austin | 💻 Virtual | 💰 BCBS   │
      │ [View Profile] [Book Consultation]  │
      └─────────────────────────────────────┘

      [3 more therapist cards...]

      [See all matches]  [Refine search]
```

---

## 13. Technical Implementation Notes

### Using Shadcn UI Components
- **Dialog/Sheet:** Chat window container
- **Button:** All button interactions
- **Input/Textarea:** User text input
- **Badge:** Unread count, stage indicators
- **Alert:** Crisis alerts, disclaimers
- **Card:** Therapist match results
- **ScrollArea:** Message scrolling
- **Separator:** Visual dividers
- **Avatar:** Bot icon, therapist photos

### Using Lucide React Icons
- `MessageCircle` - Chat button
- `X` - Close button
- `Minimize2` - Minimize button
- `AlertTriangle` - Warning/crisis
- `Phone` - Phone crisis line
- `Send` - Send message
- `User` - Therapist avatar placeholder
- `MapPin` - Location
- `Video` - Virtual sessions
- `DollarSign` - Payment/insurance

### TanStack Query Integration
```typescript
// Fetch conversation history
useQuery({
  queryKey: ['chatConversation', conversationId],
  queryFn: () => fetchConversation(conversationId),
  enabled: !!conversationId
});

// Send message mutation
useMutation({
  mutationFn: (message: string) => sendChatMessage(message),
  onSuccess: (response) => {
    // Add bot response to messages
    // Update conversation stage if needed
  }
});
```

---

## 14. Success Metrics & UX Goals

### Performance Targets
- ✅ Chat window opens in < 200ms
- ✅ Message sent in < 100ms
- ✅ Bot response in < 1000ms (rule-based)
- ✅ Therapist matching in < 2000ms

### UX Goals
- ✅ Complete intake in 5-10 minutes
- ✅ < 3 clicks to start conversation
- ✅ 100% keyboard accessible
- ✅ Mobile-first responsive design
- ✅ Clear progress indication at all times
- ✅ Zero ambiguity about bot vs. human
- ✅ Crisis resources always < 2 clicks away

---

## 15. Next Steps for Implementation

Based on this mockup, we'll build:

1. **Core Components:**
   - `ChatWidget.tsx` - Main container
   - `ChatButton.tsx` - Floating button
   - `ChatWindow.tsx` - Expanded window
   - `MessageBubble.tsx` - Individual messages
   - `ButtonOptions.tsx` - Multi-choice buttons
   - `CrisisAlert.tsx` - Safety banner
   - `TherapistCard.tsx` - Match results

2. **Hooks:**
   - `useChatConversation.ts` - State management
   - `useCrisisDetection.ts` - Keyword monitoring
   - `useTypingIndicator.ts` - Bot typing simulation

3. **API Routes:**
   - `POST /api/chat/start` - Initialize conversation
   - `POST /api/chat/message` - Send message
   - `GET /api/chat/conversation/:id` - Fetch history
   - `POST /api/chat/escalate` - Human handoff

Ready to start building the actual React components?
