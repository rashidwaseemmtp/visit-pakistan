import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DestinationCard } from './DestinationCard';

describe('DestinationCard', () => {
  it('renders the destination name as the card heading', () => {
    render(<DestinationCard destination={{ slug: 'hunza', name: 'Hunza' }} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Hunza' })).toBeInTheDocument();
  });

  it('names the card with its heading', () => {
    render(<DestinationCard destination={{ slug: 'hunza', name: 'Hunza' }} />);

    expect(screen.getByRole('article', { name: 'Hunza' })).toBeInTheDocument();
  });

  it('renders the province and the category exactly as the content file supplies them', () => {
    render(
      <DestinationCard
        destination={{
          slug: 'example-place',
          name: 'Example Place',
          province: 'Example Province',
          category: 'Mountains & Lakes — Ḥigh',
        }}
      />,
    );

    expect(screen.getByText('Province')).toBeInTheDocument();
    expect(screen.getByText('Example Province')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Mountains & Lakes — Ḥigh')).toBeInTheDocument();
  });

  it('leaves out the facts the content file does not carry, with no empty label', () => {
    const { container } = render(<DestinationCard destination={{ slug: 'hunza', name: 'Hunza' }} />);

    expect(screen.queryByText('Province')).not.toBeInTheDocument();
    expect(screen.queryByText('Category')).not.toBeInTheDocument();
    expect(container.querySelector('dl')).toBeNull();
  });

  it('renders the fact that is present when the other is absent', () => {
    render(
      <DestinationCard
        destination={{ slug: 'example', name: 'Example', province: 'Example Province' }}
      />,
    );

    expect(screen.getByText('Example Province')).toBeInTheDocument();
    expect(screen.queryByText('Category')).not.toBeInTheDocument();
  });

  it('renders HTML-like content as text rather than as markup', () => {
    const { container } = render(
      <DestinationCard
        destination={{
          slug: 'example',
          name: '<script>alert(1)</script> Example',
          category: '<b>Bold</b>',
        }}
      />,
    );

    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      '<script>alert(1)</script> Example',
    );
    expect(screen.getByText('<b>Bold</b>')).toBeInTheDocument();
  });
});
