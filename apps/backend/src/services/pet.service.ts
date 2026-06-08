import { petRepository, CreatePetData, UpdatePetData } from '../repositories/pet.repository';
import { uploadImage, deleteImage } from '../utils/cloudinary.util';
import { AppError } from '../middleware/error';
import { IPet } from '../models/pet.model';
import { User } from '../models/user.model';

export class PetService {
  async createPet(userId: string, data: Omit<CreatePetData, 'owner'>): Promise<IPet> {
    const pet = await petRepository.create({ ...data, owner: userId });
    // Increment user's petCount
    await User.findByIdAndUpdate(userId, { $inc: { petCount: 1 } }).exec();
    return pet;
  }

  async updatePet(userId: string, petId: string, data: UpdatePetData): Promise<IPet> {
    const isOwner = await petRepository.isOwner(petId, userId);
    if (!isOwner) throw new AppError('You do not own this pet', 403, true, 'FORBIDDEN');

    const updated = await petRepository.update(petId, data);
    if (!updated) throw new AppError('Pet not found', 404, true, 'PET_NOT_FOUND');
    return updated;
  }

  async deletePet(userId: string, petId: string): Promise<void> {
    const isOwner = await petRepository.isOwner(petId, userId);
    if (!isOwner) throw new AppError('You do not own this pet', 403, true, 'FORBIDDEN');

    const pet = await petRepository.findById(petId);
    if (!pet) throw new AppError('Pet not found', 404, true, 'PET_NOT_FOUND');

    // Delete all Cloudinary images
    await Promise.all(pet.images.map((img) => deleteImage(img.publicId)));

    await petRepository.delete(petId);
    await User.findByIdAndUpdate(userId, { $inc: { petCount: -1 } }).exec();
  }

  async getPetsByOwner(userId: string): Promise<IPet[]> {
    return petRepository.findByOwner(userId);
  }

  async getPetById(petId: string): Promise<IPet> {
    const pet = await petRepository.findById(petId);
    if (!pet) throw new AppError('Pet not found', 404, true, 'PET_NOT_FOUND');
    return pet;
  }

  async uploadPetImage(
    userId: string,
    petId: string,
    buffer: Buffer,
    setAsProfile: boolean = false,
  ): Promise<IPet> {
    const isOwner = await petRepository.isOwner(petId, userId);
    if (!isOwner) throw new AppError('You do not own this pet', 403, true, 'FORBIDDEN');

    const result = await uploadImage(buffer, 'pawspace/pets');
    const pet = await petRepository.addImage(petId, {
      url: result.url,
      publicId: result.publicId,
      isProfile: setAsProfile,
    });

    if (!pet) throw new AppError('Pet not found', 404, true, 'PET_NOT_FOUND');

    if (setAsProfile) {
      return (await petRepository.setProfileImage(petId, result.publicId)) ?? pet;
    }

    return pet;
  }
}

export const petService = new PetService();
