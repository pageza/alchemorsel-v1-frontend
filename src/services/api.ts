import axios, { type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';

const BACKEND_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: `${BACKEND_URL}/v1`,
  headers: {
    'Accept': '*/*',
    'Cache-Control': 'no-cache'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Unable to connect to the server. Please check if the backend server is running.');
    }
    if (error.response?.status === 0) {
      throw new Error('CORS error: Unable to access the server. Please check if CORS is enabled on the backend.');
    }
    if (error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
      throw new Error((error.response.data as any).message);
    }
    throw error;
  }
);

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/users/login', credentials);
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/users', data);
    return response.data;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }
};

export interface Ingredient {
  item: string;
  amount: string | number;
  unit: string;
}

export interface Instruction {
  step: number;
  description: string;
}

export interface Nutrition {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  servings: number;
  prep_time_minutes: number;
  cook_time_minutes: number;
  total_time_minutes: number;
  ingredients: Ingredient[];
  instructions: Instruction[];
  nutrition: Nutrition;
  tags: string[];
  difficulty: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface RecipeListResponse {
  recipes: Recipe[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    offset: number;
    pages: number;
  };
}

export interface SearchResponse {
  exact_matches: Recipe[];
  similar_matches: Recipe[];
  message: string;
}

interface GenerateRecipeRequest {
  query: string;
}

export interface GenerateRecipeResponse {
  recipe: Recipe;
  status: string;
}

export const recipeService = {
  async listRecipes(): Promise<RecipeListResponse> {
    const response = await api.get(`${BACKEND_URL}/v1/recipes`);
    return response.data;
  },

  async getRecipe(id: string): Promise<GenerateRecipeResponse> {
    try {
      const response = await api.get<GenerateRecipeResponse>(`/recipes/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  async searchRecipes(query: string): Promise<SearchResponse> {
    try {
      const response = await api.post<SearchResponse>('/recipes/search', { 
        query: query.trim() 
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  async generateRecipe(request: GenerateRecipeRequest): Promise<GenerateRecipeResponse> {
    try {
      const response = await api.post<GenerateRecipeResponse>("/recipes", request);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  // Add local search function
  searchLocalRecipes(recipes: Recipe[], query: string): Recipe[] {
    const searchTerm = query.toLowerCase().trim();
    return recipes.filter(recipe => 
      recipe.title.toLowerCase().includes(searchTerm) ||
      recipe.description.toLowerCase().includes(searchTerm) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  },

  async approveRecipe(id: string): Promise<GenerateRecipeResponse> {
    try {
      const response = await api.post<GenerateRecipeResponse>(`/recipes/${id}/approve`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  async suggestModification(id: string, feedback: string): Promise<any> {
    return api.post(`/recipes/${id}/modify`, { feedback });
  },

  async modifyRecipeWithAI(id: string, data: { modification_type: string, additional_notes?: string }): Promise<any> {
    const response = await api.post(`/recipes/${id}/modify-with-ai`, data);
    return response.data;
  }
};

export default api;      