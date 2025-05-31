describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('should login successfully', () => {
    cy.intercept('POST', '/v1/users/login', {
      statusCode: 200,
      body: { token: 'test-token', user: { id: '1', name: 'Test User', email: 'test@example.com' } }
    }).as('login')

    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').type('password123')
    cy.get('button[type="submit"]').click()

    cy.wait('@login')
    cy.url().should('include', '/recipes')
  })

  it('should register successfully', () => {
    cy.visit('/register')
    
    cy.intercept('POST', '/v1/users', {
      statusCode: 200,
      body: { token: 'test-token', user: { id: '1', name: 'Test User', email: 'test@example.com' } }
    }).as('register')

    cy.get('input#name').type('Test User')
    cy.get('input#email').type('test@example.com')
    cy.get('input#password').type('password123')
    cy.get('input#confirmPassword').type('password123')
    cy.get('button[type="submit"]').click()

    cy.wait('@register')
    cy.url().should('include', '/recipes')
  })

  it('should display error for invalid credentials', () => {
    cy.intercept('POST', '/v1/users/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials' }
    }).as('loginError')

    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()

    cy.wait('@loginError')
    cy.get('.alert-danger').should('contain', 'Failed to sign in')
  })

  it('should validate password confirmation on register', () => {
    cy.visit('/register')

    cy.get('input#name').type('Test User')
    cy.get('input#email').type('test@example.com')
    cy.get('input#password').type('password123')
    cy.get('input#confirmPassword').type('different-password')
    cy.get('button[type="submit"]').click()

    cy.get('.alert-danger').should('contain', 'Passwords do not match')
  })

  it('should navigate between login and register pages', () => {
    cy.get('a[href="/register"]').click()
    cy.url().should('include', '/register')
    cy.get('h1').should('contain', 'Create Account')

    cy.get('a[href="/login"]').click()
    cy.url().should('include', '/login')
    cy.get('h1').should('contain', 'Sign In')
  })

  it('should disable form during login submission', () => {
    cy.intercept('POST', '/v1/users/login', {
      statusCode: 200,
      body: { token: 'test-token', user: { id: '1', name: 'Test User', email: 'test@example.com' } },
      delay: 1000
    }).as('slowLogin')

    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').type('password123')
    cy.get('button[type="submit"]').click()

    cy.get('button[type="submit"]').should('contain', 'Signing in...')
    cy.get('input[type="email"]').should('be.disabled')
    cy.get('input[type="password"]').should('be.disabled')

    cy.wait('@slowLogin')
    cy.url().should('include', '/recipes')
  })
})
