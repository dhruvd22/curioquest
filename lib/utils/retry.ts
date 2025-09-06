export async function retry<T>(fn: () => Promise<T>, opts: { retries?: number; baseMs?: number } = {}): Promise<T> {
  const { retries = 3, baseMs = 100 } = opts;
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > retries) throw err;
      const delay = baseMs * 2 ** (attempt - 1);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}
