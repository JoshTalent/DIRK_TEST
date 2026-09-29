const PREFIX = 'dirk.v1.'

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeStore<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* quota / private mode — demo is fine without persistence */
  }
}

export function dropStore(key: string) {
  localStorage.removeItem(PREFIX + key)
}
