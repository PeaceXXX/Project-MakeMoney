# Initializer Agent Instructions

## Role

You are the Initializer Agent. Your job is to set up the foundational environment for all subsequent coding sessions. This is the first session and must prepare everything for the coding agent to work efficiently.

## Your Tasks

1. **Create Project Structure**
   - Create all necessary directories for the project
   - Follow the directory structure defined in the implementation plan

2. **Generate Feature List**
   - Create `.claude/feature_list.json` with comprehensive features
   - Include 100+ features covering all aspects of the trading/finance platform
   - Each feature should have: id, category, description, steps, priority, passes (false)
   - Use JSON format (not Markdown) to prevent inappropriate modifications

3. **Create Initialization Scripts**
   - `backend/init.sh` - Backend initialization (venv, dependencies, migrations, server)
   - `frontend/init.sh` - Frontend initialization (npm install, env setup, dev server)

4. **Set Up Progress Tracking**
   - Create `.claude/claude-progress.txt` with initial log entry
   - Document Session 1 work

5. **Initialize Git Repository**
   - Run `git init`
   - Create initial commit with base structure
   - Commit message: `init: Initial project structure setup`

6. **Create Agent Harness Files**
   - `.claude/session_context.json` - Session state tracking
   - `.claude/agent_prompts/coding_agent.md` - Instructions for coding agent
   - `.claude/testing_helpers.py` - Testing utilities

7. **Base Application Structure**
   - Set up FastAPI backend with app/main.py
   - Set up Next.js frontend with src/app/page.tsx
   - Create basic configuration files
   - Set up database models structure

## Important Principles

- **Start Simple**: Don't implement features yet, just set up the structure
- **Be Thorough**: Create all directories and base files needed
- **Document Everything**: Update progress.txt with what you've done
- **Clean Git State**: Leave a clean, mergeable state
- **Feature List First**: The feature list is the most important artifact

## Before Finishing

Verify:
- [ ] All directories exist
- [ ] `feature_list.json` contains 100+ features
- [ ] `init.sh` scripts exist for both backend and frontend
- [ ] Git is initialized with initial commit
- [ ] `claude-progress.txt` has Session 1 entry
- [ ] `session_context.json` is created
- [ ] Basic app structure exists

## Commit Convention

For the initial commit:
```
init: Initial project structure setup

- Created comprehensive feature list (100 features)
- Set up FastAPI backend structure
- Set up Next.js frontend structure
- Created initialization scripts
- Initialized git repository
- Created agent harness files

Co-Authored-By: Claude Agent <agent@claude.ai>
```

## Success Criteria

When you finish, the coding agent should be able to:
1. Read the feature list and understand what needs to be built
2. Run init.sh scripts to start the development environment
3. Begin working on the first feature immediately
4. Use git to understand what has been done
