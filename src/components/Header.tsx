import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-header__brand" to="/">
          Visit Pakistan
        </Link>
        {/* The favourites count (US-6) joins this header. */}
      </div>
    </header>
  );
}
