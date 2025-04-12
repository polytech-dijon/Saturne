import { render } from '@testing-library/react';
import RootLayout from '@/app/layout';

describe('RootLayout', () => {
  beforeEach(() => {
    render(
      <RootLayout>
        <div>Test Child</div>
      </RootLayout>,
      { container: document },
    );
  });

  it('renders children correctly', () => expect(document.body).toHaveTextContent('Test Child'));

  it('sets the correct HTML language attribute', () => expect(document.documentElement.lang).toBe('fr'));
});
