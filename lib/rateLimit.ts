interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

function pruneStore() {
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (now > bucket.resetAt) store.delete(key);
  }
}

export function checkRateLimit(
  ip: string,
  id: string,
  maxRequests: number,
  windowMs = 60_000
): boolean {
  if (store.size > 10_000) pruneStore();
  const key = `${id}:${ip}`;
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= maxRequests) return false;
  bucket.count++;
  return true;
}

export function getClientIp(req: { headers: { get: (name: string) => string | null } }): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}
