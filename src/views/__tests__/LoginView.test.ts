import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import LoginView from '../LoginView.vue'
import { useAuthStore } from '../../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/login', component: LoginView },
    { path: '/recipes', component: { template: '<div>Recipes</div>' } },
    { path: '/register', component: { template: '<div>Register</div>' } }
  ]
})

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should render login form', () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('h1').text()).toBe('Sign In')
    expect(wrapper.find('input#email').exists()).toBe(true)
    expect(wrapper.find('input#password').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toBe('Sign In')
    expect(wrapper.find('router-link[to="/register"]').exists()).toBe(true)
  })

  it('should handle successful login', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router]
      }
    })

    const authStore = useAuthStore()
    authStore.login = vi.fn().mockResolvedValue({ token: 'test-token' })
    
    const pushSpy = vi.spyOn(router, 'push')

    await wrapper.find('input#email').setValue('test@example.com')
    await wrapper.find('input#password').setValue('password')
    await wrapper.find('form').trigger('submit.prevent')

    expect(authStore.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    })
    expect(pushSpy).toHaveBeenCalledWith('/recipes')
  })

  it('should display error message on login failure', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router]
      }
    })

    const authStore = useAuthStore()
    const mockError = { response: { data: { message: 'Invalid credentials' } } }
    authStore.login = vi.fn().mockRejectedValue(mockError)

    await wrapper.find('input#email').setValue('test@example.com')
    await wrapper.find('input#password').setValue('wrong-password')
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.alert-danger').text()).toBe('Invalid credentials')
  })

  it('should display generic error message when no specific message', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router]
      }
    })

    const authStore = useAuthStore()
    authStore.login = vi.fn().mockRejectedValue(new Error('Network error'))

    await wrapper.find('input#email').setValue('test@example.com')
    await wrapper.find('input#password').setValue('wrong-password')
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.alert-danger').text()).toBe('Failed to sign in. Please try again.')
  })

  it('should disable form during loading', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router]
      }
    })

    const authStore = useAuthStore()
    let resolveLogin: (value: any) => void
    const loginPromise = new Promise(resolve => {
      resolveLogin = resolve
    })
    authStore.login = vi.fn().mockReturnValue(loginPromise)

    await wrapper.find('input#email').setValue('test@example.com')
    await wrapper.find('input#password').setValue('password')
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()

    expect(wrapper.find('button[type="submit"]').text()).toBe('Signing in...')
    expect(wrapper.find('input#email').attributes('disabled')).toBeDefined()
    expect(wrapper.find('input#password').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()

    resolveLogin!({ token: 'test-token' })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button[type="submit"]').text()).toBe('Signing in...')
  })

  it('should clear error when starting new login attempt', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router]
      }
    })

    const authStore = useAuthStore()
    authStore.login = vi.fn().mockRejectedValue(new Error('First error'))

    await wrapper.find('input#email').setValue('test@example.com')
    await wrapper.find('input#password').setValue('wrong-password')
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()
    expect(wrapper.find('.alert-danger').exists()).toBe(true)

    authStore.login = vi.fn().mockResolvedValue({ token: 'test-token' })
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()
    expect(wrapper.find('.alert-danger').exists()).toBe(false)
  })

  it('should have required attributes on form inputs', () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('input#email').attributes('required')).toBeDefined()
    expect(wrapper.find('input#password').attributes('required')).toBeDefined()
  })
})
