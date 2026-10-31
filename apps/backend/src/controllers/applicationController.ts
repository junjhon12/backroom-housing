import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Application, { type ApplicationStatus } from '../models/Application';
import Property from '../models/Property';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { requireUser } from '../utils/requireUser';
import type { ApiResponse } from '../types/api';

const MAX_MESSAGE_LENGTH = 1000;

const POPULATE_PROPERTY = {
  path: 'property',
  select: 'title price level sector images hazardClass isAvailable',
};

const parseMoveInDate = (value: unknown): Date | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new AppError(400, 'moveInDate must be a date string');
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(400, 'moveInDate must be a valid date');
  }

  return parsed;
};

export const createApplication = asyncHandler(
  async (req: Request, res: Response<ApiResponse<unknown>>): Promise<void> => {
    const user = requireUser(req);
    const propertyId = req.body.propertyId;

    if (typeof propertyId !== 'string' || !mongoose.isValidObjectId(propertyId)) {
      throw new AppError(400, 'A valid propertyId is required');
    }

    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!message) {
      throw new AppError(400, 'Tell the host why you are applying');
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      throw new AppError(400, `Applications may be at most ${MAX_MESSAGE_LENGTH} characters`);
    }

    const moveInDate = parseMoveInDate(req.body.moveInDate);

    const property = await Property.findById(propertyId);
    if (!property) {
      throw new AppError(404, 'Property not found');
    }
    if (!property.isAvailable) {
      throw new AppError(409, 'This unit is not accepting applications');
    }
    if (property.host.toString() === user._id.toString()) {
      throw new AppError(400, 'You cannot apply to your own listing');
    }

    const alreadyApplied = await Application.exists({
      property: property._id,
      applicant: user._id,
    });
    if (alreadyApplied) {
      throw new AppError(409, 'You have already applied to this unit');
    }

    const application = await Application.create({
      property: property._id,
      applicant: user._id,
      host: property.host,
      message,
      moveInDate,
    });

    const populated = await application.populate(POPULATE_PROPERTY);

    res.status(201).json({ success: true, data: populated });
  }
);

export const getMyApplications = asyncHandler(
  async (req: Request, res: Response<ApiResponse<unknown[]>>): Promise<void> => {
    const user = requireUser(req);

    const applications = await Application.find({ applicant: user._id })
      .sort({ createdAt: -1 })
      .populate(POPULATE_PROPERTY)
      .populate('host', 'name');

    res.status(200).json({ success: true, data: applications });
  }
);

export const getReceivedApplications = asyncHandler(
  async (req: Request, res: Response<ApiResponse<unknown[]>>): Promise<void> => {
    const user = requireUser(req);

    // Admins may audit every application; hosts only see their own units.
    const filter = user.role === 'admin' ? {} : { host: user._id };

    const applications = await Application.find(filter)
      .sort({ createdAt: -1 })
      .populate(POPULATE_PROPERTY)
      .populate('applicant', 'name email');

    res.status(200).json({ success: true, data: applications });
  }
);

export const updateApplicationStatus = asyncHandler(
  async (req: Request, res: Response<ApiResponse<unknown>>): Promise<void> => {
    const user = requireUser(req);
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      throw new AppError(400, 'Invalid application ID');
    }

    const status = req.body.status as ApplicationStatus | undefined;
    if (status !== 'accepted' && status !== 'declined') {
      throw new AppError(400, 'status must be accepted or declined');
    }

    const application = await Application.findById(id);
    if (!application) {
      throw new AppError(404, 'Application not found');
    }

    if (application.host.toString() !== user._id.toString() && user.role !== 'admin') {
      throw new AppError(403, 'Not authorized to review this application');
    }

    if (application.status === 'withdrawn') {
      throw new AppError(409, 'The applicant has withdrawn this application');
    }

    application.status = status;
    await application.save();

    const populated = await application.populate([
      POPULATE_PROPERTY,
      { path: 'applicant', select: 'name email' },
    ]);

    res.status(200).json({ success: true, data: populated });
  }
);

export const withdrawApplication = asyncHandler(
  async (req: Request, res: Response<ApiResponse<unknown>>): Promise<void> => {
    const user = requireUser(req);
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      throw new AppError(400, 'Invalid application ID');
    }

    const application = await Application.findById(id);
    if (!application) {
      throw new AppError(404, 'Application not found');
    }

    if (application.applicant.toString() !== user._id.toString()) {
      throw new AppError(403, 'Not authorized to withdraw this application');
    }

    if (application.status === 'declined') {
      throw new AppError(409, 'A declined application cannot be withdrawn');
    }

    application.status = 'withdrawn';
    await application.save();

    const populated = await application.populate(POPULATE_PROPERTY);

    res.status(200).json({ success: true, data: populated });
  }
);
