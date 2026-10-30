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
          level: data.level,
          sector: data.sector,
          hazardClass: data.hazardClass,
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
      showToast('File amended', 'success');
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
      <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">Form 04 — Amendment</p>
      <h1 className="mt-2 font-display text-4xl uppercase leading-none">Amend file</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink/70">
        Amendments are recorded against the original file. Photographs cannot be replaced once
        filed.
      </p>

      {error && (
        <div role="alert" className="mt-6 border border-signal bg-signal/10 px-4 py-3 text-sm text-signal">
          {error}
        </div>
      )}

      <div className="mt-6 border-t border-ink/20 pt-6">
        {initialValues && (
          <PropertyForm
            initialValues={initialValues}
            submitLabel="Save amendment"
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
