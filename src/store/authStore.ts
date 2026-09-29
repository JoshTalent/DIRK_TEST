import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as authApi from '@/api/auth'
import type { PublicUser } from '@/api/auth'
import { getDb } from '@/api/db'

interface AuthState {
  user: PublicUser | null
  pending: boolean
  error: string | null
  login: (email: string, password: string) => Promise<PublicUser>
  register: (input: { name: string; email: string; password: string; phone: string }) => Promise<PublicUser>
  logout: () => void
  refresh: () => void
  setUser: (user: PublicUser) => void
  patchUser: (user: PublicUser) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      pending: false,
      error: null,

      async login(email, password) {
        set({ pending: true, error: null })
        try {
          const user = await authApi.login(email, password)
          set({ user, pending: false })
          return user
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Sign in failed.'
          set({ pending: false, error: message })
          throw err
        }
      },

      async register(input) {
        set({ pending: true, error: null })
        try {
          const user = await authApi.register(input)
          set({ user, pending: false })
          return user
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Could not create the account.'
          set({ pending: false, error: message })
          throw err
        }
      },

      logout() {
        set({ user: null, error: null })
      },

      /** Re-reads the signed-in user from the "server" so edits stay in sync. */
      refresh() {
        const current = get().user
        if (!current) return
        const found = getDb().users.find((u) => u.id === current.id)
        if (found) {
          const { password: _password, ...rest } = found
          set({ user: rest })
        }
      },

      setUser(user) {
        set({ user })
      },

      patchUser(user) {
        set({ user })
      },
    }),
    { name: 'auth', partialize: (s) => ({ user: s.user }) },
  ),
)
