import { getDb, mutate } from './db'
import { request, ApiError } from './client'
import type { Address, User } from '@/lib/types'

const AVATAR_COLORS = ['#1f40e0', '#0f766e', '#b91c1c', '#7c3aed', '#c2410c', '#0891b2']

export type PublicUser = Omit<User, 'password'>

function sanitize(user: User): PublicUser {
  const { password: _password, ...rest } = user
  return rest
}

export function login(email: string, password: string): Promise<PublicUser> {
  return request(
    () => {
      const user = getDb().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
      if (!user || user.password !== password) throw new ApiError('That email and password combination does not match.', 401)
      if (user.status === 'suspended') throw new ApiError('This account has been suspended. Contact support.', 403)
      return sanitize(user)
    },
    { min: 420, max: 780 },
  )
}

export function register(input: { name: string; email: string; password: string; phone: string }): Promise<PublicUser> {
  return request(
    () =>
      mutate((db) => {
        const email = input.email.trim().toLowerCase()
        if (db.users.some((u) => u.email === email)) throw new ApiError('An account with that email already exists.', 409)
        const user: User = {
          id: `u-${Date.now()}`,
          name: input.name.trim(),
          email,
          password: input.password,
          role: 'customer',
          phone: input.phone,
          createdAt: new Date().toISOString(),
          status: 'active',
          addresses: [],
          avatarColor: AVATAR_COLORS[db.users.length % AVATAR_COLORS.length],
        }
        db.users.push(user)
        return sanitize(user)
      }),
    { min: 520, max: 900 },
  )
}

export function updateProfile(userId: string, patch: Partial<Pick<User, 'name' | 'email' | 'phone'>>): Promise<PublicUser> {
  return request(
    () =>
      mutate((db) => {
        const user = db.users.find((u) => u.id === userId)
        if (!user) throw new ApiError('Account not found', 404)
        if (patch.email) {
          const email = patch.email.trim().toLowerCase()
          if (db.users.some((u) => u.email === email && u.id !== userId)) throw new ApiError('That email is already in use.', 409)
          user.email = email
        }
        if (patch.name) user.name = patch.name
        if (patch.phone != null) user.phone = patch.phone
        return sanitize(user)
      }),
    { min: 320, max: 640 },
  )
}

export function changePassword(userId: string, current: string, next: string): Promise<true> {
  return request(
    () =>
      mutate((db) => {
        const user = db.users.find((u) => u.id === userId)
        if (!user) throw new ApiError('Account not found', 404)
        if (user.password !== current) throw new ApiError('Your current password is incorrect.', 401)
        user.password = next
        return true as const
      }),
    { min: 420, max: 720 },
  )
}

export function addAddress(userId: string, address: Omit<Address, 'id'>): Promise<PublicUser> {
  return request(
    () =>
      mutate((db) => {
        const user = db.users.find((u) => u.id === userId)
        if (!user) throw new ApiError('Account not found', 404)
        if (address.isDefault) user.addresses.forEach((a) => (a.isDefault = false))
        user.addresses.push({ ...address, id: `a-${Date.now()}` })
        return sanitize(user)
      }),
    { min: 320, max: 600 },
  )
}

export function removeAddress(userId: string, addressId: string): Promise<PublicUser> {
  return request(
    () =>
      mutate((db) => {
        const user = db.users.find((u) => u.id === userId)
        if (!user) throw new ApiError('Account not found', 404)
        user.addresses = user.addresses.filter((a) => a.id !== addressId)
        if (!user.addresses.some((a) => a.isDefault) && user.addresses[0]) user.addresses[0].isDefault = true
        return sanitize(user)
      }),
    { min: 320, max: 600 },
  )
}

export function setDefaultAddress(userId: string, addressId: string): Promise<PublicUser> {
  return request(
    () =>
      mutate((db) => {
        const user = db.users.find((u) => u.id === userId)
        if (!user) throw new ApiError('Account not found', 404)
        user.addresses.forEach((a) => (a.isDefault = a.id === addressId))
        return sanitize(user)
      }),
    { min: 320, max: 600 },
  )
}
