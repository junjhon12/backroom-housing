import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Property, { IProperty } from '../models/Property';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const toggleFavorite = async (req: Request, res: Response<ApiResponse<mongoose.Types.ObjectId[]>>): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const userId = req.user?._id;

    if (!mongoose.isValidObjectId(propertyId)) {
      res.status(400).json({ success: false, error: 'Invalid property ID' });
      return;
    }

    // Refuse to store a reference to a listing that no longer exists, which
    // would otherwise become a dangling entry in the saved list.
    const propertyExists = await Property.exists({ _id: propertyId });
    if (!propertyExists) {
      res.status(404).json({ success: false, error: 'Property not found' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Check if the property is already in the saved array
    const isFavorited = user.savedProperties.some((id) => id.toString() === propertyId);

    if (isFavorited) {
      // Remove it
      user.savedProperties = user.savedProperties.filter((id) => id.toString() !== propertyId);
    } else {
      // Add it
      user.savedProperties.push(new mongoose.Types.ObjectId(propertyId));
    }

    await user.save();

    res.status(200).json({ success: true, data: user.savedProperties });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to toggle favorite status';
    res.status(500).json({ success: false, error: errorMessage });
  }
};

export const getFavorites = async (req: Request, res: Response<ApiResponse<IProperty[]>>): Promise<void> => {
  try {
    // Find the user and automatically replace the ObjectIds with the actual Property documents
    const user = await User.findById(req.user?._id).populate<{ savedProperties: IProperty[] }>('savedProperties');

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // `populate` returns null for references whose property was deleted, so
    // strip those out before handing the list to the client.
    const favorites = user.savedProperties.filter(
      (property): property is IProperty => Boolean(property)
    );

    res.status(200).json({ success: true, data: favorites });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch favorite properties';
    res.status(500).json({ success: false, error: errorMessage });
  }
};