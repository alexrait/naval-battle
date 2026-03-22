# Agent Guidelines for Naval Battle (Iron & Tide)

## Project Overview
A real-time multiplayer naval battle game built with React 19, Vite, Tailwind CSS 4, Netlify Functions, and Neon (Postgres). Uses Netlify Identity for authentication and Pusher for real-time events.

---

## 1. Build / Lint / Dev Commands

```bash
# Install dependencies
npm install

# Start development server (includes Netlify Functions)
netlify dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint (ESLint with React rules)
npm run lint
```

### Netlify CLI Commands
```bash
# Invoke a function locally for testing
netlify functions:invoke <function-name> --payload '{...}'

# List functions
netlify functions:list

# Run scripts with injected Netlify env vars
netlify dev:exec node script.js

# Stream function logs
netlify logs:function <function-name>
```

### Deploy
```bash
# Automatic deploy on push to main via Netlify Git integration
# Manual deploys are done through the Netlify dashboard
```

---

## 2. Code Style Guidelines

### General Principles
- **Minimal comments**: Do NOT add comments unless explicitly requested by the user.
- **Concise output**: When answering questions, be brief and direct.
- **No emojis**: Avoid emojis in code or UI unless the user specifically requests them.

### React / JSX

**Imports** (in this order, with a blank line between groups):
1. React core (`import React from "react"`)
2. External libraries (e.g., `netlify-identity-widget`, `pusher-js`, `lucide-react`)
3. Internal hooks (`useAuth`, `useRealtime`)
4. Internal components (`GameBoard`, `Grid`)
5. Internal utils / libs (`cn`, `soundUtils`, `constants`)
6. Context (`LanguageContext`)
7. CSS (`./index.css`)

**Component Structure**:
```jsx
// hooks first, then state, then effects, then handlers, then render
export const GameBoard = ({ initialShips, gameId, user }) => {
  const { t, lang } = useLanguage();
  const [playerShips] = useState(initialShips || []);
  // ... useEffect hooks here
  // ... handler functions here

  return (
    <div>...</div>
  );
};
```

**Naming**:
- Components: `PascalCase` (e.g., `GameBoard`, `ShipPlacement`)
- Hooks: `camelCase` starting with `use` (e.g., `useAuth`, `useRealtime`)
- Utilities: `camelCase` (e.g., `normalizeEmail`, `playFire`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `TOTAL_SHIP_CELLS`)
- CSS classes: Tailwind utility classes (kebab-case in HTML attributes)

### Netlify Functions (Node.js / ESM)

**Key conventions**:
- Use `import { neon } from "@netlify/neon"` for database access.
- Always pass the connection string explicitly: `const sql = neon(process.env.NETLIFY_DATABASE_URL)`.
- Always check for `NETLIFY_DATABASE_URL` and throw a clear error if missing.
- Return a consistent response shape: `{ statusCode: 200/400/500, headers: {...}, body: JSON.stringify(...) }`.
- Wrap database operations in try/catch blocks.
- Always log inputs at the start of a function: `console.log("FUNCTION-NAME: Action description", { var })`.

### Database Schema (Neon/Postgres)

```sql
-- Schema: navalbattle
CREATE TABLE navalbattle.users (
  id TEXT PRIMARY KEY,        -- Netlify Identity user ID
  email TEXT UNIQUE,          -- Full normalized email (user@domain.com)
  name TEXT,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE navalbattle.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id TEXT NOT NULL,
  player2_id TEXT,
  player1_ships JSONB,
  player2_ships JSONB,
  player1_moves JSONB DEFAULT '[]',
  player2_moves JSONB DEFAULT '[]',
  turn TEXT DEFAULT 'player1',
  status TEXT DEFAULT 'waiting',  -- waiting, pending, playing, finished
  winner TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Email Normalization

The codebase uses **Gmail-compatible email normalization**:
- Dots (`.`) in the local part of Gmail addresses are ignored.
- Plus-addressing (`+tag`) is ignored.
- Example: `emilia.raitskin+battle@gmail.com` normalizes to `emiliaraitskin@gmail.com`.
- Non-Gmail addresses are kept as-is.
- All emails are stored as **full addresses** (e.g., `user@gmail.com`), not just usernames.

### Error Handling

**Frontend (React)**:
```jsx
try {
  const response = await fetch("/.netlify/functions/...");
  if (!response.ok) {
    const errorText = await response.text();
    console.warn(`Action failed (${response.status}):`, errorText);
    return;
  }
  const data = await response.json();
} catch (err) {
  console.error("Fetch failed", err);
}
```

**Backend (Netlify Functions)**:
```javascript
export const handler = async (event) => {
  try {
    // ...
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Success" }),
    };
  } catch (error) {
    console.error("FUNCTION_NAME: Error description", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

### Internationalization (i18n)

- Uses a custom `LanguageContext` with a `t()` function for translations.
- Supported languages: `en` (English) and `he` (Hebrew).
- Translations are defined in `src/context/LanguageContext.jsx`.
- Hebrew text uses `dir="rtl"` for right-to-left layout.
- All user-facing strings must use `t("key")`, never hardcoded strings.

### Real-time Events (Pusher)

- **User channel**: `user-{userId}` — for invites and invite responses.
- **Game channel**: `game-{gameId}` — for fire events and fire results.
- Always include `senderId` in event payloads to prevent clients from processing their own events.

### CSS / Tailwind

- Uses **Tailwind CSS v4** with `@tailwindcss/vite` plugin.
- Custom classes are defined in `src/index.css`.
- Component-scoped styles use Tailwind utility classes.
- No CSS modules or styled-components.

### File Locations

| Purpose | Location |
|---|---|
| React Components | `src/components/` |
| React Hooks | `src/hooks/` |
| Context | `src/context/` |
| Utils / Constants | `src/lib/` |
| Netlify Functions | `functions/` |
| Translations | `src/context/LanguageContext.jsx` |
| Styles | `src/index.css` |
| App Entry | `src/App.jsx` |

---

## 3. Common Patterns

### Syncing a user on login
User sync happens via `useEffect` in `App.jsx` watching `user?.id`. The `sync-user` function upserts the user into the database.

### Sending an invite
`App.jsx` calls `POST /.netlify/functions/send-invite` with `{ targetEmail, senderId, senderName }`. The server looks up the target user and creates a pending game, then triggers a Pusher event on `user-{targetId}`.

### Firing a shot
`GameBoard.jsx` calls `POST /.netlify/functions/fire` and `POST /.netlify/functions/report-result`. Both trigger Pusher events on `game-{gameId}`.

### Checking game state
The codebase currently relies on browser memory for game state. The database columns for moves (`player1_moves`, `player2_moves`) exist but are not yet populated by the backend functions.
