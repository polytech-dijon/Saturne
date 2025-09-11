describe('Home /', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.logoutIfNeeded();
  });

  it('Root loads without redirection and layout is rendered', () => {
    cy.visit('/');

    // No middleware redirection
    cy.location('pathname').should('eq', '/');

    cy.get('main').should('exist');

    // Main structure: Divia / Carousel / Footer
    cy.get('[data-testid="divia-card"], [data-testid="divia-skeleton"]').should('exist');
    cy.get('[data-testid="poster-carousel"]').should('exist');
    cy.get('[data-testid="footer"]').should('exist');
  });

  it('shows a carousel skeleton first, then the carousel (≥ 1 slide)', () => {
    cy.visit('/');

    // If a skeleton is present, it must disappear before the carousel replaces it
    cy.get('body').then(($body) => {
      const hasSkeleton = $body.find('[data-testid="skeleton-carousel"]').length > 0;
      if (hasSkeleton) {
        cy.get('[data-testid="skeleton-carousel"]').should('be.visible');
        // Wait for the skeleton to disappear (Suspense resolved)
        cy.get('[data-testid="skeleton-carousel"]', { timeout: 15000 }).should('not.exist');
      }
    });

    cy.get('[data-testid="poster-carousel"]').should('be.visible');

    // At least 1 slide
    cy.get('[data-testid="poster-carousel"] [aria-roledescription="slide"]').its('length').should('be.greaterThan', 0);
  });

  it('shows a Divia skeleton first, then renders the data card', () => {
    // Force the server action to delay before returning valid data
    cy.setCookie('divia-test', 'delay');

    cy.visit('/');

    // Skeleton visible initially, card not there yet
    cy.get('[data-testid="divia-skeleton"]').should('be.visible');
    cy.get('[data-testid="divia-card"]').should('not.exist');
    cy.get('[data-testid="divia-error"]').should('not.exist');

    // After the delay, the skeleton disappears and the card appears
    cy.get('[data-testid="divia-skeleton"]').should('not.exist');
    cy.get('[data-testid="divia-card"]').should('be.visible');

    cy.clearCookie('divia-test');
  });
});

describe('Divia error paths', () => {
  beforeEach(() => {
    cy.logoutIfNeeded?.();
    cy.clock(); // avoid the 30s interval running repeatedly
  });

  it('shows an error alert when the server action returns a failure', () => {
    cy.setCookie('divia-test', 'error');
    cy.visit('/');

    cy.get('[data-testid="divia-error"]').should('be.visible').within(() => {
      cy.contains('Erreur lors du chargement des données de transport');
      cy.contains('Impossible de charger les données de transport');
    });
    cy.get('[data-testid="divia-card"]').should('not.exist');

    cy.clearCookie('divia-test');
  });

  it('shows an error alert when station data are incomplete (length !== 3)', () => {
    cy.setCookie('divia-test', 'incomplete');
    cy.visit('/');

    cy.get('[data-testid="divia-error"]').should('be.visible').within(() => {
      cy.contains('Erreur lors du chargement des données de transport');
      cy.contains('Données de station incomplètes reçues.');
    });

    cy.clearCookie('divia-test');
  });

  it('recovers from error on next refresh', () => {
    cy.setCookie('divia-test', 'error');
    cy.visit('/');

    cy.get('[data-testid="divia-error"]').should('be.visible');

    // Switch to the OK state
    cy.clearCookie('divia-test');

    // Advance the interval so `loadDiviaData` runs again
    cy.tick(30000);

    cy.get('[data-testid="divia-error"]').should('not.exist');
    cy.get('[data-testid="divia-card"], [data-testid="divia-skeleton"]').should('be.visible');
  });
});
