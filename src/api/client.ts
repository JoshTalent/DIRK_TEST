import { makeRng } from '@/lib/seed'

const jitter = makeRng(Date.now() & 0xffff)

/** Simulated network round-trip so loading / skeleton states are real. */
export function request<T>(handler: () => T, options: { min?: number; max?: number; errorRate?: number } = {}): Promise<T> {
  const { min = 180, max = 520, errorRate = 0 } = options
  const ms = min + Math.random() * (max - min)
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (errorRate && jitter.next() < errorRate) {
        reject(new Error('Service temporarily unavailable. Please retry.'))
        return
      }
      resolve(handler())
    }, ms)
  })
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}
