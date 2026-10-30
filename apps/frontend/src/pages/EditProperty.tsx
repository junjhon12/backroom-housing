import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { PropertyInput } from '../types/property';
import { fetchPropertyById, updatePropertyListing } from '../services/propertyService';
import { useToast } from '../components/ToastProvider';
import PropertyForm from '../components/PropertyForm';
import { Card, Skeleton } from '../components/ui';

const EditProperty: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<PropertyInput | null>(null);

  // Hydrate the form with existing property data
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    const loadData = async () => {
      try {
        const data = await fetchPropertyById(id, controller.signal);
        setInitialValues({
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
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => controller.abort();
  }, [id]);

  const handleSubmit = async (values: PropertyInput) => {
    if (!id) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await updatePropertyListing(id, values);
      showToast('Listing updated', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="mx-auto mt-4 w-full max-w-2xl space-y-4 p-8">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-11 w-full" />
      </Card>
    );
  }

  return (
    <Card className="mx-auto mt-4 w-full max-w-2xl p-8">
      <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">003 — Amend listing</p>
      <h1 className="mt-2 font-display text-4xl uppercase leading-none">Edit listing</h1>

      {error && (
        <div role="alert" className="mt-6 border border-magenta bg-magenta/10 px-4 py-3 text-sm text-magenta">
          {error}
        </div>
      )}

      <div className="mt-6">
        {initialValues && (
          <PropertyForm
            initialValues={initialValues}
            submitLabel="Save changes"
            submittingLabel="Saving…"
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/dashboard')}
            showStatus
          />
        )}
      </div>
    </Card>
  );
};

export default EditProperty;
