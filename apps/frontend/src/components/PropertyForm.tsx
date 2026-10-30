import { useState, type ChangeEvent, type FC, type FormEvent } from 'react';
import type { PropertyInput } from '../types/property';
import { ImageField } from './ImageField';
import { Button, Field, Input, Select, Textarea } from './ui';

interface PropertyFormProps {
  initialValues: PropertyInput;
  submitLabel: string;
  submittingLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: PropertyInput) => void;
  onCancel?: () => void;
  showStatus?: boolean;
}

const PropertyForm: FC<PropertyFormProps> = ({
  initialValues,
  submitLabel,
  submittingLabel,
  isSubmitting,
  onSubmit,
  onCancel,
  showStatus = false,
}) => {
  const [values, setValues] = useState<PropertyInput>(initialValues);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;

    setValues((previous) => ({
      ...previous,
      [name]:
        name === 'isAvailable'
          ? value === 'true'
          : type === 'number'
            ? Number(value)
            : value,
    }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink/70">
          Photographs
        </p>
        <ImageField
          images={values.images}
          onChange={(images) => setValues((previous) => ({ ...previous, images }))}
          onUploadingChange={setIsUploading}
        />
        <p className="text-[11px] leading-relaxed text-ink/60">
          Up to six. JPG, PNG or WebP, 5 MB each. The first is used as the cover.
        </p>
      </div>

      <Field label="File title" htmlFor="property-title">
        <Input
          id="property-title"
          name="title"
          required
          value={values.title}
          onChange={handleChange}
          placeholder="The Lobby, Reclaimed"
        />
      </Field>

      <Field
        label="Field notes"
        htmlFor="property-description"
        hint="Describe the space honestly. Applicants are entitled to know about the hum."
      >
        <Textarea
          id="property-description"
          name="description"
          required
          rows={4}
          value={values.description}
          onChange={handleChange}
          placeholder="Damp carpet, steady fluorescent light, no windows. One door that should not be opened."
        />
      </Field>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Field label="Level" htmlFor="property-level" hint="e.g. Level 0">
          <Input
            id="property-level"
            name="level"
            required
            value={values.level}
            onChange={handleChange}
            placeholder="Level 0"
          />
        </Field>

        <Field label="Sector" htmlFor="property-sector" hint="e.g. Sector B-12">
          <Input
            id="property-sector"
            name="sector"
            required
            value={values.sector}
            onChange={handleChange}
            placeholder="Sector B-12"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
        <Field label="Rent ($ / month)" htmlFor="property-price">
          <Input
            id="property-price"
            name="price"
            type="number"
            min="0"
            required
            value={values.price}
            onChange={handleChange}
          />
        </Field>

        <Field label="Bedrooms" htmlFor="property-bedrooms">
          <Input
            id="property-bedrooms"
            name="bedrooms"
            type="number"
            min="0"
            required
            value={values.bedrooms}
            onChange={handleChange}
          />
        </Field>

        <Field label="Bathrooms" htmlFor="property-bathrooms">
          <Input
            id="property-bathrooms"
            name="bathrooms"
            type="number"
            min="0"
            required
            value={values.bathrooms}
            onChange={handleChange}
          />
        </Field>

        <Field label="Area (sq ft)" htmlFor="property-square-feet">
          <Input
            id="property-square-feet"
            name="squareFeet"
            type="number"
            min="0"
            required
            value={values.squareFeet}
            onChange={handleChange}
          />
        </Field>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${showStatus ? 'md:grid-cols-2' : ''}`}>
        <Field
          label="Hazard class"
          htmlFor="property-hazard"
          hint="Applicants see this classification before they request the file."
        >
          <Select
            id="property-hazard"
            name="hazardClass"
            value={values.hazardClass}
            onChange={handleChange}
          >
            <option value="safe">Safe</option>
            <option value="caution">Caution</option>
            <option value="hostile">Hostile</option>
          </Select>
        </Field>

        {showStatus && (
          <Field label="Filing status" htmlFor="property-status">
            <Select
              id="property-status"
              name="isAvailable"
              value={values.isAvailable.toString()}
              onChange={handleChange}
            >
              <option value="true">Open</option>
              <option value="false">Withdrawn</option>
            </Select>
          </Field>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-ink/20 pt-6 sm:flex-row">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="sm:w-1/3">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || isUploading} className="flex-1">
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default PropertyForm;
