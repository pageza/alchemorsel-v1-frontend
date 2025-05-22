<template>
  <div class="recipes">
    <div class="recipes__header">
      <h1>Recipes</h1>
      <div class="recipes__actions">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search recipes..."
          class="recipes__search"
          @input="handleSearch"
        />
        <router-link to="/create" class="button button--primary">Create Recipe</router-link>
      </div>
    </div>

    <div v-if="loading" class="recipes__loading">
      Loading recipes...
    </div>

    <div v-else-if="error" class="recipes__error">
      {{ error }}
    </div>

    <div v-else-if="recipes.length === 0 && searchMessage" class="recipes__search-message">
      {{ searchMessage }}
    </div>

    <div v-else-if="recipes.length === 0" class="recipes__empty">
      <div class="empty-state">
        <h2>No Recipes Found</h2>
        <p v-if="searchQuery">
          No recipes match your search "{{ searchQuery }}". Try a different search term or create a new recipe.
        </p>
        <p v-else>
          There are no recipes yet. Be the first to create one!
        </p>
        <router-link to="/create" class="button button--primary">
          Create Your First Recipe
        </router-link>
      </div>
    </div>

    <div v-else class="recipes__grid">
      <div v-for="recipe in recipes" :key="recipe.id" class="recipe-card">
        <h3 class="recipe-card__title">{{ recipe.title }}</h3>
        <p class="recipe-card__description">{{ recipe.description }}</p>
        <div class="recipe-card__details">
          <span>{{ recipe.ingredients.length }} ingredients</span>
          <span>{{ recipe.instructions.length }} steps</span>
          <span v-if="recipe.tags.length" class="recipe-card__tags">
            {{ recipe.tags.join(', ') }}
          </span>
        </div>
        <router-link :to="`/recipes/${recipe.id}`" class="recipe-card__link">
          View Recipe
        </router-link>
      </div>
    </div>

    <div v-if="totalPages > 1" class="recipes__pagination">
      <button
        :disabled="currentPage === 1"
        @click="handlePageChange(currentPage - 1)"
        class="button"
      >
        Previous
      </button>
      <span class="recipes__page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button
        :disabled="currentPage === totalPages"
        @click="handlePageChange(currentPage + 1)"
        class="button"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { recipeService } from '@/services/api';
import type { Recipe, RecipeListResponse } from '@/services/api';

const recipes = ref<Recipe[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const currentPage = ref(1);
const totalPages = ref(1);
const searchQuery = ref('');
const searchResults = ref<Recipe[]>([]);
const backendSearchResults = ref<Recipe[]>([]);
const searchMessage = ref<string | null>(null);
let searchTimeout: number | null = null;

const loadRecipes = async () => {
  try {
    loading.value = true;
    error.value = null;
    console.log('Fetching recipes...');
    
    const response: RecipeListResponse = await recipeService.listRecipes();
    console.log('Full API response:', response);
    
    if (!response || !response.recipes) {
      console.error('Invalid response format:', response);
      throw new Error('Invalid response format from server');
    }
    
    if (!Array.isArray(response.recipes)) {
      console.error('Recipes is not an array:', response.recipes);
      throw new Error('Invalid recipes data format');
    }
    
    recipes.value = response.recipes;
    
    // Use the pagination data directly from the response
    if (response.pagination) {
      totalPages.value = response.pagination.pages;
      currentPage.value = response.pagination.page;
    } else {
      totalPages.value = 1;
      currentPage.value = 1;
    }
    
    console.log('Processed data:', {
      recipesCount: recipes.value.length,
      totalPages: totalPages.value,
      currentPage: currentPage.value,
      recipes: recipes.value,
      pagination: response.pagination
    });
  } catch (err: any) {
    console.error('Error loading recipes:', err);
    error.value = err.message || 'Failed to load recipes';
    recipes.value = [];
    totalPages.value = 1;
    currentPage.value = 1;
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
};

const handleSearch = async () => {
  // Clear any existing timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  // Set a new timeout to debounce the search
  searchTimeout = window.setTimeout(async () => {
    if (searchQuery.value.trim()) {
      try {
        loading.value = true;
        error.value = null;
        console.log('Searching with query:', searchQuery.value);
        
        // Perform local search immediately
        searchResults.value = recipeService.searchLocalRecipes(recipes.value, searchQuery.value);
        
        // Perform backend search
        const response = await recipeService.searchRecipes(searchQuery.value);
        console.log('Search response:', response);
        
        // Combine results, prioritizing exact matches
        backendSearchResults.value = [...response.exact_matches, ...response.similar_matches];
        searchMessage.value = response.message;
        
        // Combine local and backend results, removing duplicates
        const combinedResults = [...searchResults.value];
        backendSearchResults.value.forEach(recipe => {
          if (!combinedResults.some(r => r.id === recipe.id)) {
            combinedResults.push(recipe);
          }
        });
        
        recipes.value = combinedResults;
      } catch (err: any) {
        console.error('Search error:', err);
        error.value = err.message || 'Failed to search recipes';
        // Keep local search results even if backend search fails
        recipes.value = searchResults.value;
      } finally {
        loading.value = false;
      }
    } else {
      // If search is cleared, reload all recipes
      await loadRecipes();
      searchResults.value = [];
      backendSearchResults.value = [];
      searchMessage.value = null;
    }
  }, 300); // Wait 300ms after the user stops typing before searching
};

onMounted(() => {
  loadRecipes();
});

watch(currentPage, () => {
  loadRecipes();
});
</script>

<style lang="scss" scoped>
.recipes {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  &__actions {
    display: flex;
    gap: 1rem;
  }

  &__search {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    min-width: 200px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
  }

  &__loading,
  &__error,
  &__empty {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  &__error {
    color: #dc3545;
  }

  &__pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 2rem;
  }

  &__page-info {
    color: #666;
  }

  &__search-message {
    text-align: center;
    padding: 1rem;
    color: #666;
  }
}

.recipe-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &__title {
    margin: 0;
    color: #2c3e50;
  }

  &__description {
    color: #666;
    margin: 0;
    flex-grow: 1;
  }

  &__details {
    display: flex;
    gap: 1rem;
    color: #666;
    font-size: 0.9rem;
  }

  &__link {
    color: #42b983;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }

  &__tags {
    color: #666;
    font-size: 0.9rem;
  }
}

.button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 1rem;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--primary {
    background: #42b983;
    color: white;
    border: none;

    &:hover {
      background: #3aa876;
    }
  }
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h2 {
    color: var(--primary-color);
    margin-bottom: 1rem;
  }

  p {
    color: #666;
    margin-bottom: 2rem;
    font-size: 1.1rem;
  }

  .button {
    display: inline-block;
  }
}
</style>
