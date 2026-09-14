import { ContentErrorState } from '../components/ContentErrorState';
import { DestinationFinder } from '../components/DestinationFinder';
import { destinationContent, type DestinationContent } from '../content/destinations';

interface HomePageProps {
  /** Injectable so the error path is testable; defaults to the real content file. */
  readonly content?: DestinationContent;
}

export function HomePage({ content = destinationContent }: HomePageProps) {
  return (
    <div className="page">
      <h1 className="page__title">Destinations</h1>
      <p className="page__intro">
        Every destination we cover, on one page. Search by name, or narrow the list by province and
        category.
      </p>
      {content.status === 'ok' ? (
        <DestinationFinder destinations={content.destinations} />
      ) : (
        <ContentErrorState detail={content.detail} />
      )}
    </div>
  );
}
