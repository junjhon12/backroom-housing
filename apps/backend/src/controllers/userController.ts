import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Property, { IProperty } from '../models/Property';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { requireUser } from '../utils/requireUser';
import type { ApiResponse } from '../types/api';

export const toggleFavorite = asyncHandler(
  async (req: Request, res: Response<ApiResponse<string[]>>): Promise<void> => {
    const user = requireUser(req);
    const { propertyId } = req.params;

    if (!mongoose.isValidObjectId(propertyId)) {
      throw new AppError(400, 'Invalid property ID');
    }

    // Refuse to store a reference to a listing that no longer exists, which
    // would otherwise become a dangling entry in the saved list.
    const propertyExists = await Property.exists({ _id: propertyId });
    if (!propertyExists) {
      throw new AppError(404, 'Property not found');
    }

    const favoriteId = new mongoose.Types.ObjectId(propertyId);
    const isFavorited = user.savedProperties.some((id) => id.toString() === propertyId);

    // Atomic update: unlike read-modify-write on the whole document, a double
    // click can't interleave and lose an entry.
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      isFavorited
        ? { $pull: { savedProperties: favoriteId } }
        : { $addToSet: { savedProperties: favoriteId } },
      { new: true, select: 'savedProperties' }
    );

    if (!updatedUser) {
      throw new AppError(404, 'User not found');
    }

    res.status(200).json({
      success: true,
      data: updatedUser.savedProperties.map((id) => id.toString()),
    });
  }
);

export const getFavorites = asyncHandler(
  async (req: Request, res: Response<ApiResponse<IProperty[]>>): Promise<void> => {
    const user = requireUser(req);

    // Find the user and automatically replace the ObjectIds with the actual Property documents
    const populatedUser = await User.findById(user._id).populate<{
      savedProperties: IProperty[];
    }>('savedProperties');

    if (!populatedUser) {
      throw new AppError(404, 'User not found');
    }

    // `populate` returns null for references whose property was deleted, so
    // strip those out before handing the list to the client.
    const favorites = populatedUser.savedProperties.filter(
      (property): property is IProperty => Boolean(property)
    );

    res.status(200).json({ success: true, data: favorites });
  }
);
