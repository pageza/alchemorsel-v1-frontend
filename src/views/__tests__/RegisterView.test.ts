import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import RegisterView from '../RegisterView.vue'
import { useAuthStore } from '../../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/register', component: RegisterView },
    { path: '/recipes', component: { template: '<div>Recipes</div>' } },
    { path: '/login', component: { template: '<div>Login</div>' } }
  ]
})

describe('RegisterView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should render registration form', () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('h1').text()).toBe('Create Account')
    expect(wrapper.find('input#name').exists()).toBe(true)
    expect(wrapper.find('input#email').exists()).toBe(true)
    expect(wrapper.find('input#password').exists()).toBe(true)
    expect(wrapper.find('input#confirmPassword').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toBe('Create Account')
    expect(wrapper.find('router-link').attributes('to')).toBe('/login')
  })

  it('should validate password confirmation', async () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.find('input#name').setValue('Test User')
    await wrapper.find('input#email').setValue('test@example.com')
    await wrapper.find('input#password').setValue('password123')
    await wrapper.find('input#confirmPassword').setValue('different-password')
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.alert-danger').text()).toBe('Passwords do not match')
  })

  it('should handle successful registration', async () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router]
      }
    })

    const authStore = useAuthStore()
    authStore.register = vi.fn().mockResolvedValue({ token: 'test-token' })
    
    const pushSpy = vi.spyOn(router, 'push')

    await wrapper.find('input#name').setValue('Test User')
    await wrapper.find('input#email').setValue('test@example.com')
    await wrapper.find('input#password').setValue('password123')
    await wrapper.find('input#confirmPassword').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')

    expect(authStore.register).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    })
    expect(pushSpy).toHaveBeenCalledWith('/recipes')
  })

  it('should display error message on registration failure', async () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router]
      }
    })

    const authStore = useAuthStore()
    authStore.register = vi.fn().mockRejectedValue(new Error('Email already exists'))

    await wrapper.find('input#name').setValue('Test User')
    await wrapper.find('input#email').setValue('test@example.com')
    await wrapper.find('input#password').setValue('password123')
    await wrapper.find('input#confirmPassword').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.alert-danger').text()).toBe('Email already exists')
  })

  it('should display generic error message when no specific message', async () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router]
      }
    })

    const authStore = useAuthStore()
    authStore.register = vi.fn().mockRejectedValue({})

    await wrapper.find('input#name').setValue('Test User')
    await wrapper.find('input#email').setValue('test@example.com')
    await wrapper.find('input#password').setValue('password123')
    await wrapper.find('input#confirmPassword').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.alert-danger').text()).toBe('Failed to create account. Please try again.')
  })

  it('should disable form during loading', async () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router]
      }
    })

    const authStore = useAuthStore()
    let resolveRegister: (value: any) => void
    const registerPromise = new Promise(resolve => {
      resolveRegister = resolve
    })
    authStore.register = vi.fn().mockReturnValue(registerPromise)

    await wrapper.find('input#name').setValue('Test User')
    await wrapper.find('input#email').setValue('test@example.com')
    await wrapper.find('input#password').setValue('password123')
    await wrapper.find('input#confirmPassword').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()

    expect(wrapper.find('button[type="submit"]').text()).toBe('Creating Account...')
    expect(wrapper.find('input#name').attributes('disabled')).toBeDefined()
    expect(wrapper.find('input#email').attributes('disabled')).toBeDefined()
    expect(wrapper.find('input#password').attributes('disabled')).toBeDefined()
    expect(wrapper.find('input#confirmPassword').attributes('disabled')).toBeDefined()

    resolveRegister!({ token: 'test-token' })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button[type="submit"]').text()).toBe('Creating Account...')
  })

  it('should clear error when starting new registration attempt', async () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router]
      }
    })

    const authStore = useAuthStore()
    authStore.register = vi.fn().mockRejectedValue(new Error('First error'))

    await wrapper.find('input#name').setValue('Test User')
    await wrapper.find('input#email').setValue('test@example.com')
    await wrapper.find('input#password').setValue('password123')
    await wrapper.find('input#confirmPassword').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()
    expect(wrapper.find('.alert-danger').exists()).toBe(true)

    authStore.register = vi.fn().mockResolvedValue({ token: 'test-token' })
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()
    expect(wrapper.find('.alert-danger').exists()).toBe(false)
  })

  it('should have required attributes and validation', () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('input#name').attributes('required')).toBeDefined()
    expect(wrapper.find('input#email').attributes('required')).toBeDefined()
    expect(wrapper.find('input#password').attributes('required')).toBeDefined()
    expect(wrapper.find('input#password').attributes('minlength')).toBe('8')
    expect(wrapper.find('input#confirmPassword').attributes('required')).toBeDefined()
  })

  it('should not submit when passwords match but are empty', async () => {
    const wrapper = mount(RegisterView, {
      global: {
        plugins: [router]
      }
    })

    const authStore = useAuthStore()
    authStore.register = vi.fn()

    await wrapper.find('input#name').setValue('Test User')
    await wrapper.find('input#email').setValue('test@example.com')
    await wrapper.find('input#password').setValue('')
    await wrapper.find('input#confirmPassword').setValue('')
    await wrapper.find('form').trigger('submit.prevent')

    expect(authStore.register).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      password: ''
    })
  })
})
