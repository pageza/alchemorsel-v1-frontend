describe('Recipe Management', () => {
  beforeEach(() => {
    window.localStorage.setItem('auth_token', 'test-token')
    cy.visit('/recipes')
  })

  it('should display recipes list', () => {
    cy.intercept('GET', '**/v1/recipes', {
      statusCode: 200,
      body: {
        recipes: [
          { 
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
        ],
        pagination: { total: 1, page: 1, limit: 10, offset: 0, pages: 1 }
      }
    }).as('getRecipes')

    cy.wait('@getRecipes')
    cy.get('.recipe-card__title').should('contain', 'Test Recipe')
    cy.get('.recipe-card__description').should('contain', 'Test description')
    cy.contains('1 ingredients')
    cy.contains('1 steps')
    cy.contains('chicken, easy')
  })

  it('should search recipes', () => {
    cy.intercept('GET', '**/v1/recipes', {
      statusCode: 200,
      body: { recipes: [], pagination: { total: 0, page: 1, limit: 10, offset: 0, pages: 1 } }
    }).as('getRecipes')

    cy.intercept('POST', '**/v1/recipes/search', {
      statusCode: 200,
      body: { exact_matches: [], similar_matches: [], message: 'No results found' }
    }).as('searchRecipes')

    cy.wait('@getRecipes')
    cy.get('.recipes__search').type('chicken')
    cy.wait('@searchRecipes')
    cy.get('.recipes__search-message').should('contain', 'No results found')
  })

  it('should navigate to create recipe', () => {
    cy.intercept('GET', '**/v1/recipes', {
      statusCode: 200,
      body: { recipes: [], pagination: { total: 0, page: 1, limit: 10, offset: 0, pages: 1 } }
    }).as('getRecipes')

    cy.wait('@getRecipes')
    cy.get('a[href="/create"]').click()
    cy.url().should('include', '/create')
    cy.get('h1').should('contain', 'Create New Recipe')
  })

  it('should display empty state when no recipes', () => {
    cy.intercept('GET', '**/v1/recipes', {
      statusCode: 200,
      body: { recipes: [], pagination: { total: 0, page: 1, limit: 10, offset: 0, pages: 1 } }
    }).as('getRecipes')

    cy.wait('@getRecipes')
    cy.get('.recipes__empty').should('exist')
    cy.get('.empty-state h2').should('contain', 'No Recipes Found')
    cy.get('.empty-state p').should('contain', 'There are no recipes yet')
  })

  it('should handle API error', () => {
    cy.intercept('GET', '**/v1/recipes', {
      statusCode: 500,
      body: { message: 'Server error' }
    }).as('getRecipesError')

    cy.wait('@getRecipesError')
    cy.get('.recipes__error').should('exist')
    cy.get('.recipes__error').should('contain', 'Failed to load recipes')
  })

  it('should navigate to recipe detail', () => {
    cy.intercept('GET', '**/v1/recipes', {
      statusCode: 200,
      body: {
        recipes: [
          { 
            id: '1', 
            title: 'Test Recipe', 
            description: 'Test description', 
            ingredients: [], 
            instructions: [], 
            tags: [],
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
        ],
        pagination: { total: 1, page: 1, limit: 10, offset: 0, pages: 1 }
      }
    }).as('getRecipes')

    cy.wait('@getRecipes')
    cy.get('.recipe-card__link').click()
    cy.url().should('include', '/recipes/1')
  })

  it('should handle pagination', () => {
    cy.intercept('GET', '**/v1/recipes', {
      statusCode: 200,
      body: {
        recipes: [
          { 
            id: '1', 
            title: 'Test Recipe', 
            description: 'Test description', 
            ingredients: [], 
            instructions: [], 
            tags: [],
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
        ],
        pagination: { total: 20, page: 1, limit: 10, offset: 0, pages: 2 }
      }
    }).as('getRecipes')

    cy.wait('@getRecipes')
    cy.get('.recipes__pagination').should('exist')
    cy.get('.recipes__page-info').should('contain', 'Page 1 of 2')
    cy.get('button').contains('Previous').should('be.disabled')
    cy.get('button').contains('Next').should('not.be.disabled')
  })
})
