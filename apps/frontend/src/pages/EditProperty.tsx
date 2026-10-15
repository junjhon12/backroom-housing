import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { PropertyInput } from '../types/property';
import { fetchPropertyById, updatePropertyListing } from '../services/propertyService';

const EditProperty: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<PropertyInput>({
    title: '',
    description: '',
    price: 0,
    location: '',
    bedrooms: 0,
    bathrooms: 0,
    squareFeet: 0,
    isAvailable: true,
  });

  // Hydrate the form with existing property data
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    const loadData = async () => {
      try {
        const data = await fetchPropertyById(id, controller.signal);
        setFormData({
          title: data.title,
          description: data.description,
          price: data.price,
          location: data.location,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          squareFeet: data.squareFeet,
          isAvailable: data.isAvailable,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError('Failed to load property details.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    return () => controller.abort();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'isAvailable') {
      setFormData(prev => ({ ...prev, isAvailable: value === 'true' }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setError(null);
    setIsSubmitting(true);

    try {
      await updatePropertyListing(id, formData);
      navigate('/dashboard'); // Return to dashboard on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="py-20 text-center animate-pulse text-slate-500">Loading editor...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200 mt-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Edit Listing</h1>
      
      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
          <input required type="text" name="title" value={formData.title} onChange={handleChange} 
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea required name="description" value={formData.description} onChange={handleChange} rows={4}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
            <input required type="number" min="0" name="price" value={formData.price} onChange={handleChange} 
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <input required type="text" name="location" value={formData.location} onChange={handleChange} 
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bedrooms</label>
            <input required type="number" min="0" name="bedrooms" value={formData.bedrooms} onChange={handleChange} 
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bathrooms</label>
            <input required type="number" min="0" name="bathrooms" value={formData.bathrooms} onChange={handleChange} 
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Square Feet</label>
            <input required type="number" min="0" name="squareFeet" value={formData.squareFeet} onChange={handleChange} 
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select name="isAvailable" value={formData.isAvailable.toString()} onChange={handleChange}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
              <option value="true">Active</option>
              <option value="false">Hidden</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={() => navigate('/dashboard')}
            className="w-1/3 py-3 rounded-lg text-slate-700 bg-slate-100 font-semibold hover:bg-slate-200 transition-all">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            className={`w-2/3 py-3 rounded-lg text-white font-semibold transition-all ${isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProperty;