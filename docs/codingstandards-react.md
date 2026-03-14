# React / TypeScript Client Coding Standards

Stack: **React 19 · TypeScript 5.9 · Vite 7 · Tailwind CSS 4 · Socket.IO Client · Vitest**

Conventions drawn from the React docs, Vite ecosystem, and production codebases
(e.g. shadcn/ui, cal.com, Bulletproof React).

---

## 1. Project Structure

```
client/src/
├── components/
│   ├── chat/
│   │   └── ChatWindow.tsx
│   └── log/
│       └── LogViewer.tsx
├── hooks/              # Custom hooks
├── lib/                # Non-React utilities, API clients, socket
├── types/              # Shared type definitions
├── App.tsx
├── main.tsx
├── index.css           # Tailwind entry + theme tokens
└── App.css             # App-level overrides (keep minimal)
```

- Group by feature, not by file type.
- Flat within each feature folder until complexity demands sub-folders.

## 2. TypeScript

| Rule | Rationale |
|---|---|
| `strict: true` with `noUnusedLocals`, `noUnusedParameters` | Enforced by tsconfig.app.json already. |
| No `any`. Use `unknown` + type guards or generics. | Same as server — `any` defeats the type system. |
| Prefer `interface` for props and object shapes | Extensible, better error messages. |
| Explicit return types on exported hooks and utilities | Prevents accidental API drift. |

### Naming

| Kind | Convention | Example |
|---|---|---|
| Components | `PascalCase` file and export | `ChatWindow.tsx` |
| Hooks | `camelCase`, prefixed `use` | `useSocket.ts` |
| Utilities | `kebab-case.ts` | `format-date.ts` |
| Types / Interfaces | `PascalCase` | `ChatMessage` |
| Constants | `UPPER_SNAKE_CASE` | `SERVER_URL` |

## 3. React Components

### Functional Components Only

```typescript
interface ChatMessageProps {
  readonly text: string;
  readonly timestamp: Date;
}

export function ChatMessage({ text, timestamp }: ChatMessageProps) {
  return ( ... );
}
```

- Do **not** use `React.FC`. It adds an implicit `children` prop and provides
  no benefit with modern React + JSX transform.
- Do **not** import `React` — the JSX transform handles it automatically.
- Destructure props in the function signature.

### Component Guidelines

| Rule | Detail |
|---|---|
| One component per file | Exception: small, tightly-coupled sub-components. |
| Named exports | `export function Foo()`, not `export default`. Enables refactoring & tree-shaking. |
| Props interface above the component | Named `FooProps`, marked `readonly`. |
| Prefer composition over prop drilling | Use context or hooks when >2 levels deep. |

## 4. Hooks

- Extract shared stateful logic into custom hooks under `hooks/`.
- Every hook file exports exactly one hook.
- Hooks must list all dependencies in `useEffect` / `useCallback` / `useMemo` arrays.
- Clean up subscriptions and event listeners in `useEffect` return functions.

```typescript
export function useSocket<T>(event: string): T[] {
  const [items, setItems] = useState<T[]>([]);

  useEffect(() => {
    const handler = (data: T) => setItems((prev) => [...prev, data]);
    socket.on(event, handler);
    return () => { socket.off(event, handler); };
  }, [event]);

  return items;
}
```

## 5. State Management

- Start with local `useState` / `useReducer`.
- Lift state up before reaching for context.
- Use React Context for truly global, infrequently-changing values
  (theme, auth, socket instance).
- Avoid storing derived values in state — compute them inline or with `useMemo`.

## 6. Error Handling

- Type catch blocks as `unknown`, then narrow:

```typescript
try {
  await fetchLogs();
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : "Unknown error";
  setError(message);
}
```

- Never use `catch (err: any)`.
- Show user-facing error UI for all async operations (loading / error / empty / data states).

## 7. API & Socket Communication

- Centralize the socket instance in `lib/socket.ts`.
- Never duplicate `SERVER_URL` — import from a single `lib/config.ts` or use
  the socket module's connection.
- Type all socket events with `Socket<ServerToClientEvents, ClientToServerEvents>`.
- Handle connection errors and display connection state to the user.

## 8. Styling (Tailwind CSS 4)

- Use Tailwind utility classes as the primary styling approach.
- Define design tokens (colors, spacing) in `index.css` `@theme` block.
- Remove unused CSS (e.g. Vite scaffold leftovers).
- For component-specific overrides, prefer Tailwind `@apply` in a CSS module
  over inline style objects.
- Keep class strings readable — extract long sets into variables or components:

```typescript
const cardClasses = "flex flex-col h-full bg-dark-900 rounded-xl overflow-hidden border border-gray-800 shadow-2xl";
```

## 9. Testing (Vitest)

| Practice | Detail |
|---|---|
| Co-locate tests | `Foo.test.tsx` next to `Foo.tsx`. |
| Use `@testing-library/react` for component tests | Test behavior, not implementation. |
| Mock external dependencies (socket, fetch) | Never hit real servers in tests. |
| Test the 4 UI states | Loading, error, empty, populated. |
| Snapshot tests sparingly | Prefer explicit assertions on visible text/structure. |

## 10. Performance

- Avoid creating new objects/arrays/functions inside render unless memoized.
- Use `useCallback` for event handlers passed as props to child components.
- Virtualize long lists (>100 items) with a library like `@tanstack/virtual`.
- Lazy-load heavy route-level components with `React.lazy` + `Suspense`.

## 11. Imports

- Use absolute imports via path aliases when the project grows (`@/components/...`).
- Order: React/library imports → project imports → relative imports → styles.
- Let ESLint + editor auto-sort. No manual import ordering.

## 12. Code Style

- `const` by default. `let` only when reassignment is needed. Never `var`.
- Prefer early returns.
- Maximum one component per file (with noted exception above).
- Keep component files under ~150 lines. Extract sub-components or hooks when they grow.
- No commented-out code in committed files.
