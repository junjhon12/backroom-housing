import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PropertyInput } from '../types/property';
import { createPropertyListing } from '../services/propertyService';

const CreateProperty: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const newProperty = await createPropertyListing(formData);
      navigate(`/property/${newProperty._id}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200 mt-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Post a New Listing</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`w-full py-3 rounded-lg text-white font-semibold transition-all ${isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {isSubmitting ? 'Publishing...' : 'Publish Listing'}
        </button>
      </form>
    </div>
  );
};

export default CreateProperty;