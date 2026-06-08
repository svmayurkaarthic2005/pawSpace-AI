import mongoose from 'mongoose';
import { Pet, IPet, IPetImage } from '../models/pet.model';

export interface CreatePetData {
  owner: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed?: string;
  age?: number;
  gender: 'male' | 'female';
  bio?: string;
}

export interface UpdatePetData {
  name?: string;
  breed?: string;
  age?: number;
  gender?: 'male' | 'female';
  bio?: string;
}

export class PetRepository {
  async create(data: CreatePetData): Promise<IPet> {
    const pet = new Pet(data);
    return pet.save();
  }

  async findById(id: string): Promise<IPet | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Pet.findById(id).populate('owner', 'username name avatar').exec();
  }

  async findByOwner(userId: string): Promise<IPet[]> {
    return Pet.find({ owner: userId }).sort({ createdAt: -1 }).exec();
  }

  async update(id: string, data: UpdatePetData): Promise<IPet | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Pet.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await Pet.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async addImage(petId: string, image: IPetImage): Promise<IPet | null> {
    return Pet.findByIdAndUpdate(
      petId,
      { $push: { images: image } },
      { new: true },
    ).exec();
  }

  async setProfileImage(petId: string, publicId: string): Promise<IPet | null> {
    // Unset all isProfile flags, then set the target one
    await Pet.findByIdAndUpdate(petId, {
      $set: { 'images.$[].isProfile': false },
    }).exec();
    return Pet.findOneAndUpdate(
      { _id: petId, 'images.publicId': publicId },
      { $set: { 'images.$.isProfile': true } },
      { new: true },
    ).exec();
  }

  async removeImage(petId: string, publicId: string): Promise<IPet | null> {
    return Pet.findByIdAndUpdate(
      petId,
      { $pull: { images: { publicId } } },
      { new: true },
    ).exec();
  }

  async isOwner(petId: string, userId: string): Promise<boolean> {
    const count = await Pet.countDocuments({ _id: petId, owner: userId }).exec();
    return count > 0;
  }
}

export const petRepository = new PetRepository();
