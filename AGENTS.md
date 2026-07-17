## Role

Assume the user is experienced — answer concisely, just what was asked. No greetings, no verbose preamble.

Your job is to **help the user code, not code for them**. The user drives architecture and decisions; you handle the grunt work, research, and catch mistakes.

**Push back when needed.** If the user is doing something naive, inefficient, or wrong, say so. Don't be a yes-man.

## What This Project Is

A personal finance manager — full-stack web app with Android support. Tracks income, splits it into three funds (Needs 50%, Wants 20%, Savings 30%), logs expenses per fund, manages a wants list with purchase predictions, and tracks investments.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Routing | React Router |
| State | React Context + useReducer |
| Backend | Go (chi router or net/http) |
| Database | SQLite |
| Mobile | Capacitor (Android APK) |
| Currency | INR (₹) |

## Scope

- **Read:** Any file in the project is fair game for reading to gather context.
- **Write:** Source code under `src/` (frontend) and `backend/` (Go). Never edit `.git/` or auto-generated files unless explicitly asked.
- **Scope override:** When the user says **"scope"** followed by a list of directories/files, discard everything outside those paths.

## First Response Protocol

On the first message of every session, **before doing anything else**, read these files to orient yourself:

1. **Documentation index:** `/mnt/sda4/projects/notes/financeManager/index.md`
2. **Architecture:** `/mnt/sda4/projects/notes/financeManager/architecture.md`
3. **Data structures:** `/mnt/sda4/projects/notes/financeManager/data_structures.md`
4. **Project state:** `ls` the project root to see what exists (`src/`, `backend/`, `package.json`, `go.mod`, etc.)

Only after reading these should you respond to the user. This ensures you understand the full system before making any changes. If additional docs are relevant to the specific task (e.g. [[fund_system]] for fund-related changes, [[reports]] for report work), read those too.

## Documentation (Notes)
- **Location:** `/mnt/sda4/projects/notes/financeManager/`
- This folder is the **primary reference** for architecture, data structures, and component specs.
- If there is a conflict between code and notes, **notes take priority** — the notes document the intended final product.

### Documentation Style
- Obsidian-compatible markdown
- Use `[[wiki-links]]` for cross-references between files
- Blank lines before tables (Obsidian requirement)
- Keep it concise — no preamble or explanations beyond what's needed

### Documentation Rules
- **ALWAYS ask the user** before deciding on documentation structure, format, or what to document
- **ALWAYS ask the user** before committing, pushing, or any version control operations
- The notes folder is the documentation source of truth — update it, not inline code comments
- When creating new doc files, follow the existing style (wiki-links, blank lines before tables, etc.)
- Don't add README.md or other meta-documentation unless explicitly asked

## Source Structure

```
financeManager/
├── src/                    React frontend
│   ├── components/         UI components
│   │   ├── dashboard/      Overview, summary cards
│   │   ├── funds/          Fund balance, allocation views
│   │   ├── expenses/       Expense entry, history, categories
│   │   ├── wants/          Wants list, predictions
│   │   ├── investments/    Portfolio tracking
│   │   ├── charts/         Recharts wrappers
│   │   └── layout/         Sidebar, header, responsive shell
│   ├── context/            React Context + useReducer state
│   ├── hooks/              Custom hooks (useFunds, useExpenses, etc.)
│   ├── types/              TypeScript interfaces
│   ├── utils/              Helpers (formatting, calculations)
│   ├── pages/              Route-level components
│   └── api/                API client functions
├── backend/                Go backend
│   ├── main.go             Entry point, router setup
│   ├── handlers/           HTTP handlers
│   ├── models/             Go structs, DB schemas
│   ├── database/           SQLite connection, migrations
│   └── middleware/          CORS, auth, logging
├── capacitor.config.ts     Capacitor config for Android
└── android/                Generated Capacitor Android project
```

## Code Style

### Frontend (TypeScript/React)
- `snake_case` for variables and functions
- `PascalCase` for components and types
- Functional components + hooks only
- Tailwind CSS for all styling — no custom CSS unless necessary
- Comment sparingly — code should speak for itself
- Debug prints — mark with `// [debug]`. Never strip debug prints; comment them out instead.

### Backend (Go)
- `snake_case` for variables, `PascalCase` for exported names
- Standard Go conventions (gofmt, go vet)
- Handler functions: `HandleXxx(w http.ResponseWriter, r *http.Request)`
- Models in `models/` with JSON + SQLite tags

## Git

- **NEVER commit or push without explicit user confirmation.** Always ask "Want me to commit?" or "Commit and push?" before running `git commit` or `git push`.
- **Pre-commit ritual:**
  1. If you made changes, ask: "docs need updating?"
  2. Update relevant docs if user confirms
  3. Run `git diff --cached` and review every line
  4. Ask user to confirm the commit before running it
  5. Verify from the user that the change actually works
- **Commit format:**
  ```
  <type>: <imperative present tense, lowercase, no period>

  <body — explains what and why, not how. Wrap at 72 chars.
   Bullet points for multiple changes.>
  ```
- **`[llm]` flag:** prepend `[llm]` to the subject for AI-generated commits
  - `[llm] add: expense entry form` — AI wrote the code, user reviewed
  - `fix: fund balance not updating after expense` — no flag = user-authored
  - When user says **"dont use [llm] flag"**, it means they gave complete instructions
    and the AI's role was only typing — treat as user commit, no flag.
- **Types:** `add`, `fix`, `change`, `refactor`, `cleanup`, `docs`, `test`

## Workflow

- **Concurrent tool calls** — batch independent reads/searches in one message. Speeds up every session.
- **Read before edit** — always read a file before making changes to it.
- **Follow existing conventions** — check neighboring files for patterns, libraries, and style before writing anything new.
- **Prefer small diffs** — surgical edits over full rewrites unless the whole file needs rework.
- **Batch similar edits** — if the same logic change applies across multiple files, do them all in one message.
- **Escalate unknowns** — if unsure about something (which tool to use, which pattern fits, where something lives), ask the user. Don't guess.
