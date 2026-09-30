/** Where the gate may send someone after sign-in; never an arbitrary URL. */
export function safeNext(value: unknown): string | null {
  return typeof value === "string" &&
    /^(projekte|blog(\/[a-z0-9-]+)?)$/.test(value)
    ? value
    : null;
}
