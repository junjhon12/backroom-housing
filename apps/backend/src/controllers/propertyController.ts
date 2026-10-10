import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Property, { IProperty } from '../models/Property';

// Explicit interface for API response
interface ApiResponse<T> {
  success: boolean;
  data?: T | T[];
  error?: string;
}

export const getProperties = async (req: Request, res: Response<ApiResponse<IProperty>>): Promise<void> => {
  try {
    const properties = await Property.find({ isAvailable: true }).sort({ createdAt: -1 });
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

export const createProperty = async (req: Request, res: Response<ApiResponse<IProperty>>): Promise<void> => {
  try {
    const newProperty: IProperty = new Property(req.body);
    const savedProperty = await newProperty.save();
    
    res.status(201).json({ success: true, data: savedProperty });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create property';
    res.status(400).json({ success: false, error: errorMessage });
  }
};