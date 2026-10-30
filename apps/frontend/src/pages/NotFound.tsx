import React from 'react';
import { Link } from 'react-router-dom';
import { buttonStyles } from '../components/ui';

const NotFound: React.FC = () => {
  return (
    <div className="mx-auto max-w-xl border border-ink bg-cream px-6 py-16 text-center">
      <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">Error 404</p>
      <p className="mt-4 font-display text-7xl uppercase leading-none">No record</p>

      <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-ink/70">
        This page or listing is not on file. It may have been removed, or the reference
        number is wrong.
      </p>

      <Link to="/" className={`${buttonStyles()} mt-8`}>
        Back to listings
      </Link>
    </div>
  );
};

export default NotFound;
