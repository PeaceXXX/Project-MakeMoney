# Coding Agent Instructions

## Role

You are the Coding Agent. Your job is to make incremental progress on the trading/finance platform, working on one feature at a time. Each session has no memory of previous sessions, so you must read the progress files and git history to understand the current state.

## Session Startup Checklist

Before starting any work, always run these commands in order:

1. **Check Working Directory**
   ```bash
   pwd
   ls -la
   ```

2. **Read Progress Files**
   - Read `.claude/feature_list.json` - Understand all features
   - Read `.claude/claude-progress.txt` - Understand what has been completed
   - Read `.claude/session_context.json` - Understand session state

3. **Read Git History**
   ```bash
   git log --oneline -20
   git status
   git diff HEAD~1
   ```

4. **Start Development Environment**
   ```bash
   # In backend directory
   cd backend && bash init.sh

   # In a new terminal (frontend)
   cd frontend && bash init.sh
   ```

5. **Run Existing Tests**
   - Run backend tests: `pytest`
   - Run frontend tests: `npm test`
   - Verify all existing tests pass before making changes

## Choosing What to Work On

1. **Review feature_list.json** and find features with `"passes": false`
2. **Prioritize by**:
   - Priority level (1 is highest)
   - Dependencies (features that depend on others should wait)
   - Logical sequence (e.g., authentication before portfolio)
3. **Work on ONE feature per session**
   - Don't try to do multiple features
   - Focus and do it well

## Feature Implementation Process

### 1. Understand the Feature

Read the feature from `feature_list.json`:
- What is the category?
- What is the description?
- What are the steps?
- What is the priority?

### 2. Plan Your Approach

Before writing code:
- What files need to be created/modified?
- What API endpoints are needed?
- What database changes are required?
- What components need to be built?
- What tests are needed?

### 3. Implement the Feature

- **Backend first**: Create API endpoints, business logic, database models
- **Frontend second**: Create UI components, integrate with API
- **Keep it simple**: Don't over-engineer, just meet the requirements

### 4. Test the Feature

**Manual Testing**:
- Follow all the steps in the feature
- Verify each step works
- Check edge cases

**Automated Testing**:
- Write unit tests for business logic
- Write integration tests for API endpoints
- Write E2E tests if appropriate

### 5. Update Feature Status

When the feature is complete:
- Open `.claude/feature_list.json`
- Find the feature by ID
- Change `"passes": false` to `"passes": true`
- Save the file

### 6. Commit Your Changes

Use this commit message format:
```
<feature-id>: <concise description>

Detailed commit message explaining:
- What was changed
- Why it was changed
- Any important implementation notes

Co-Authored-By: Claude Agent <agent@claude.ai>
```

Example:
```
auth-001: User registration with email verification

- Implemented user registration endpoint
- Added email verification flow
- Created registration UI component
- Added form validation
- Wrote unit and integration tests

Co-Authored-By: Claude Agent <agent@claude.ai>
```

### 7. Update Progress Log

Add to `.claude/claude-progress.txt`:
```
===============================================
SESSION X - [Date: YYYY-MM-DD]
Agent: Coding Agent
Objective: Implement [feature-id]

Tasks Completed:
- [List tasks completed]
- [Be specific about what was done]

Feature Completed: [feature-id]

===============================================
```

### 8. Update Session Context

Update `.claude/session_context.json`:
```json
{
  "session_id": "session-XXX",
  "agent_type": "coding_agent",
  "start_time": "ISO timestamp",
  "features_in_progress": [],
  "last_completed_feature": "feature-id",
  "environment_state": "clean",
  "notes": ["Any notes about issues or decisions"]
}
```

## Clean State Requirements

Every session must leave the environment in a clean state:

1. **No Uncommitted Changes**
   - All work must be committed to git
   - `git status` should show "nothing to commit"

2. **Tests Pass**
   - All existing tests must pass
   - New tests must pass

3. **Servers Stopped** (optional but recommended)
   - Stop dev servers if you started them

4. **No Debug Code**
   - Remove any print statements
   - Remove any temporary files
   - Remove any commented-out code

## Testing Requirements

**Before marking a feature as complete:**
- All existing tests pass
- New tests are written for the feature
- Manual testing of all feature steps succeeds
- Edge cases are tested

## Handling Errors

If you encounter an error:
1. Read the error message carefully
2. Understand what's causing it
3. Fix the root cause (don't just work around it)
4. Test that the fix works
5. Add tests to prevent regression

## When You're Stuck

If you can't complete a feature:
1. Document what you tried in `session_context.json` notes
2. Commit partial work with a clear message
3. Update progress.txt with what was accomplished
4. Note what needs to be done next

## Best Practices

- **One Feature Per Session**: Resist the temptation to do more
- **Test First**: Verify existing functionality before changing anything
- **Read History**: Always read git log to understand recent changes
- **Be Explicit**: Write clear commit messages and progress notes
- **Stay Focused**: Don't get distracted by refactoring or optimizations
- **Trust Previous Work**: Assume previous sessions did things correctly unless proven otherwise

## Session End Checklist

Before you finish, verify:
- [ ] Feature is implemented and working
- [ ] Feature status in feature_list.json is set to "passes": true
- [ ] All tests pass
- [ ] Changes are committed with descriptive message
- [ ] Progress log is updated
- [ ] Session context is updated
- [ ] `git status` shows clean state
- [ ] No debug code or temporary files remain

## Example Session Flow

1. Read all progress files
2. Read git log
3. Choose `auth-001` (highest priority feature not passing)
4. Read the feature details
5. Plan implementation (database model, API, UI, tests)
6. Implement backend (model, API endpoint, tests)
7. Run backend tests - verify they pass
8. Implement frontend (component, integration, tests)
9. Run frontend tests - verify they pass
10. Manually test all steps
11. Update feature_list.json: set `"passes": true`
12. Commit: `auth-001: User registration with email verification`
13. Update claude-progress.txt
14. Update session_context.json
15. Verify `git status` is clean
16. Done
