import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="text-center py-24">
      <p className="text-6xl font-bold text-indigo-600 mb-4">404</p>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Page not found</h1>
      <p className="text-slate-600 mb-8">
        The page or listing you're looking for doesn't exist or has been removed.
      </p>
      <Link
        to="/"
        className="inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
      >
        Back to listings
      </Link>
    </div>
  );
};

export default NotFound;
