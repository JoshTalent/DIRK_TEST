import { buildDatabase } from '@/data/seed-data'
import type { Database } from '@/data/seed-data'
import { readStore, writeStore, dropStore } from '@/lib/storage'

const KEY = 'db'

let cache: Database | null = null

/** Lazily seeds the "server" database on first run, then persists it. */
export function getDb(): Database {
  if (cache) return cache
  const stored = readStore<Database | null>(KEY, null)
  if (stored?.products?.length) {
    cache = stored
    return cache
  }
  cache = buildDatabase()
  writeStore(KEY, cache)
  return cache
}

export function setDb(next: Database) {
  cache = next
  writeStore(KEY, next)
}

export function mutate<T>(fn: (db: Database) => T): T {
  const db = getDb()
  const result = fn(db)
  setDb(db)
  return result
}

export function resetDb() {
  cache = null
  dropStore(KEY)
  return getDb()
}
