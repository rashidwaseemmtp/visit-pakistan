import type { Destination } from '../content/schema';

interface DestinationCardProps {
  readonly destination: Destination;
}

interface DestinationFact {
  readonly label: string;
  readonly value: string;
}

function isPresent(fact: { label: string; value?: string }): fact is DestinationFact {
  return typeof fact.value === 'string' && fact.value.length > 0;
}

/**
 * Every value comes straight from data/destinations.json and is rendered as text.
 * A field the file omits is left out entirely — no empty label, no placeholder.
 */
export function DestinationCard({ destination }: DestinationCardProps) {
  const headingId = `destination-${destination.slug}`;
  const facts = [
    { label: 'Province', value: destination.province },
    { label: 'Category', value: destination.category },
  ].filter(isPresent);

  return (
    <article className="destination-card" aria-labelledby={headingId}>
      <h2 className="destination-card__name" id={headingId}>
        {destination.name}
      </h2>
      {facts.length > 0 ? (
        <dl className="destination-card__facts">
          {facts.map((fact) => (
            <div className="destination-card__fact" key={fact.label}>
              <dt className="destination-card__fact-label">{fact.label}</dt>
              <dd className="destination-card__fact-value">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  );
}
