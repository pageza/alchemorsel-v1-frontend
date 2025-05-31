import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import RecipesView from '../RecipesView.vue'
import { recipeService } from '../../services/api'
import type { Recipe } from '../../services/api'

vi.mock('../../services/api', () => ({
  recipeService: {
    listRecipes: vi.fn(),
    searchRecipes: vi.fn(),
    searchLocalRecipes: vi.fn()
  }
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/recipes', component: RecipesView },
    { path: '/create', component: { template: '<div>Create</div>' } },
    { path: '/recipes/:id', component: { template: '<div>Recipe Detail</div>' } }
  ]
})

const mockRecipe: Recipe = {
  id: '1',
  title: 'Test Recipe',
  description: 'Test description',
  ingredients: [{ item: 'chicken', amount: '1', unit: 'lb' }],
  instructions: [{ step: 1, description: 'Cook chicken' }],
  tags: ['chicken', 'easy'],
  servings: 4,
  prep_time_minutes: 15,
  cook_time_minutes: 30,
  total_time_minutes: 45,
  difficulty: 'easy',
  nutrition: { calories: 300, protein: '25g', carbs: '10g', fat: '15g' },
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
  user_id: '1'
}

describe('RecipesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render recipes list', async () => {
    const mockRecipes = {
      recipes: [mockRecipe],
      pagination: { total: 1, page: 1, limit: 10, offset: 0, pages: 1 }
    }
    vi.mocked(recipeService.listRecipes).mockResolvedValue(mockRecipes)

    const wrapper = mount(RecipesView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.find('h1').text()).toBe('Recipes')
    expect(wrapper.find('.recipe-card__title').text()).toBe('Test Recipe')
    expect(wrapper.find('.recipe-card__description').text()).toBe('Test description')
    expect(wrapper.text()).toContain('1 ingredients')
    expect(wrapper.text()).toContain('1 steps')
    expect(wrapper.text()).toContain('chicken, easy')
  })

  it('should handle search functionality', async () => {
    const mockRecipes = { recipes: [], pagination: { total: 0, page: 1, limit: 10, offset: 0, pages: 1 } }
    const mockSearchResults = { exact_matches: [], similar_matches: [], message: 'No results found' }
    
    vi.mocked(recipeService.listRecipes).mockResolvedValue(mockRecipes)
    vi.mocked(recipeService.searchRecipes).mockResolvedValue(mockSearchResults)
    vi.mocked(recipeService.searchLocalRecipes).mockReturnValue([])

    const wrapper = mount(RecipesView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    
    const searchInput = wrapper.find('.recipes__search')
    await searchInput.setValue('chicken')
    await searchInput.trigger('input')

    await new Promise(resolve => setTimeout(resolve, 350))

    expect(recipeService.searchRecipes).toHaveBeenCalledWith('chicken')
    expect(wrapper.find('.recipes__search-message').exists()).toBe(true)
  })

  it('should combine local and backend search results', async () => {
    const mockRecipes = { recipes: [mockRecipe], pagination: { total: 1, page: 1, limit: 10, offset: 0, pages: 1 } }
    const localResult = { ...mockRecipe, id: '2', title: 'Local Recipe' }
    const backendResult = { ...mockRecipe, id: '3', title: 'Backend Recipe' }
    const mockSearchResults = { exact_matches: [backendResult], similar_matches: [], message: 'Found results' }
    
    vi.mocked(recipeService.listRecipes).mockResolvedValue(mockRecipes)
    vi.mocked(recipeService.searchRecipes).mockResolvedValue(mockSearchResults)
    vi.mocked(recipeService.searchLocalRecipes).mockReturnValue([localResult])

    const wrapper = mount(RecipesView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    
    const searchInput = wrapper.find('.recipes__search')
    await searchInput.setValue('chicken')
    await searchInput.trigger('input')

    await new Promise(resolve => setTimeout(resolve, 350))

    const recipeTitles = wrapper.findAll('.recipe-card__title').map(el => el.text())
    expect(recipeTitles).toContain('Local Recipe')
    expect(recipeTitles).toContain('Backend Recipe')
  })

  it('should clear search and reload recipes', async () => {
    const mockRecipes = { recipes: [mockRecipe], pagination: { total: 1, page: 1, limit: 10, offset: 0, pages: 1 } }
    
    vi.mocked(recipeService.listRecipes).mockResolvedValue(mockRecipes)
    vi.mocked(recipeService.searchRecipes).mockResolvedValue({ exact_matches: [], similar_matches: [], message: 'No results' })
    vi.mocked(recipeService.searchLocalRecipes).mockReturnValue([])

    const wrapper = mount(RecipesView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    
    const searchInput = wrapper.find('.recipes__search')
    await searchInput.setValue('chicken')
    await searchInput.trigger('input')
    await new Promise(resolve => setTimeout(resolve, 350))

    await searchInput.setValue('')
    await searchInput.trigger('input')
    await new Promise(resolve => setTimeout(resolve, 350))

    expect(recipeService.listRecipes).toHaveBeenCalledTimes(2)
  })

  it('should display empty state when no recipes', async () => {
    const mockRecipes = { recipes: [], pagination: { total: 0, page: 1, limit: 10, offset: 0, pages: 1 } }
    vi.mocked(recipeService.listRecipes).mockResolvedValue(mockRecipes)

    const wrapper = mount(RecipesView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.find('.recipes__empty').exists()).toBe(true)
    expect(wrapper.find('.empty-state h2').text()).toBe('No Recipes Found')
    expect(wrapper.find('.empty-state p').text()).toContain('There are no recipes yet')
  })

  it('should display search-specific empty state', async () => {
    const mockRecipes = { recipes: [mockRecipe], pagination: { total: 1, page: 1, limit: 10, offset: 0, pages: 1 } }
    vi.mocked(recipeService.listRecipes).mockResolvedValue(mockRecipes)
    vi.mocked(recipeService.searchRecipes).mockResolvedValue({ exact_matches: [], similar_matches: [], message: 'No results' })
    vi.mocked(recipeService.searchLocalRecipes).mockReturnValue([])

    const wrapper = mount(RecipesView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    
    const searchInput = wrapper.find('.recipes__search')
    await searchInput.setValue('nonexistent')
    await searchInput.trigger('input')
    await new Promise(resolve => setTimeout(resolve, 350))

    expect(wrapper.find('.recipes__search-message').exists()).toBe(true)
    expect(wrapper.find('.recipes__search-message').text()).toContain('No results')
  })

  it('should display error state on API failure', async () => {
    vi.mocked(recipeService.listRecipes).mockRejectedValue(new Error('API Error'))

    const wrapper = mount(RecipesView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.find('.recipes__error').exists()).toBe(true)
    expect(wrapper.find('.recipes__error').text()).toContain('API Error')
  })

  it('should handle search error gracefully', async () => {
    const mockRecipes = { recipes: [mockRecipe], pagination: { total: 1, page: 1, limit: 10, offset: 0, pages: 1 } }
    vi.mocked(recipeService.listRecipes).mockResolvedValue(mockRecipes)
    vi.mocked(recipeService.searchRecipes).mockRejectedValue(new Error('Search failed'))
    vi.mocked(recipeService.searchLocalRecipes).mockReturnValue([mockRecipe])

    const wrapper = mount(RecipesView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    
    const searchInput = wrapper.find('.recipes__search')
    await searchInput.setValue('chicken')
    await searchInput.trigger('input')
    await new Promise(resolve => setTimeout(resolve, 350))

    expect(wrapper.find('.recipes__search-message').exists()).toBe(false)
    expect(wrapper.find('.recipe-card__title').exists()).toBe(false)
  })

  it('should display loading state', async () => {
    let resolveRecipes: (value: any) => void
    const recipesPromise = new Promise(resolve => {
      resolveRecipes = resolve
    })
    vi.mocked(recipeService.listRecipes).mockReturnValue(recipesPromise as any)

    const wrapper = mount(RecipesView, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.find('.recipes__loading').exists()).toBe(true)
    expect(wrapper.find('.recipes__loading').text()).toBe('Loading recipes...')

    resolveRecipes!({ recipes: [], pagination: { total: 0, page: 1, limit: 10, offset: 0, pages: 1 } })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.recipes__loading').exists()).toBe(true)
  })

  it('should handle pagination', async () => {
    const mockRecipes = {
      recipes: [mockRecipe],
      pagination: { total: 20, page: 1, limit: 10, offset: 0, pages: 2 }
    }
    vi.mocked(recipeService.listRecipes).mockResolvedValue(mockRecipes)

    const wrapper = mount(RecipesView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.find('.recipes__pagination').exists()).toBe(true)
    expect(wrapper.find('.recipes__page-info').text()).toBe('Page 1 of 2')
    
    const nextButton = wrapper.find('button:last-child')
    expect(nextButton.text()).toBe('Next')
    expect(nextButton.attributes('disabled')).toBeUndefined()
    
    const prevButton = wrapper.find('button:first-child')
    expect(prevButton.text()).toBe('Previous')
    expect(prevButton.attributes('disabled')).toBeDefined()
  })

  it('should handle invalid response format', async () => {
    vi.mocked(recipeService.listRecipes).mockResolvedValue(null as any)

    const wrapper = mount(RecipesView, {
      global: {
        plugins: [router]
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.find('.recipes__error').exists()).toBe(true)
    expect(wrapper.find('.recipes__error').text()).toContain('Invalid response format from server')
  })
})
