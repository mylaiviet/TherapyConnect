# Chatbot Therapist Matching - End-to-End Test

## Test Plan
Simulate a complete chatbot conversation that reaches the matching stage and returns real therapist recommendations.

## Test Steps

### 1. Start Conversation
```bash
curl -s -X POST http://localhost:5000/api/chat/start \
  -H "Content-Type: application/json" \
  -c cookies.txt
```

Expected: Welcome message with disclaimer

### 2. Begin Conversation (Welcome → Demographics)
```bash
curl -s -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"conversationId":"REPLACE_WITH_ID","content":"Yes, lets begin"}'
```

Expected: Bot asks for location (ZIP code)

### 3. Provide Location (Demographics → Preferences)
```bash
curl -s -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"conversationId":"REPLACE_WITH_ID","content":"55401"}'
```

Expected: Bot asks about session format (in-person, virtual, either)

### 4. Choose Session Format (Preferences → Goals)
```bash
curl -s -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"conversationId":"REPLACE_WITH_ID","content":"virtual"}'
```

Expected: Bot asks about treatment goals

### 5. Describe Treatment Goals (Goals → Insurance)
```bash
curl -s -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"conversationId":"REPLACE_WITH_ID","content":"I want to work on anxiety and stress management"}'
```

Expected: Bot asks about payment method (insurance vs out-of-pocket)

### 6. Choose Payment Method (Insurance → Matching)
```bash
curl -s -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"conversationId":"REPLACE_WITH_ID","content":"out-of-pocket"}'
```

Expected: Bot says "Searching for therapists..." and advances to matching stage

### 7. Request Therapist Matches (Matching Stage)
```bash
curl -s -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"conversationId":"REPLACE_WITH_ID","content":"Yes, show me the therapists"}'
```

Expected: Bot returns top 3-5 therapist matches with:
- Name and credentials
- Location
- Match score (0-100%)
- Match reasons
- Profile links

## Success Criteria
- ✅ Conversation flows through all 6 stages
- ✅ User preferences are saved to database
- ✅ Therapist matching algorithm runs successfully
- ✅ Real therapists are returned (not mock data)
- ✅ Match scores are calculated correctly
- ✅ Profile links work
