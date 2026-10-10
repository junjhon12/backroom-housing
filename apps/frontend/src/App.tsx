import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const Home: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[80vh]">
    <h1 className="text-4xl font-bold text-slate-800 mb-4">Backroom Housing</h1>
    <p className="text-lg text-slate-600">Find your next space.</p>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <nav className="p-4 bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link to="/" className="text-xl font-bold text-indigo-600">Backroom</Link>
            <div className="space-x-4">
              <Link to="/" className="text-slate-600 hover:text-indigo-600 transition-colors">Home</Link>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;