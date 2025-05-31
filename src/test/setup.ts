import { vi, beforeEach } from 'vitest'
import { config } from '@vue/test-utils'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null)
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

Object.defineProperty(window, 'location', {
  value: {
    href: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  },
  writable: true,
})

global.fetch = vi.fn()

config.global.mocks = {
  $router: {
    push: vi.fn(),
    replace: vi.fn(),
  },
  $route: {
    params: {},
    query: {},
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
})
