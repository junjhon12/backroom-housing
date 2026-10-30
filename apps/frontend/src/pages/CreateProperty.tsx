import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PropertyInput } from '../types/property';
import { createPropertyListing } from '../services/propertyService';
import { useToast } from '../components/ToastProvider';
import PropertyForm from '../components/PropertyForm';
import { Card } from '../components/ui';

const EMPTY_PROPERTY: PropertyInput = {
  title: '',
  description: '',
  price: 0,
  level: '',
  sector: '',
  hazardClass: 'safe',
  bedrooms: 0,
  bathrooms: 0,
  squareFeet: 0,
  isAvailable: true,
  images: [],
};

const CreateProperty: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: PropertyInput) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const newProperty = await createPropertyListing(values);

      showToast('File released to the directory', 'success');
      navigate(`/property/${newProperty._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto mt-4 w-full max-w-2xl p-8">
      <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">Form 03 — New file</p>
      <h1 className="mt-2 font-display text-4xl uppercase leading-none">Register a unit</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink/70">
        Only surveyed units may be filed. The Registry may inspect at any time.
      </p>

      {error && (
        <div role="alert" className="mt-6 border border-signal bg-signal/10 px-4 py-3 text-sm text-signal">
          {error}
        </div>
      )}

      <div className="mt-6 border-t border-ink/20 pt-6">
        <PropertyForm
          initialValues={EMPTY_PROPERTY}
          submitLabel="Release file"
          submittingLabel="Filing…"
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/dashboard')}
        />
      </div>
    </Card>
  );
};

export default CreateProperty;
