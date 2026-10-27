// PR-C: pembatas percobaan login berbasis jendela waktu tetap (fixed window).
//
// SENGAJA tanpa kunci IP — pegawai bisa login dari mana saja, termasuk jaringan
// seluler (IP berubah & berbagi CGNAT), jadi limit per-IP akan salah sasaran.
// - Login pegawai (PIN-only): limit GLOBAL, karena tanpa identitas akun tidak
//   ada kunci per-akun sebelum login. Satu ember untuk seluruh endpoint.
// - Login admin: limit per username (username sudah dikirim sebelum login).
//
// Hanya kegagalan yang dihitung; login berhasil tidak memakan jatah.
// Counter hidup di memori proses — reset saat container restart (bisa diterima:
// jendela hanya 15 menit, dan aplikasi jalan satu instance container).

export interface LimitCheck {
  limited: boolean;
  retryAfterSeconds: number;
  retryAfterMinutes: number;
}

interface Bucket {
  count: number;
  windowStart: number;
}

function freshBucket(now: number): Bucket {
  return { count: 0, windowStart: now };
}

function resetIfExpired(bucket: Bucket, now: number, windowMs: number): void {
  if (now - bucket.windowStart >= windowMs) {
    bucket.count = 0;
    bucket.windowStart = now;
  }
}

function toCheck(bucket: Bucket, now: number, windowMs: number, limit: number): LimitCheck {
  resetIfExpired(bucket, now, windowMs);
  const retryAfterSeconds = Math.max(0, Math.ceil((bucket.windowStart + windowMs - now) / 1000));
  return {
    limited: bucket.count >= limit,
    retryAfterSeconds,
    retryAfterMinutes: Math.max(1, Math.ceil(retryAfterSeconds / 60)),
  };
}

/** Limiter global: satu ember untuk semua pemanggil (untuk login PIN-only). */
export function createFixedWindowLimiter(limit: number, windowMs: number) {
  const bucket = freshBucket(Date.now());
  return {
    check(): LimitCheck {
      return toCheck(bucket, Date.now(), windowMs, limit);
    },
    recordFailure(): void {
      resetIfExpired(bucket, Date.now(), windowMs);
      bucket.count += 1;
    },
  };
}

/** Limiter per kunci (mis. per username): satu ember per kunci. */
export function createKeyedLimiter(limit: number, windowMs: number) {
  const buckets = new Map<string, Bucket>();
  const MAX_BUCKETS = 1000;

  function pruneExpired(now: number): void {
    if (buckets.size <= MAX_BUCKETS) return;
    for (const [key, bucket] of buckets) {
      if (now - bucket.windowStart >= windowMs) buckets.delete(key);
    }
  }

  function getBucket(key: string, now: number): Bucket {
    pruneExpired(now);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = freshBucket(now);
      buckets.set(key, bucket);
    }
    return bucket;
  }

  return {
    check(key: string): LimitCheck {
      const now = Date.now();
      return toCheck(getBucket(key, now), now, windowMs, limit);
    },
    recordFailure(key: string): void {
      const now = Date.now();
      const bucket = getBucket(key, now);
      resetIfExpired(bucket, now, windowMs);
      bucket.count += 1;
    },
  };
}
