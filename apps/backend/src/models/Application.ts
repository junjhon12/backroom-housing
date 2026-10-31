import mongoose, { Document, Schema } from 'mongoose';

export type ApplicationStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';

export interface IApplication extends Document {
  property: mongoose.Types.ObjectId;
  applicant: mongoose.Types.ObjectId;
  // Denormalised so the host inbox can be queried without joining Property.
  host: mongoose.Types.ObjectId;
  message: string;
  moveInDate?: Date;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    moveInDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'withdrawn'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// One application per applicant per unit. The unique index is the authoritative
// guard; the controller also checks first so the common case returns a friendly
// message instead of a duplicate-key error.
ApplicationSchema.index({ property: 1, applicant: 1 }, { unique: true });

// Host inbox: filter by owner and status, newest first.
ApplicationSchema.index({ host: 1, status: 1, createdAt: -1 });

// Renter's own application history.
ApplicationSchema.index({ applicant: 1, createdAt: -1 });

export default mongoose.model<IApplication>('Application', ApplicationSchema);
