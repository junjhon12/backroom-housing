import mongoose, { Schema, Document } from 'mongoose';

// Explicit interface for the Property payload
export interface IProperty extends Document {
  title: string;
  description: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  isAvailable: boolean;
  imageUrl?: string;
  host: string;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    location: { type: String, required: true, trim: true },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    squareFeet: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true },
    imageUrl: { type: String, trim: true },
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
PropertySchema.index({ title: 'text', location: 'text', description: 'text' });

// PERFORMANCE: Compound index for filtering active listings by price or bedrooms
PropertySchema.index({ isAvailable: 1, price: 1, bedrooms: 1 });

export default mongoose.model<IProperty>('Property', PropertySchema);