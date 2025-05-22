<template>
  <div class="create-recipe">
    <div class="create-recipe__container">
      <h1>Create New Recipe</h1>
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      <form class="create-recipe__form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="query">What would you like to cook?</label>
          <p class="form-hint">
            Our AI chef will create a complete recipe based on your request. You can be as specific or general as you'd like. For example:
            <br>- "A healthy chicken dish with vegetables"
            <br>- "Kosher meal using potatoes and carrots"
            <br>- "Turkey dinner, 450 calories per serving, 4 servings"
            <br>- "Quick vegetarian pasta dish under 30 minutes"
            <br>- "Low-carb dinner with beef and broccoli"
          </p>
          <textarea
            id="query"
            v-model="query"
            required
            :disabled="loading"
            minlength="2"
            maxlength="500"
            placeholder="Describe what you'd like to cook..."
            class="query-input"
          ></textarea>
          <p class="form-hint">
            The AI will generate a complete recipe including ingredients, instructions, nutrition info, and more!
          </p>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Our AI chef is creating your recipe...</p>
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Creating Recipe...' : 'Generate Recipe' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { recipeService } from "@/services/api";

const router = useRouter();
const loading = ref(false);
const error = ref<string | null>(null);
const query = ref("");

const handleSubmit = async () => {
  try {
    loading.value = true;
    error.value = null;

    const response = await recipeService.generateRecipe({ query: query.value });
    console.log("Generated recipe response:", response);
    if (response.recipe && response.recipe.id) {
      router.push({ name: 'RecipeDetail', params: { id: response.recipe.id } });
    } else {
      throw new Error("No recipe ID received from server");
    }
  } catch (err: any) {
    console.error("Failed to create recipe:", err);
    error.value = err.response?.data?.message || "Failed to create recipe. Please try again.";
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.create-recipe {
  min-height: 100vh;
  padding: 2rem;
  background-color: var(--background-color);

  &__container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .error-message {
    background-color: #fee2e2;
    color: #dc2626;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
    font-weight: 500;
  }

  h1 {
    text-align: center;
    color: var(--primary-color);
    margin-bottom: 2rem;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      font-weight: 500;
      color: var(--text-color);
      font-size: 1.2rem;
    }

    .form-hint {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }
  }

  .query-input {
    width: 100%;
    min-height: 150px;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    resize: vertical;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.1);
    }

    &:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: #f8fafc;
    border-radius: 4px;

    p {
      color: #666;
      font-size: 0.9rem;
    }
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    &-primary {
      background-color: var(--primary-color);
      color: white;

      &:hover:not(:disabled) {
        background-color: var(--primary-color-dark);
        transform: translateY(-1px);
      }
    }
  }
}
</style> 