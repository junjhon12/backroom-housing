import { Request, Response } from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Property, { IProperty } from '../models/Property';
import User from '../models/User';
import { UPLOADS_DIR } from '../config/paths';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { requireUser } from '../utils/requireUser';
import { parseOptionalNumber, parsePagination } from '../utils/queryParams';
import type { ApiResponse, PaginatedResponse } from '../types/api';

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

const assertValidObjectId = (id: string): void => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(400, 'Invalid property ID');
  }
};

export const getProperties = asyncHandler(
  async (req: Request, res: Response<PaginatedResponse<IProperty>>): Promise<void> => {
    const { keyword, minPrice, maxPrice, bedrooms } = req.query;
    const { page, limit } = parsePagination(req.query);

    const dbQuery: Record<string, unknown> = { isAvailable: true };

    // Utilize the MongoDB Text Index instead of $regex for O(log N) performance
    if (keyword !== undefined) {
      // A repeated query param arrives as an array, which $search can't accept.
      if (typeof keyword !== 'string') {
        throw new AppError(400, 'keyword must be a single string');
      }

      const term = keyword.trim();
      if (term) {
        dbQuery.$text = { $search: term };
      }
    }

    const min = parseOptionalNumber(minPrice, 'minPrice');
    const max = parseOptionalNumber(maxPrice, 'maxPrice');

    if (min !== undefined && max !== undefined && min > max) {
      throw new AppError(400, 'minPrice cannot be greater than maxPrice');
    }

    const priceFilter: Record<string, number> = {};
    if (min !== undefined) priceFilter.$gte = min;
    if (max !== undefined) priceFilter.$lte = max;
    if (Object.keys(priceFilter).length > 0) {
      dbQuery.price = priceFilter;
    }

    const minBedrooms = parseOptionalNumber(bedrooms, 'bedrooms');
    if (minBedrooms !== undefined) {
      dbQuery.bedrooms = { $gte: minBedrooms };
    }

    const [properties, total] = await Promise.all([
      Property.find(dbQuery)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Property.countDocuments(dbQuery),
    ]);

    res.status(200).json({
      success: true,
      data: properties,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
);

export const getPropertyById = asyncHandler(
  async (req: Request, res: Response<ApiResponse<IProperty>>): Promise<void> => {
    const { id } = req.params;
    assertValidObjectId(id);

    const property = await Property.findById(id);

    if (!property) {
      throw new AppError(404, 'Property not found');
    }

    res.status(200).json({ success: true, data: property });
  }
);

export const getPropertiesByHost = asyncHandler(
  async (req: Request, res: Response<ApiResponse<IProperty[]>>): Promise<void> => {
    const user = requireUser(req);

    // Find all properties where the host ID matches the logged-in user's ID
    const properties = await Property.find({ host: user._id }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: properties });
  }
);

export const createProperty = asyncHandler(
  async (req: Request, res: Response<ApiResponse<IProperty>>): Promise<void> => {
    const user = requireUser(req);

    // Implicitly tie the property to the verified token's user ID
    const newProperty = new Property({
      ...pickEditableFields(req.body),
      host: user._id,
    });

    const savedProperty = await newProperty.save();

    res.status(201).json({ success: true, data: savedProperty });
  }
);

export const updateProperty = asyncHandler(
  async (req: Request, res: Response<ApiResponse<IProperty>>): Promise<void> => {
    const user = requireUser(req);
    const { id } = req.params;
    assertValidObjectId(id);

    const property = await Property.findById(id);

    if (!property) {
      throw new AppError(404, 'Property not found');
    }

    // Security: Verify the logged-in user owns this property (or is an admin)
    if (property.host.toString() !== user._id.toString() && user.role !== 'admin') {
      throw new AppError(403, 'Not authorized to update this listing');
    }

    const updatedProperty = await Property.findByIdAndUpdate(id, pickEditableFields(req.body), {
      new: true,
      runValidators: true,
    });

    if (!updatedProperty) {
      throw new AppError(404, 'Property not found');
    }

    res.status(200).json({ success: true, data: updatedProperty });
  }
);

export const deleteProperty = asyncHandler(
  async (req: Request, res: Response<ApiResponse<null>>): Promise<void> => {
    const user = requireUser(req);
    const { id } = req.params;
    assertValidObjectId(id);

    const property = await Property.findById(id);

    if (!property) {
      throw new AppError(404, 'Property not found');
    }

    // Security: Verify ownership before deletion
    if (property.host.toString() !== user._id.toString() && user.role !== 'admin') {
      throw new AppError(403, 'Not authorized to delete this listing');
    }

    await property.deleteOne();

    // Keep references consistent: a deleted listing must not linger in anyone's
    // saved list, otherwise `populate` hands the favorites page a null entry.
    await User.updateMany(
      { savedProperties: property._id },
      { $pull: { savedProperties: property._id } }
    );

    // Remove the uploaded image so the disk doesn't accumulate orphans.
    if (property.imageUrl) {
      const imagePath = path.join(UPLOADS_DIR, path.basename(property.imageUrl));
      await fs.promises.unlink(imagePath).catch(() => {
        // The file may already be gone; the listing is still deleted.
      });
    }

    res.status(200).json({ success: true, data: null });
  }
);
