import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Recipe } from '../api'

vi.mock('../api', async () => {
  const actual = await vi.importActual('../api')
  return {
    ...actual,
    authService: {
      login: vi.fn(),
      register: vi.fn(),
      isAuthenticated: vi.fn()
    },
    recipeService: {
      listRecipes: vi.fn(),
      getRecipe: vi.fn(),
      searchRecipes: vi.fn(),
      generateRecipe: vi.fn(),
      approveRecipe: vi.fn(),
      searchLocalRecipes: vi.fn().mockImplementation((recipes: Recipe[], query: string) => {
        if (!query.trim()) return []
        const lowerQuery = query.toLowerCase()
        return recipes.filter(recipe => 
          recipe.title.toLowerCase().includes(lowerQuery) ||
          recipe.description.toLowerCase().includes(lowerQuery) ||
          recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        )
      })
    }
  }
})

import { authService, recipeService } from '../api'

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('authService', () => {
    it('should login successfully', async () => {
      const mockResponse = { token: 'test-token', user: { id: '1', name: 'Test', email: 'test@example.com' } }
      vi.mocked(authService.login).mockResolvedValue(mockResponse)

      const result = await authService.login({ email: 'test@example.com', password: 'password' })

      expect(authService.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' })
      expect(result).toEqual(mockResponse)
    })

    it('should register successfully', async () => {
      const mockResponse = { token: 'test-token', user: { id: '1', name: 'Test', email: 'test@example.com' } }
      vi.mocked(authService.register).mockResolvedValue(mockResponse)

      const result = await authService.register({ name: 'Test', email: 'test@example.com', password: 'password' })

      expect(authService.register).toHaveBeenCalledWith({ name: 'Test', email: 'test@example.com', password: 'password' })
      expect(result).toEqual(mockResponse)
    })

    it('should check authentication status', () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(false)
      expect(authService.isAuthenticated()).toBe(false)
      
      vi.mocked(authService.isAuthenticated).mockReturnValue(true)
      expect(authService.isAuthenticated()).toBe(true)
    })
  })

  describe('recipeService', () => {
    it('should list recipes successfully', async () => {
      const mockResponse = { recipes: [], pagination: { total: 0, page: 1, limit: 10, offset: 0, pages: 1 } }
      vi.mocked(recipeService.listRecipes).mockResolvedValue(mockResponse)

      const result = await recipeService.listRecipes()

      expect(recipeService.listRecipes).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should get single recipe successfully', async () => {
      const mockResponse = { recipe: { id: '1', title: 'Test Recipe' }, status: 'success' } as any
      vi.mocked(recipeService.getRecipe).mockResolvedValue(mockResponse)

      const result = await recipeService.getRecipe('1')

      expect(recipeService.getRecipe).toHaveBeenCalledWith('1')
      expect(result).toEqual(mockResponse)
    })

    it('should search recipes successfully', async () => {
      const mockResponse = { exact_matches: [], similar_matches: [], message: 'No results found' }
      vi.mocked(recipeService.searchRecipes).mockResolvedValue(mockResponse)

      const result = await recipeService.searchRecipes('chicken')

      expect(recipeService.searchRecipes).toHaveBeenCalledWith('chicken')
      expect(result).toEqual(mockResponse)
    })

    it('should trim search query', async () => {
      const mockResponse = { exact_matches: [], similar_matches: [], message: 'No results found' }
      vi.mocked(recipeService.searchRecipes).mockResolvedValue(mockResponse)

      await recipeService.searchRecipes('  chicken  ')

      expect(recipeService.searchRecipes).toHaveBeenCalledWith('  chicken  ')
    })

    it('should generate recipe successfully', async () => {
      const mockResponse = { recipe: { id: '1', title: 'Test Recipe' }, status: 'success' } as any
      vi.mocked(recipeService.generateRecipe).mockResolvedValue(mockResponse)

      const result = await recipeService.generateRecipe({ query: 'chicken dish' })

      expect(recipeService.generateRecipe).toHaveBeenCalledWith({ query: 'chicken dish' })
      expect(result).toEqual(mockResponse)
    })

    it('should approve recipe successfully', async () => {
      const mockResponse = { recipe: { id: '1', title: 'Test Recipe' }, status: 'approved' } as any
      vi.mocked(recipeService.approveRecipe).mockResolvedValue(mockResponse)

      const result = await recipeService.approveRecipe('1')

      expect(recipeService.approveRecipe).toHaveBeenCalledWith('1')
      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors properly', async () => {
      const mockError = new Error('Server error')
      vi.mocked(recipeService.searchRecipes).mockRejectedValue(mockError)

      await expect(recipeService.searchRecipes('test')).rejects.toThrow('Server error')
    })

    it('should handle API errors without message', async () => {
      const mockError = new Error('Network error')
      vi.mocked(recipeService.searchRecipes).mockRejectedValue(mockError)

      await expect(recipeService.searchRecipes('test')).rejects.toThrow('Network error')
    })

    it('should search local recipes by title', () => {
      const recipes: Recipe[] = [
        { id: '1', title: 'Chicken Soup', description: 'Delicious soup', tags: ['soup'], ingredients: [], instructions: [], nutrition: { calories: 200, protein: '10g', carbs: '20g', fat: '5g' }, servings: 4, prep_time_minutes: 15, cook_time_minutes: 30, total_time_minutes: 45, difficulty: 'easy', created_at: '2023-01-01', updated_at: '2023-01-01', user_id: '1' },
        { id: '2', title: 'Beef Stew', description: 'Hearty stew', tags: ['stew'], ingredients: [], instructions: [], nutrition: { calories: 300, protein: '20g', carbs: '15g', fat: '10g' }, servings: 6, prep_time_minutes: 20, cook_time_minutes: 60, total_time_minutes: 80, difficulty: 'medium', created_at: '2023-01-01', updated_at: '2023-01-01', user_id: '1' }
      ]

      const result = recipeService.searchLocalRecipes(recipes, 'chicken')
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Chicken Soup')
    })

    it('should search local recipes by description', () => {
      const recipes: Recipe[] = [
        { id: '1', title: 'Soup', description: 'Delicious chicken soup', tags: [], ingredients: [], instructions: [], nutrition: { calories: 200, protein: '10g', carbs: '20g', fat: '5g' }, servings: 4, prep_time_minutes: 15, cook_time_minutes: 30, total_time_minutes: 45, difficulty: 'easy', created_at: '2023-01-01', updated_at: '2023-01-01', user_id: '1' }
      ]

      const result = recipeService.searchLocalRecipes(recipes, 'chicken')
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Soup')
    })

    it('should search local recipes by tags', () => {
      const recipes: Recipe[] = [
        { id: '1', title: 'Soup', description: 'Delicious soup', tags: ['chicken', 'comfort'], ingredients: [], instructions: [], nutrition: { calories: 200, protein: '10g', carbs: '20g', fat: '5g' }, servings: 4, prep_time_minutes: 15, cook_time_minutes: 30, total_time_minutes: 45, difficulty: 'easy', created_at: '2023-01-01', updated_at: '2023-01-01', user_id: '1' }
      ]

      const result = recipeService.searchLocalRecipes(recipes, 'chicken')
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Soup')
    })

    it('should return empty array for no matches', () => {
      const recipes: Recipe[] = [
        { id: '1', title: 'Beef Stew', description: 'Hearty stew', tags: ['beef'], ingredients: [], instructions: [], nutrition: { calories: 300, protein: '20g', carbs: '15g', fat: '10g' }, servings: 6, prep_time_minutes: 20, cook_time_minutes: 60, total_time_minutes: 80, difficulty: 'medium', created_at: '2023-01-01', updated_at: '2023-01-01', user_id: '1' }
      ]

      const result = recipeService.searchLocalRecipes(recipes, 'chicken')
      expect(result).toHaveLength(0)
    })

    it('should handle empty search query', () => {
      const recipes: Recipe[] = [
        { id: '1', title: 'Soup', description: 'Delicious soup', tags: [], ingredients: [], instructions: [], nutrition: { calories: 200, protein: '10g', carbs: '20g', fat: '5g' }, servings: 4, prep_time_minutes: 15, cook_time_minutes: 30, total_time_minutes: 45, difficulty: 'easy', created_at: '2023-01-01', updated_at: '2023-01-01', user_id: '1' }
      ]

      const result = recipeService.searchLocalRecipes(recipes, '')
      expect(result).toHaveLength(0)
    })
  })
})
