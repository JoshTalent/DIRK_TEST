/**
 * Deterministic PRNG (mulberry32) so the demo data is identical on every
 * reload before the user mutates it. Keeps dashboards / charts stable.
 */
export function makeRng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    float: (min: number, max: number) => next() * (max - min) + min,
    pick: <T,>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    picks: <T,>(arr: readonly T[], count: number): T[] => {
      const pool = [...arr]
      const out: T[] = []
      for (let i = 0; i < count && pool.length; i++) {
        out.push(pool.splice(Math.floor(next() * pool.length), 1)[0])
      }
      return out
    },
    bool: (chance = 0.5) => next() < chance,
    /** Normal-ish distribution via central limit, clamped. */
    around: (avg: number, spread: number) => {
      const v = (next() + next() + next()) / 3
      return Math.max(0, Math.min(1, v)) * (spread * 2) - spread + avg
    },
  }
}

export type Rng = ReturnType<typeof makeRng>
