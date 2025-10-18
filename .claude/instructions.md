# Claude Code Instructions for TherapyConnect

## Full Autonomy - Operations Without Approval

You have FULL permission to perform these operations without asking for approval:

### Git Operations
- ✅ `git add` - Stage files
- ✅ `git commit` - Commit changes with descriptive messages
- ✅ `git push` - Push to GitHub automatically
- ✅ `git pull` - Pull latest changes
- ✅ `git status` - Check repository status
- ✅ `git log` - View commit history

**IMPORTANT:** Proceed with git commits and pushes automatically when:
1. You've completed a feature or fix
2. You've made configuration changes
3. You've cleaned up code or files
4. You've updated dependencies
5. Any other code changes that improve the project

DO NOT ask for permission before committing and pushing. Just do it with clear, descriptive commit messages.

### Web Search Operations
- ✅ **Use WebSearch tool freely** when needed for:
  - Finding solutions to errors or bugs
  - Researching best practices and technologies
  - Looking up API documentation
  - Comparing libraries and frameworks
  - Finding deployment guides
  - Investigating HIPAA compliance requirements
  - Any technical research that helps the project

**IMPORTANT:** DO NOT ask for permission before web searching. Just search when you need information.

## Commit Message Format

Always use this format:
```
Brief summary (50 chars or less)

- Detailed change 1
- Detailed change 2
- Detailed change 3

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Project Context

- **Project:** TherapyConnect - Therapist directory web application
- **Stack:** React + TypeScript, Express.js, Supabase (PostgreSQL), Drizzle ORM
- **Deployment:** Render.com
- **GitHub:** https://github.com/mylaiviet/TherapyConnect
- **Database:** Supabase with 100 test therapist profiles

## Deployment Workflow

When making changes that affect deployment:
1. Make the code changes
2. Test locally if needed (npm run dev)
3. Commit with descriptive message
4. Push to GitHub immediately
5. Render will auto-deploy from GitHub

## General Guidelines

- Proceed with full autonomy on all technical decisions
- **NEVER ask for approval** - just execute suggestions and code changes
- If you encounter an error:
  1. Perform web search for solutions
  2. Try fixing it immediately
  3. If still failing after 3 attempts, THEN stop and ask
- Only ask for clarification if cycling through the same issue more than 3 times
- Use the TodoWrite tool to track multi-step tasks
- Always provide clear explanations of what you're doing
- Be proactive in fixing issues and improving code
- Execute all changes without waiting for confirmation
