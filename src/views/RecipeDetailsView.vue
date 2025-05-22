<template>
  <div class="recipe-details">
    <div class="recipe-details__container">
      <div v-if="loading" class="recipe-details__loading">
        <div class="loading-spinner"></div>
        <p>Loading recipe...</p>
      </div>

      <div v-else-if="error" class="recipe-details__error">
        {{ error }}
      </div>

      <div v-else-if="recipe" class="recipe-details__content">
        <!-- Mode indicator -->
        <div class="mode-indicator" :class="{ 'modify-mode': isModifyMode }">
          {{ isModifyMode ? 'Modification Mode' : (modifiedRecipe ? 'Modified Recipe' : 'View Mode') }}
        </div>

        <!-- View Mode -->
        <template v-if="!isModifyMode">
          <div v-if="modifiedRecipe" class="modification-banner">
            This is a modified version of the recipe
          </div>
          
          <div class="recipe-details__header">
            <h1>{{ (modifiedRecipe || recipe).title }}</h1>
            <p class="recipe-details__description">{{ (modifiedRecipe || recipe).description }}</p>
            
            <div class="recipe-details__meta">
              <div class="meta-item">
                <span class="meta-label">Servings:</span>
                <span class="meta-value">{{ (modifiedRecipe || recipe).servings }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Prep Time:</span>
                <span class="meta-value">{{ (modifiedRecipe || recipe).prep_time_minutes }} mins</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Cook Time:</span>
                <span class="meta-value">{{ (modifiedRecipe || recipe).cook_time_minutes }} mins</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Total Time:</span>
                <span class="meta-value">{{ (modifiedRecipe || recipe).total_time_minutes }} mins</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Difficulty:</span>
                <span class="meta-value">{{ (modifiedRecipe || recipe).difficulty }}</span>
              </div>
            </div>
          </div>

          <div class="recipe-details__sections">
            <div class="recipe-details__section">
              <h2>Ingredients</h2>
              <ul class="ingredients-list">
                <li v-for="(ingredient, index) in (modifiedRecipe || recipe).ingredients" :key="index">
                  {{ ingredient.amount }} {{ ingredient.unit }} {{ ingredient.item }}
                </li>
              </ul>
            </div>

            <div class="recipe-details__section">
              <h2>Instructions</h2>
              <ol class="instructions-list">
                <li v-for="instruction in (modifiedRecipe || recipe).instructions" :key="instruction.step">
                  {{ instruction.description }}
                </li>
              </ol>
            </div>

            <div class="recipe-details__section">
              <h2>Nutritional Information</h2>
              <div class="nutrition-info">
                <div class="nutrition-item">
                  <span class="nutrition-label">Calories:</span>
                  <span class="nutrition-value">{{ (modifiedRecipe || recipe).nutrition.calories }} kcal</span>
                </div>
                <div class="nutrition-item">
                  <span class="nutrition-label">Protein:</span>
                  <span class="nutrition-value">{{ (modifiedRecipe || recipe).nutrition.protein }}</span>
                </div>
                <div class="nutrition-item">
                  <span class="nutrition-label">Carbs:</span>
                  <span class="nutrition-value">{{ (modifiedRecipe || recipe).nutrition.carbs }}</span>
                </div>
                <div class="nutrition-item">
                  <span class="nutrition-label">Fat:</span>
                  <span class="nutrition-value">{{ (modifiedRecipe || recipe).nutrition.fat }}</span>
                </div>
              </div>
            </div>

            <div v-if="(modifiedRecipe || recipe).tags.length > 0" class="recipe-details__section">
              <h2>Tags</h2>
              <div class="tags-list">
                <span v-for="tag in (modifiedRecipe || recipe).tags" :key="tag" class="tag">
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>

          <!-- View Mode Actions -->
          <div class="recipe-details__actions">
            <button 
              class="btn btn-primary" 
              type="button" 
              @click="enterModifyMode"
            >
              {{ modifiedRecipe ? 'Modify Again' : 'Modify Recipe' }}
            </button>
            <button
              v-if="modifiedRecipe"
              class="btn btn-success"
              type="button"
              @click="approveModifiedRecipe"
            >
              Save/Approve
            </button>
          </div>
        </template>

        <!-- Modification Mode -->
        <template v-else>
          <div class="modification-layout">
            <!-- Original Recipe Preview -->
            <div class="original-recipe-preview">
              <h3>Original Recipe</h3>
              <div class="recipe-preview">
                <h4>{{ recipe.title }}</h4>
                <div class="preview-meta">
                  <span>{{ recipe.servings }} servings</span>
                  <span>{{ recipe.cook_time_minutes }} mins cook time</span>
                </div>
                <ul class="ingredients-list" style="margin-top: 1rem;">
                  <li v-for="(ingredient, idx) in recipe.ingredients" :key="idx">
                    {{ ingredient.amount }} {{ ingredient.unit }} {{ ingredient.item }}
                  </li>
                </ul>
              </div>
            </div>

            <!-- Modification Form -->
            <div class="modification-form">
              <h2>Modify Recipe: {{ recipe.title }}</h2>
              
              <div v-if="modifying" class="modification-loading">
                <div class="loading-spinner"></div>
                <p>Modifying recipe...</p>
              </div>
              
              <div v-else class="modification-options">
                <div class="form-group">
                  <label>Adjust Servings</label>
                  <div class="servings-adjustment">
                    <button 
                      class="btn btn-secondary" 
                      @click="modificationForm.servings = Math.max(1, modificationForm.servings - 1)"
                    >-</button>
                    <span>{{ modificationForm.servings }}</span>
                    <button 
                      class="btn btn-secondary" 
                      @click="modificationForm.servings++"
                    >+</button>
                  </div>
                </div>

                <div class="form-group">
                  <label>Adjust Cook Time</label>
                  <div class="time-adjustment">
                    <button 
                      class="btn btn-secondary" 
                      @click="modificationForm.cookTime = Math.max(0, modificationForm.cookTime - 5)"
                    >-5 min</button>
                    <span>{{ modificationForm.cookTime }} mins</span>
                    <button 
                      class="btn btn-secondary" 
                      @click="modificationForm.cookTime += 5"
                    >+5 min</button>
                  </div>
                </div>

                <div class="form-group">
                  <label>Taste Adjustments</label>
                  <div class="taste-adjustments">
                    <button 
                      v-for="taste in ['Sweeter', 'Saltier', 'Spicier', 'More Savory']" 
                      :key="taste"
                      class="btn btn-outline"
                      :class="{ 'active': modificationForm.tasteAdjustments.includes(taste) }"
                      @click="toggleTasteAdjustment(taste)"
                    >
                      {{ taste }}
                    </button>
                  </div>
                </div>

                <div class="form-group">
                  <label>Additional Modifications</label>
                  <textarea 
                    v-model="modificationForm.feedback" 
                    placeholder="Describe any other specific changes you'd like to make..."
                    rows="4"
                  ></textarea>
                </div>
              </div>

              <div class="form-actions">
                <button 
                  class="btn btn-secondary" 
                  type="button" 
                  @click="exitModifyMode"
                >
                  Cancel
                </button>
                <button 
                  class="btn btn-primary" 
                  type="button" 
                  @click="submitModification" 
                  :disabled="modifying"
                >
                  {{ modifying ? 'Modifying...' : 'Submit Modifications' }}
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { recipeService } from "@/services/api";
import type { Recipe as BaseRecipe } from "@/services/api";

console.log('RecipeDetailsView.vue script setup is running');

type Recipe = BaseRecipe;

const route = useRoute();
const recipe = ref<Recipe | null>(null);
const modifiedRecipe = ref<Recipe | null>(null);
const loading = ref(true);
const modifying = ref(false);
const error = ref<string | null>(null);
const isModifyMode = ref(false);

// Modification form data
const modificationForm = ref({
  servings: 0,
  cookTime: 0,
  tasteAdjustments: [] as string[],
  feedback: ''
});

const enterModifyMode = () => {
  if (!recipe.value) return;
  isModifyMode.value = true;
  // Initialize form with current recipe values
  modificationForm.value = {
    servings: recipe.value.servings,
    cookTime: recipe.value.cook_time_minutes,
    tasteAdjustments: [],
    feedback: ''
  };
};

const exitModifyMode = () => {
  isModifyMode.value = false;
  modificationForm.value = {
    servings: 0,
    cookTime: 0,
    tasteAdjustments: [],
    feedback: ''
  };
};

const toggleTasteAdjustment = (taste: string) => {
  const index = modificationForm.value.tasteAdjustments.indexOf(taste);
  if (index === -1) {
    modificationForm.value.tasteAdjustments.push(taste);
  } else {
    modificationForm.value.tasteAdjustments.splice(index, 1);
  }
};

const fetchRecipe = async () => {
  try {
    loading.value = true;
    error.value = null;
    const recipeId = route.params.id as string;
    console.log("Fetching recipe with ID:", recipeId);
    const response = await recipeService.getRecipe(recipeId);
    console.log("Fetched recipe:", response);
    recipe.value = response.recipe;
  } catch (err: any) {
    console.error("Error fetching recipe:", err);
    error.value = err.message || "Failed to load recipe. Please try again.";
  } finally {
    loading.value = false;
  }
};

const submitModification = async () => {
  if (!recipe.value?.id) return;
  
  // Build modification type based on selected adjustments
  const modifications = [];
  if (modificationForm.value.servings !== recipe.value.servings) {
    modifications.push(`Adjust servings to ${modificationForm.value.servings}`);
  }
  if (modificationForm.value.cookTime !== recipe.value.cook_time_minutes) {
    modifications.push(`Adjust cook time to ${modificationForm.value.cookTime} minutes`);
  }
  if (modificationForm.value.tasteAdjustments.length > 0) {
    modifications.push(`Make it ${modificationForm.value.tasteAdjustments.join(' and ').toLowerCase()}`);
  }
  
  const modificationType = modifications.join(', ');
  const additionalNotes = modificationForm.value.feedback;
  
  modifying.value = true;
  try {
    // Call the AI modification endpoint
    const response = await recipeService.modifyRecipeWithAI(recipe.value.id, {
      modification_type: modificationType,
      additional_notes: additionalNotes
    });
    // Fetch the modified recipe using the new recipe_id
    const modified = await recipeService.getRecipe(response.recipe_id);
    modifiedRecipe.value = modified.recipe;
    isModifyMode.value = false;
  } catch (err) {
    alert('Failed to submit modification.');
  } finally {
    modifying.value = false;
  }
};

const approveModifiedRecipe = async () => {
  if (!modifiedRecipe.value?.id) return;
  try {
    await recipeService.approveRecipe(modifiedRecipe.value.id);
    alert('Modified recipe saved/approved successfully!');
  } catch (err) {
    alert('Failed to save/approve modified recipe.');
  }
};

onMounted(() => {
  fetchRecipe();
});
</script>

<style lang="scss" scoped>
.recipe-details {
  padding: 2rem;
  min-height: 100vh;
  background-color: var(--background-color);

  &__container {
    max-width: 1200px;
    margin: 0 auto;
  }

  &__loading,
  &__error {
    text-align: center;
    padding: 2rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &__error {
    color: #dc2626;
  }

  &__content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 2rem;
  }

  &__header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;

    h1 {
      color: var(--primary-color);
      margin-bottom: 1rem;
      font-size: 2.5rem;
    }
  }

  &__description {
    color: var(--text-color);
    line-height: 1.6;
    margin-bottom: 1.5rem;
    font-size: 1.1rem;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    padding: 1rem;
    background-color: #f8fafc;
    border-radius: 4px;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .meta-label {
      font-size: 0.9rem;
      color: #666;
    }

    .meta-value {
      font-weight: 500;
      color: var(--text-color);
    }
  }

  &__sections {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }

  &__section {
    h2 {
      color: var(--secondary-color);
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }
  }

  .ingredients-list,
  .instructions-list {
    padding-left: 1.5rem;
    color: var(--text-color);
    line-height: 1.6;

    li {
      margin-bottom: 0.75rem;
    }
  }

  .nutrition-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    padding: 1rem;
    background-color: #f8fafc;
    border-radius: 4px;
  }

  .nutrition-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .nutrition-label {
      font-size: 0.9rem;
      color: #666;
    }

    .nutrition-value {
      font-weight: 500;
      color: var(--text-color);
    }
  }

  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag {
    background-color: #e2e8f0;
    color: #4a5568;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.9rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .mode-indicator {
    position: fixed;
    top: 1rem;
    right: 1rem;
    padding: 0.5rem 1rem;
    background-color: #e5e7eb;
    border-radius: 4px;
    font-size: 0.875rem;
    color: #374151;
    z-index: 10;
    
    &.modify-mode {
      background-color: #fef3c7;
      color: #92400e;
    }
  }

  .modification-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 2rem;
  }

  .original-recipe-preview {
    background: #f8fafc;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #e2e8f0;

    h3 {
      color: var(--secondary-color);
      margin-bottom: 1rem;
    }
  }

  .recipe-preview {
    h4 {
      color: var(--text-color);
      margin-bottom: 0.5rem;
    }
  }

  .preview-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.9rem;
    color: #666;
  }

  .modification-banner {
    background-color: #fef3c7;
    color: #92400e;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
    text-align: center;
    font-weight: 500;
  }

  .modification-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    background: #f8fafc;
    border-radius: 8px;
    margin: 1rem 0;
  }

  .modification-form {
    padding: 2rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    h2 {
      color: var(--primary-color);
      margin-bottom: 2rem;
      font-size: 1.8rem;
    }
  }

  .modification-options {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .servings-adjustment,
  .time-adjustment {
    display: flex;
    align-items: center;
    gap: 1rem;

    span {
      min-width: 3rem;
      text-align: center;
      font-weight: 500;
    }
  }

  .taste-adjustments {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;

    .btn-outline {
      border: 1px solid #e2e8f0;
      background: white;
      color: #4a5568;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: all 0.2s;

      &:hover {
        background: #f8fafc;
      }

      &.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }
    }
  }

  .form-actions {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  .recipe-details__actions {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }
}
</style>
