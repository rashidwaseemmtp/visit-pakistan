import { Link } from 'react-router-dom';

/**
 * Minimal fallback so an unknown route is never a blank page. The full not-found
 * behaviour, including 404.html on GitHub Pages, is US-3.
 */
export function NotFoundPage() {
  return (
    <div className="page">
      <h1 className="page__title">Page not found</h1>
      <p className="page__intro">The page you asked for does not exist.</p>
      <Link className="link" to="/">
        Back to the destination list
      </Link>
    </div>
  );
}
