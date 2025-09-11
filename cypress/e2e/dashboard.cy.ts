describe('Dashboard', () => {
  it('Redirects to /login when not authenticated', () => {
    cy.clearCookies();
    cy.visit('/dashboard');

    cy.location('pathname').should('eq', '/login');

    // Check that callbackUrl contains /dashboard (encoded or not)
    cy.location('search').then((search) => {
      const params = new URLSearchParams(search);
      const raw = params.get('callbackUrl') || '';
      const decoded = decodeURIComponent(raw);
      expect(decoded).to.contain('/dashboard');
    });
  });

  it('After login, displays "Bonjour, {name}" (session.user.name)', function () {
    cy.loginByUI(Cypress.env('admin'));

    cy.visit('/dashboard');

    cy.contains(`Bonjour, ${Cypress.env('admin').username}`).should('exist');
  });
});
