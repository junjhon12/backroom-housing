import mongoose, { Schema, Document } from 'mongoose';

export type HazardClass = 'safe' | 'caution' | 'hostile';

// Explicit interface for the Property payload
export interface IProperty extends Document {
  title: string;
  description: string;
  price: number;
  level: string;
  sector: string;
  hazardClass: HazardClass;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  isAvailable: boolean;
  images: string[];
  host: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    // Location is lore-internal: units are addressed by level and sector, never
    // by a real-world street address.
    level: { type: String, required: true, trim: true },
    sector: { type: String, required: true, trim: true },
    hazardClass: {
      type: String,
      enum: ['safe', 'caution', 'hostile'],
      default: 'safe',
    },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    squareFeet: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true },
    // Cover is images[0]. Photographs are only ever local upload paths, so a
    // client cannot point a listing at an arbitrary external URL.
    images: {
      type: [String],
      default: [],
      validate: [
        {
          validator: (value: string[]) => value.length <= 6,
          message: 'A listing may hold at most 6 photographs',
        },
        {
          validator: (value: string[]) =>
            value.every((url) => /^\/uploads\/[A-Za-z0-9._-]+$/.test(url)),
          message: 'Photographs must be uploaded through the registry',
        },
      ],
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// PERFORMANCE: Text index for highly optimized full-text keyword searches
PropertySchema.index({
  title: 'text',
  level: 'text',
  sector: 'text',
  description: 'text',
});

// Default listing feed: filter by availability, newest first. Without createdAt
// in the index every paginated page falls back to an in-memory sort.
PropertySchema.index({ isAvailable: 1, createdAt: -1 });

// Independent filters. A single compound index can't serve `bedrooms` on its own
// when `price` sits between the shared prefix and that field.
PropertySchema.index({ isAvailable: 1, price: 1 });
PropertySchema.index({ isAvailable: 1, bedrooms: 1 });

// Host dashboard lookups.
PropertySchema.index({ host: 1, createdAt: -1 });

export default mongoose.model<IProperty>('Property', PropertySchema);
