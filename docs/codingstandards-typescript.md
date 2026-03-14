# TypeScript / Node.js Coding Standards

Stack: **TypeScript 5.9 · Node.js · Express 5 · Socket.IO 4 · Vitest**

These conventions draw from the Node.js, Express, and Socket.IO official style guides,
as well as patterns used in production codebases (e.g. fastify, tRPC, cal.com).

---

## 1. Project Structure

```
server/
├── src/
│   ├── index.ts          # Entry point — bootstrap only
│   ├── app.ts            # Express app factory (no listen)
│   ├── config.ts         # Validated env / constants
│   ├── routes/           # Express route modules
│   ├── services/         # Business logic
│   ├── lib/              # Pure utilities & crypto
│   └── __tests__/        # Co-located or grouped tests
├── dist/                 # tsc output — never committed
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

- Keep `app.ts` separate from `index.ts` so the HTTP app can be imported without
  starting a listener (critical for testing with supertest).
- Never import from `dist/`. All internal imports use `./module.js` extensions
  (required by `"module": "nodenext"`).

## 2. TypeScript

| Rule | Rationale |
|---|---|
| `strict: true` with `noUncheckedIndexedAccess` | Catch nulls at compile time, not runtime. |
| Prefer `interface` for object shapes, `type` for unions/intersections | Mirrors TS handbook recommendation; interfaces are extensible. |
| No `any`. Use `unknown` + narrowing or generics. | `any` disables the type system. |
| Explicit return types on exported functions | Prevents accidental public API changes. |
| Use `readonly` on properties that should not be reassigned | Communicates intent, caught at compile time. |

### Naming

| Kind | Convention | Example |
|---|---|---|
| Files | `kebab-case.ts` | `crypto-engine.ts` |
| Classes | `PascalCase` | `SecurityManager` |
| Interfaces / Types | `PascalCase` | `SocketEventMap` |
| Functions, variables | `camelCase` | `generatePadBlock` |
| Constants (true constants) | `UPPER_SNAKE_CASE` | `COUNTER_HEADER_BYTES` |
| Enum members | `PascalCase` | `Direction.North` |

## 3. Error Handling

- **Never swallow errors silently.** Every `catch` must log or re-throw.
- Use typed error classes for domain errors:

```typescript
export class ReplayAttackError extends Error {
  constructor(received: number, lastUsed: number) {
    super(`Replay: counter ${received} <= last used ${lastUsed}`);
    this.name = "ReplayAttackError";
  }
}
```

- Express error middleware goes last and returns structured JSON:

```typescript
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err);
  res.status(500).json({ success: false, error: err.message });
});
```

## 4. Configuration & Secrets

- All runtime config comes from environment variables.
- Validate and parse at startup in a single `config.ts` module.
- **Never** hardcode secrets, ports, or URLs in source.
- Use a `.env.example` file to document required variables (committed).
  Actual `.env` files are gitignored.

```typescript
// config.ts
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  hmacSecretHex: requireEnv("HMAC_SECRET_HEX"),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
} as const;
```

## 5. Express & Socket.IO Patterns

### App Factory

```typescript
// app.ts — returns the configured express app, no side effects
export function createApp(): express.Express { ... }
```

### Typed Socket Events

Define an event map and pass it to `Server<>` / `Socket<>` generics:

```typescript
interface ServerToClientEvents {
  chat_message: (msg: string) => void;
  share_data: (payload: string) => void;
}

interface ClientToServerEvents {
  chat_message: (msg: string) => void;
  share_data: (payload: string) => void;
}

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server);
```

### Route Handlers

- One file per resource or logical group.
- Always call `next(err)` in async routes or use an async wrapper.

## 6. Logging

- Use a central logger module for all output. Never use bare `console.log`
  in production code (test helpers are fine).
- Use `fs/promises` (async/await) instead of callback-based `fs`.

## 7. Testing (Vitest)

| Practice | Detail |
|---|---|
| Co-locate tests | `foo.test.ts` next to `foo.ts`, or in `__tests__/`. |
| Descriptive names | `it("rejects replayed packet with duplicate counter")` |
| Isolate side effects | Mock `fs`, network, timers. Never hit real I/O in unit tests. |
| Prefer `toThrow` / `rejects.toThrow` | For error path coverage. |
| No test-only exports | If you need to test an internal, extract it to its own module. |
| Run with `vitest run` in CI, `vitest` in watch mode locally. | |

## 8. Async / Promises

- Prefer `async` / `await` over `.then()` chains.
- Never mix callbacks and promises in the same function.
- Use `fs/promises` for all file I/O.

## 9. Security

- Validate and sanitize all external input (query params, socket payloads).
- Never log secrets or raw key material.
- Use `crypto.subtle` (Web Crypto API) for all cryptographic operations — no
  deprecated `createCipher` / `createDecipher`.
- Enforce replay protection on encrypted streams (monotonic counters).

## 10. Code Style

- Use `const` by default. Use `let` only when reassignment is required. Never `var`.
- Prefer early returns over deeply nested conditionals.
- Maximum one class per file.
- Keep files under ~200 lines. Extract when they grow.
- No commented-out code in committed files.
