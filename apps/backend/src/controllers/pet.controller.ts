import { Request, Response, NextFunction } from 'express';
import { petService } from '../services/pet.service';
import { AppError } from '../middleware/error';
import { successResponse } from '../utils';

export const createPet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const body = req.body as {
      name: string; species: 'dog'|'cat'|'bird'|'rabbit'|'other';
      breed?: string; age?: number; gender: 'male'|'female'; bio?: string;
    };
    const pet = await petService.createPet(req.user.userId, body);
    res.status(201).json(successResponse(pet, 'Pet created'));
  } catch (err) { next(err); }
};

export const getMyPets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const pets = await petService.getPetsByOwner(req.user.userId);
    res.status(200).json(successResponse(pets, 'Pets retrieved'));
  } catch (err) { next(err); }
};

export const getPetById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pet = await petService.getPetById(req.params.id);
    res.status(200).json(successResponse(pet, 'Pet retrieved'));
  } catch (err) { next(err); }
};

export const updatePet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const pet = await petService.updatePet(req.user.userId, req.params.id, req.body as Record<string, unknown>);
    res.status(200).json(successResponse(pet, 'Pet updated'));
  } catch (err) { next(err); }
};

export const deletePet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    await petService.deletePet(req.user.userId, req.params.id);
    res.status(200).json(successResponse(null, 'Pet deleted'));
  } catch (err) { next(err); }
};

export const uploadPetImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const file = req.file;
    if (!file) throw new AppError('Image file is required', 400, true, 'NO_FILE');
    const setAsProfile = (req.query.profile as string) === 'true';
    const pet = await petService.uploadPetImage(req.user.userId, req.params.id, file.buffer, setAsProfile);
    res.status(200).json(successResponse(pet, 'Image uploaded'));
  } catch (err) { next(err); }
};
