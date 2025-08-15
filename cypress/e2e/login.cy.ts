describe('Login /login', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.logoutIfNeeded();
  });

  it('allows access to /login when logged out', () => {
    cy.visit('/login');
    cy.location('pathname').should('eq', '/login');
    cy.get('input[name="username"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('exist');
  });

  it('displays Zod errors when submitting empty form', () => {
    cy.visit('/login');
    cy.get('button[type="submit"]').click();

    cy.contains(/Le nom d’utilisateur est requis/i).should('be.visible');
  });

  it('preserves username value after failed submit without password', () => {
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('button[type="submit"]').click();

    cy.contains(/Le mot de passe doit contenir au moins 8 caractères/i).should('be.visible');
    cy.get('input[name="username"]').should('have.value', 'admin');
  });

  it('displays error when password is invalid', () => {
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('wrong-password{enter}');

    cy.contains(/Mauvais identifiant ou mot de passe/i).should('be.visible');
  });

  it('logs in and redirects to /dashboard', () => {
    cy.loginByUI(Cypress.env('admin'));
    cy.location('pathname').should('eq', '/dashboard');
  });

  it('redirects to /dashboard when visiting /login while already logged in', () => {
    cy.loginByUI(Cypress.env('admin'));
    cy.visit('/login');
    cy.location('pathname').should('eq', '/dashboard');
  });

  it('opens and closes "Forgot password?" dialog', () => {
    cy.logoutIfNeeded();
    cy.visit('/login');

    cy.contains(/Mot de passe oublié ?/i).then(($el) => {
      if ($el && ($el as string).length) {
        cy.wrap($el).click();
        cy.contains(/Fermer/i).click();
      }
    });
  });
});
