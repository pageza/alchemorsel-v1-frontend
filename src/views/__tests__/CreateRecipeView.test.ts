import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import CreateRecipeView from '../CreateRecipeView.vue'
import { recipeService } from '../../services/api'

vi.mock('../../services/api', () => ({
  recipeService: {
    generateRecipe: vi.fn()
  }
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/create', component: CreateRecipeView },
    { path: '/recipes/:id', name: 'RecipeDetail', component: { template: '<div>Recipe Detail</div>' } }
  ]
})

describe('CreateRecipeView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render create recipe form', () => {
    const wrapper = mount(CreateRecipeView, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('h1').text()).toBe('Create New Recipe')
    expect(wrapper.find('textarea#query').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toBe('Generate Recipe')
    expect(wrapper.find('.form-hint').exists()).toBe(true)
  })

  it('should handle successful recipe generation', async () => {
    const mockResponse = { recipe: { id: 'recipe-123', title: 'Generated Recipe' }, status: 'success' } as any
    vi.mocked(recipeService.generateRecipe).mockResolvedValue(mockResponse)
    
    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = mount(CreateRecipeView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.find('textarea#query').setValue('chicken and vegetables')
    await wrapper.find('form').trigger('submit.prevent')

    expect(recipeService.generateRecipe).toHaveBeenCalledWith({ query: 'chicken and vegetables' })
    expect(pushSpy).toHaveBeenCalledWith({ name: 'RecipeDetail', params: { id: 'recipe-123' } })
  })

  it('should display error on generation failure', async () => {
    const mockError = { response: { data: { message: 'Generation failed' } } }
    vi.mocked(recipeService.generateRecipe).mockRejectedValue(mockError)

    const wrapper = mount(CreateRecipeView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.find('textarea#query').setValue('test query')
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.error-message').text()).toBe('Generation failed')
  })

  it('should display generic error message when no specific message', async () => {
    vi.mocked(recipeService.generateRecipe).mockRejectedValue(new Error('Network error'))

    const wrapper = mount(CreateRecipeView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.find('textarea#query').setValue('test query')
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.error-message').text()).toBe('Failed to create recipe. Please try again.')
  })

  it('should display loading state during generation', async () => {
    let resolveGeneration: (value: any) => void
    const generationPromise = new Promise(resolve => {
      resolveGeneration = resolve
    })
    vi.mocked(recipeService.generateRecipe).mockReturnValue(generationPromise as any)

    const wrapper = mount(CreateRecipeView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.find('textarea#query').setValue('test query')
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.loading-state').exists()).toBe(true)
    expect(wrapper.find('.loading-spinner').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toBe('Creating Recipe...')
    expect(wrapper.find('textarea#query').attributes('disabled')).toBeDefined()

    resolveGeneration!({ recipe: { id: '123', title: 'Test' }, status: 'success' })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.loading-state').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toBe('Creating Recipe...')
  })

  it('should handle response without recipe ID', async () => {
    const mockResponse = { recipe: { title: 'Generated Recipe' }, status: 'success' } as any
    vi.mocked(recipeService.generateRecipe).mockResolvedValue(mockResponse)

    const wrapper = mount(CreateRecipeView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.find('textarea#query').setValue('test query')
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.error-message').text()).toBe('Failed to create recipe. Please try again.')
  })

  it('should have required attributes on textarea', () => {
    const wrapper = mount(CreateRecipeView, {
      global: {
        plugins: [router]
      }
    })

    const textarea = wrapper.find('textarea#query')
    expect(textarea.attributes('required')).toBeDefined()
    expect(textarea.attributes('minlength')).toBe('2')
    expect(textarea.attributes('maxlength')).toBe('500')
  })

  it('should clear error when starting new generation attempt', async () => {
    vi.mocked(recipeService.generateRecipe).mockRejectedValue(new Error('First error'))

    const wrapper = mount(CreateRecipeView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.find('textarea#query').setValue('test query')
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()
    expect(wrapper.find('.error-message').exists()).toBe(true)

    vi.mocked(recipeService.generateRecipe).mockResolvedValue({ recipe: { id: '123', title: 'Test' }, status: 'success' } as any)
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()
    expect(wrapper.find('.error-message').exists()).toBe(false)
  })
})
