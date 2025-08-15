import { TestUsers } from '../../cypress.config';

export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      loginByUI(user: { username: string, password: string }): Chainable<void>;

      seed(): Chainable<void>;

      logoutIfNeeded(): Chainable<void>;
    }
  }
}


/**
 * Opens /login, fills the form and submits.
 */
Cypress.Commands.add('loginByUI', (user: { username: string, password: string }) => {
  cy.visit('/login');
  // If already logged in, /login page should redirect to /dashboard
  cy.location('pathname').then((path) => {
    if (path === '/dashboard') return; // nothing to do

    // Otherwise, log in
    cy.get('input[name="username"]').should('be.visible').clear().type(user.username);
    cy.get('input[name="password"]').should('be.visible').clear().type(user.password);
    cy.get('button[type="submit"]').first().click();

    cy.url().should('include', '/dashboard');
  });
});

/**
 * Clean up the session if already logged in (prevents interference between tests)
 */
Cypress.Commands.add('logoutIfNeeded', () => {
  // Simplest way: clear domain cookies
  cy.clearCookies();
  cy.visit('/login');
  cy.location('pathname').should('eq', '/login');
});


Cypress.Commands.add('seed', () => {
  cy.task('db:seed').then((users) => {
    Cypress.env('admin', (users as TestUsers).admin);
    Cypress.env('editor', (users as TestUsers).editor);
  });
});
