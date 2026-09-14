import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';
import { EXPECTED_DESTINATION_NAMES } from './content/expectedDestinations';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App', () => {
  it('renders the skip link, the header and the main landmark', () => {
    renderAt('/');

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('shows the destination list on the home route', () => {
    renderAt('/');

    expect(screen.getAllByRole('listitem')).toHaveLength(EXPECTED_DESTINATION_NAMES.length);
  });

  it('shows a not-found page rather than a blank page on an unknown route', () => {
    renderAt('/nowhere');

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
  });
});
