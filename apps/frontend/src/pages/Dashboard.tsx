import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Property } from '../types/property';
import { fetchMyProperties, deletePropertyListing } from '../services/propertyService';

const Dashboard: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const loadData = async () => {
      try {
        const data = await fetchMyProperties(controller.signal);
        setProperties(data);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    return () => controller.abort();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this listing?')) return;
    
    try {
      await deletePropertyListing(id);
      // Optimistic UI Update: Filter out the deleted property without reloading
      setProperties(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (loading) return <div className="py-20 text-center animate-pulse text-slate-500">Loading dashboard...</div>;
  if (error) return <div className="py-20 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-6 mt-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Host Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage your Backroom housing listings.</p>
        </div>
        <Link to="/property/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          + New Listing
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 mb-4">You haven't posted any listings yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {properties.map(property => (
            <div key={property._id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <Link to={`/property/${property._id}`} className="text-xl font-bold text-slate-800 hover:text-indigo-600 transition-colors">
                  {property.title}
                </Link>
                <div className="text-sm text-slate-500 mt-1">
                  ${property.price} • {property.location} • {property.isAvailable ? 'Active' : 'Hidden'}
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleDelete(property._id)}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;