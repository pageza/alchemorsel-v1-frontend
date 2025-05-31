
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: '/v1/users/login',
    body: { email, password }
  }).then((response) => {
    window.localStorage.setItem('auth_token', response.body.token)
  })
})

export {}
