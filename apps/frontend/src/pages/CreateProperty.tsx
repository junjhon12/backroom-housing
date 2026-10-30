import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PropertyInput } from '../types/property';
import { createPropertyListing, uploadImage } from '../services/propertyService';
import { useToast } from '../components/ToastProvider';
import PropertyForm from '../components/PropertyForm';
import { Card, Field } from '../components/ui';

const EMPTY_PROPERTY: PropertyInput = {
  title: '',
  description: '',
  price: 0,
  location: '',
  bedrooms: 0,
  bathrooms: 0,
  squareFeet: 0,
  isAvailable: true,
};

const CreateProperty: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (values: PropertyInput) => {
    setError(null);
    setIsSubmitting(true);

    try {
      let imageUrl: string | undefined;

      // Pass 1: Upload the image if one was selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      // Pass 2: Submit the JSON payload with the new URL
      const newProperty = await createPropertyListing({
        ...values,
        ...(imageUrl && { imageUrl }),
      });

      showToast('Listing published', 'success');
      navigate(`/property/${newProperty._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto mt-4 w-full max-w-2xl p-8">
      <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">003 — New listing</p>
      <h1 className="mt-2 font-display text-4xl uppercase leading-none">Post a listing</h1>

      {error && (
        <div role="alert" className="mt-6 border border-magenta bg-magenta/10 px-4 py-3 text-sm text-magenta">
          {error}
        </div>
      )}

      <div className="mt-6">
        <Field
          label="Property image"
          htmlFor="property-image"
          hint="JPG, PNG or WebP. Maximum 5 MB."
        >
          <input
            id="property-image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full border border-ink bg-cream p-2 text-xs text-ink/70 file:mr-4 file:border-0 file:bg-ink file:px-3 file:py-2 file:text-[10px] file:uppercase file:tracking-[0.14em] file:text-cream hover:file:bg-magenta"
          />
        </Field>
      </div>

      <div className="mt-6 border-t border-ink/20 pt-6">
        <PropertyForm
          initialValues={EMPTY_PROPERTY}
          submitLabel="Publish listing"
          submittingLabel="Publishing…"
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/dashboard')}
        />
      </div>
    </Card>
  );
};

export default CreateProperty;
