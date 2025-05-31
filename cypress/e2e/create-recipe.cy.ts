describe('Create Recipe Flow', () => {
  beforeEach(() => {
    window.localStorage.setItem('auth_token', 'test-token')
    cy.visit('/create')
  })

  it('should render create recipe form', () => {
    cy.get('h1').should('contain', 'Create New Recipe')
    cy.get('textarea#query').should('exist')
    cy.get('button[type="submit"]').should('contain', 'Generate Recipe')
    cy.get('.form-hint').should('exist')
  })

  it('should generate recipe successfully', () => {
    cy.intercept('POST', '**/v1/recipes', {
      statusCode: 200,
      body: { 
        recipe: { 
          id: 'recipe-123', 
          title: 'Generated Chicken Recipe',
          description: 'A delicious chicken dish',
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
        }, 
        status: 'success' 
      }
    }).as('generateRecipe')

    cy.get('textarea#query').type('chicken and vegetables dish')
    cy.get('button[type="submit"]').click()

    cy.wait('@generateRecipe')
    cy.url().should('include', '/recipes/recipe-123')
  })

  it('should display error on generation failure', () => {
    cy.intercept('POST', '**/v1/recipes', {
      statusCode: 400,
      body: { message: 'Invalid recipe request' }
    }).as('generateRecipeError')

    cy.get('textarea#query').type('invalid request')
    cy.get('button[type="submit"]').click()

    cy.wait('@generateRecipeError')
    cy.get('.error-message').should('contain', 'Invalid recipe request')
  })

  it('should display loading state during generation', () => {
    cy.intercept('POST', '**/v1/recipes', {
      statusCode: 200,
      body: { recipe: { id: 'recipe-123', title: 'Test Recipe' }, status: 'success' },
      delay: 1000
    }).as('slowGeneration')

    cy.get('textarea#query').type('test recipe')
    cy.get('button[type="submit"]').click()

    cy.get('.loading-state').should('exist')
    cy.get('.loading-spinner').should('exist')
    cy.get('button[type="submit"]').should('contain', 'Creating Recipe...')
    cy.get('textarea#query').should('be.disabled')

    cy.wait('@slowGeneration')
    cy.url().should('include', '/recipes/recipe-123')
  })

  it('should validate required fields', () => {
    cy.get('button[type="submit"]').click()
    
    cy.get('textarea#query:invalid').should('exist')
  })

  it('should respect character limits', () => {
    cy.get('textarea#query').should('have.attr', 'minlength', '2')
    cy.get('textarea#query').should('have.attr', 'maxlength', '500')
  })

  it('should handle network errors', () => {
    cy.intercept('POST', '**/v1/recipes', {
      forceNetworkError: true
    }).as('networkError')

    cy.get('textarea#query').type('test recipe')
    cy.get('button[type="submit"]').click()

    cy.wait('@networkError')
    cy.get('.error-message').should('contain', 'Failed to create recipe')
  })
})
