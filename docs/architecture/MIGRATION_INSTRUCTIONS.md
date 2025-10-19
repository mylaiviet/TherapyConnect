# Database Migration Instructions for Chatbot Tables

## Quick Start

Run this command in your terminal:

```bash
npm run db:push
```

## Interactive Prompts

You'll see prompts for each new table. **For ALL prompts, select "create table"** by pressing Enter:

### Prompt 1: chat_conversations
```
Is chat_conversations table created or renamed from another table?
> + chat_conversations           create table  ← Press Enter
  ~ session › chat_conversations rename table
```
**Action:** Press **Enter** (first option is already selected)

---

### Prompt 2: chat_messages
```
Is chat_messages table created or renamed from another table?
> + chat_messages                create table  ← Press Enter
  ~ ... › chat_messages          rename table
```
**Action:** Press **Enter**

---

### Prompt 3: chat_tokens
```
Is chat_tokens table created or renamed from another table?
> + chat_tokens                  create table  ← Press Enter
  ~ ... › chat_tokens            rename table
```
**Action:** Press **Enter**

---

### Prompt 4: chat_preferences
```
Is chat_preferences table created or renamed from another table?
> + chat_preferences             create table  ← Press Enter
  ~ ... › chat_preferences       rename table
```
**Action:** Press **Enter**

---

### Prompt 5: chat_escalations
```
Is chat_escalations table created or renamed from another table?
> + chat_escalations             create table  ← Press Enter
  ~ ... › chat_escalations       rename table
```
**Action:** Press **Enter**

---

### Prompt 6: chat_therapist_matches
```
Is chat_therapist_matches table created or renamed from another table?
> + chat_therapist_matches       create table  ← Press Enter
  ~ ... › chat_therapist_matches rename table
```
**Action:** Press **Enter**

---

### Prompt 7: New Enums

You may also see prompts for new enum types:

```
Is conversation_stage enum created or renamed from another enum?
> + conversation_stage           create enum   ← Press Enter
```

```
Is message_sender enum created or renamed from another enum?
> + message_sender               create enum   ← Press Enter
```

```
Is escalation_type enum created or renamed from another enum?
> + escalation_type              create enum   ← Press Enter
```

**Action:** Press **Enter** for each enum

---

## Expected Success Output

After all prompts, you should see:

```
✔ Applying changes...
✔ Done!

New tables created:
  - chat_conversations
  - chat_messages
  - chat_tokens
  - chat_preferences
  - chat_escalations
  - chat_therapist_matches

New enums created:
  - conversation_stage
  - message_sender
  - escalation_type
```

---

## Verification

After migration, verify tables were created:

```bash
# Connect to your database and check tables
psql $DATABASE_URL -c "\dt chat_*"
```

Expected output:
```
                    List of relations
 Schema |          Name           | Type  |  Owner
--------+-------------------------+-------+---------
 public | chat_conversations      | table | ...
 public | chat_escalations        | table | ...
 public | chat_messages           | table | ...
 public | chat_preferences        | table | ...
 public | chat_therapist_matches  | table | ...
 public | chat_tokens             | table | ...
```

---

## Troubleshooting

### If migration fails:

1. **Check DATABASE_URL** in `.env` file:
   ```bash
   cat .env | grep DATABASE_URL
   ```

2. **Verify database connection**:
   ```bash
   npm run db:push -- --verbose
   ```

3. **Manual SQL approach** (if interactive prompts fail):
   - Generate SQL file: `npx drizzle-kit generate:pg`
   - Apply manually to database

---

## Alternative: Non-Interactive Migration

If interactive prompts are problematic, you can use the `--force` flag (⚠️ use with caution):

```bash
# This will skip prompts and create all new tables
npx drizzle-kit push:pg --force
```

⚠️ **Warning:** Only use `--force` if you're sure there are no table name conflicts.

---

## Next Steps After Successful Migration

1. ✅ Add `ENCRYPTION_KEY` to `.env`
2. ✅ Test encryption service
3. ✅ Continue building state machine service
4. ✅ Create API routes

---

## Need Help?

If you encounter errors during migration, please share:
1. The full error message
2. Your database provider (Supabase, local PostgreSQL, etc.)
3. Output of `npm run db:push --verbose`
