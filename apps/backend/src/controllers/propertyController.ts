import { Request, Response } from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Property, { IProperty } from '../models/Property';
import User from '../models/User';
import { UPLOADS_DIR } from '../config/paths';

// Explicit interface for API response
interface ApiResponse<T> {
  success: boolean;
  data?: T | T[];
  error?: string;
}

// The only fields a client may set. Everything else — most importantly `host` —
// is derived from the verified token or managed by the server, so a request body
// can never reassign ownership or smuggle in update operators.
const EDITABLE_FIELDS = [
  'title',
  'description',
  'price',
  'location',
  'bedrooms',
  'bathrooms',
  'squareFeet',
  'isAvailable',
  'imageUrl',
] as const;

const pickEditableFields = (body: Record<string, unknown>): Record<string, unknown> => {
  const fields: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) {
      fields[field] = body[field];
    }
  }
  return fields;
};

export const getProperties = async (req: Request, res: Response<ApiResponse<IProperty>>): Promise<void> => {
  try {
    const { keyword, minPrice, maxPrice, bedrooms } = req.query;
    
    const dbQuery: Record<string, any> = { isAvailable: true };

    // Utilize the MongoDB Text Index instead of $regex for O(log N) performance
    if (keyword) {
      dbQuery.$text = { $search: keyword as string };
    }

    if (minPrice || maxPrice) {
      dbQuery.price = {};
      if (minPrice) dbQuery.price.$gte = Number(minPrice);
      if (maxPrice) dbQuery.price.$lte = Number(maxPrice);
    }

    if (bedrooms) {
      dbQuery.bedrooms = { $gte: Number(bedrooms) };
    }

    // If utilizing $text, MongoDB can also sort by textScore relevance, but we'll default to newest
    const properties = await Property.find(dbQuery).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: properties });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ success: false, error: errorMessage });
  }
};

export const getPropertyById = async (req: Request, res: Response<ApiResponse<IProperty>>): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, error: 'Invalid property ID format' });
      return;
    }

    const property = await Property.findById(id);

    if (!property) {
      res.status(404).json({ success: false, error: 'Property not found' });
      return;
    }

    res.status(200).json({ success: true, data: property });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ success: false, error: errorMessage });
  }
};

export const getPropertiesByHost = async (req: Request, res: Response<ApiResponse<IProperty>>): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    // Find all properties where the host ID matches the logged-in user's ID
    const properties = await Property.find({ host: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: properties });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ success: false, error: errorMessage });
  }
};

export const createProperty = async (req: Request, res: Response<ApiResponse<IProperty>>): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    // Implicitly tie the property to the verified token's user ID
    const propertyData = {
      ...pickEditableFields(req.body),
      host: req.user._id
    };

    const newProperty: IProperty = new Property(propertyData);
    const savedProperty = await newProperty.save();
    
    res.status(201).json({ success: true, data: savedProperty });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create property';
    res.status(400).json({ success: false, error: errorMessage });
  }
};

export const updateProperty = async (req: Request, res: Response<ApiResponse<IProperty>>): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, error: 'Invalid property ID' });
      return;
    }

    const property = await Property.findById(id);

    if (!property) {
      res.status(404).json({ success: false, error: 'Property not found' });
      return;
    }

    // Security: Verify the logged-in user owns this property (or is an admin)
    if (property.host.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Not authorized to update this listing' });
      return;
    }

    const updatedProperty = await Property.findByIdAndUpdate(id, pickEditableFields(req.body), {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: updatedProperty as IProperty });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update property';
    res.status(400).json({ success: false, error: errorMessage });
  }
};

export const deleteProperty = async (req: Request, res: Response<ApiResponse<null>>): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, error: 'Invalid property ID' });
      return;
    }

    const property = await Property.findById(id);

    if (!property) {
      res.status(404).json({ success: false, error: 'Property not found' });
      return;
    }

    // Security: Verify ownership before deletion
    if (property.host.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Not authorized to delete this listing' });
      return;
    }

    await property.deleteOne();

    const propertyId = property._id as mongoose.Types.ObjectId;

    // Keep references consistent: a deleted listing must not linger in anyone's
    // saved list, otherwise `populate` hands the favorites page a null entry.
    await User.updateMany(
      { savedProperties: propertyId },
      { $pull: { savedProperties: propertyId } }
    );

    // Remove the uploaded image so the disk doesn't accumulate orphans.
    if (property.imageUrl) {
      const imagePath = path.join(UPLOADS_DIR, path.basename(property.imageUrl));
      await fs.promises.unlink(imagePath).catch(() => {
        // The file may already be gone; the listing is still deleted.
      });
    }

    res.status(200).json({ success: true, data: null });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete property';
    res.status(500).json({ success: false, error: errorMessage });
  }
};

