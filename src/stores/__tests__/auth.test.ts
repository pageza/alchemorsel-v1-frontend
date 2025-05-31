import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import { authService } from '../../services/api'

vi.mock('../../services/api', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
  }
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should initialize with correct authentication state', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
  })

  it('should initialize as authenticated when token exists', () => {
    localStorage.setItem('auth_token', 'existing-token')
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(true)
  })

  it('should login successfully', async () => {
    const mockResponse = { token: 'test-token', user: { id: '1', name: 'Test', email: 'test@example.com' } }
    vi.mocked(authService.login).mockResolvedValue(mockResponse)
    
    const store = useAuthStore()
    const result = await store.login({ email: 'test@example.com', password: 'password' })
    
    expect(authService.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' })
    expect(localStorage.getItem('auth_token')).toBe('test-token')
    expect(store.isAuthenticated).toBe(true)
    expect(result).toEqual(mockResponse)
  })

  it('should register successfully', async () => {
    const mockResponse = { token: 'test-token', user: { id: '1', name: 'Test', email: 'test@example.com' } }
    vi.mocked(authService.register).mockResolvedValue(mockResponse)
    
    const store = useAuthStore()
    const result = await store.register({ name: 'Test', email: 'test@example.com', password: 'password' })
    
    expect(authService.register).toHaveBeenCalledWith({ name: 'Test', email: 'test@example.com', password: 'password' })
    expect(localStorage.getItem('auth_token')).toBe('test-token')
    expect(store.isAuthenticated).toBe(true)
    expect(result).toEqual(mockResponse)
  })

  it('should logout successfully', () => {
    localStorage.setItem('auth_token', 'test-token')
    const store = useAuthStore()
    store.isAuthenticated = true
    
    delete (window as any).location
    window.location = { href: '' } as any
    
    store.logout()
    
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(window.location.href).toBe('/login')
  })

  it('should check auth correctly', () => {
    const store = useAuthStore()
    
    expect(store.checkAuth()).toBe(false)
    expect(store.isAuthenticated).toBe(false)
    
    localStorage.setItem('auth_token', 'test-token')
    expect(store.checkAuth()).toBe(true)
    expect(store.isAuthenticated).toBe(true)
  })

  it('should handle login error', async () => {
    const mockError = new Error('Invalid credentials')
    vi.mocked(authService.login).mockRejectedValue(mockError)
    
    const store = useAuthStore()
    
    await expect(store.login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow('Invalid credentials')
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('should handle register error', async () => {
    const mockError = new Error('Email already exists')
    vi.mocked(authService.register).mockRejectedValue(mockError)
    
    const store = useAuthStore()
    
    await expect(store.register({ name: 'Test', email: 'test@example.com', password: 'password' })).rejects.toThrow('Email already exists')
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })
})
