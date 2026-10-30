import React from 'react';
import { Link } from 'react-router-dom';
import { buttonStyles } from '../components/ui';

const NotFound: React.FC = () => {
  return (
    <div className="mx-auto max-w-xl border border-ink bg-cream">
      <div className="aspect-[16/7] w-full border-b border-ink bg-paper-deep">
        <img
          src="/scenes/corridor.svg"
          alt="A corridor receding into darkness"
          className="h-full w-full object-cover contrast-125 saturate-50"
        />
      </div>

      <div className="px-6 py-12 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">Error 404 · Unmapped</p>
        <p className="mt-4 font-display text-5xl uppercase leading-none md:text-6xl">
          Sector not found
        </p>

        <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-ink/70">
          You have walked past the mapped boundary. This sector is not on file, and the lights
          here are not connected to the grid.
        </p>

        <Link to="/" className={`${buttonStyles()} mt-8`}>
          Return to Level 0
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
