import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistState {
  ids: string[]
  recentlyViewed: string[]
  toggle: (id: string) => boolean
  has: (id: string) => boolean
  remove: (id: string) => void
  view: (id: string) => void
  clearViewed: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      recentlyViewed: [],

      toggle(id) {
        const has = get().ids.includes(id)
        set({ ids: has ? get().ids.filter((x) => x !== id) : [id, ...get().ids] })
        return !has
      },

      has: (id) => get().ids.includes(id),
      remove: (id) => set({ ids: get().ids.filter((x) => x !== id) }),
      view: (id) => set({ recentlyViewed: [id, ...get().recentlyViewed.filter((x) => x !== id)].slice(0, 8) }),
      clearViewed: () => set({ recentlyViewed: [] }),
    }),
    { name: 'wishlist' },
  ),
)
