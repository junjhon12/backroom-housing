import { useState, type ChangeEvent, type FC, type FormEvent } from 'react';
import type { PropertyInput } from '../types/property';
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
      <Field label="Title" htmlFor="property-title">
        <Input
          id="property-title"
          name="title"
          required
          value={values.title}
          onChange={handleChange}
          placeholder="Modern Downtown Loft"
        />
      </Field>

      <Field label="Description" htmlFor="property-description">
        <Textarea
          id="property-description"
          name="description"
          required
          rows={4}
          value={values.description}
          onChange={handleChange}
          placeholder="Describe the space, the light, the noise level."
        />
      </Field>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Field label="Price ($)" htmlFor="property-price">
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

        <Field label="Location" htmlFor="property-location">
          <Input
            id="property-location"
            name="location"
            required
            value={values.location}
            onChange={handleChange}
            placeholder="Downtown Tech District"
          />
        </Field>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${showStatus ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
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

        <Field label="Square feet" htmlFor="property-square-feet">
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

        {showStatus && (
          <Field label="Status" htmlFor="property-status">
            <Select
              id="property-status"
              name="isAvailable"
              value={values.isAvailable.toString()}
              onChange={handleChange}
            >
              <option value="true">Active</option>
              <option value="false">Hidden</option>
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
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default PropertyForm;
