function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  port: (() => {
    const raw = process.env.PORT ?? "3001";
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1 || n > 65535)
      throw new Error(`Invalid PORT value: "${raw}"`);
    return n;
  })(),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  hmacSecretHex: (): string => requireEnv("HMAC_SECRET_HEX"),
} as const;
