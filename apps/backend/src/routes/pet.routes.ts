import { Router } from 'express';
import multer from 'multer';
import { authenticate, optionalAuth } from '../middleware/auth';
import {
  createPet, getMyPets, getPetById, updatePet, deletePet, uploadPetImage,
} from '../controllers/pet.controller';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  },
});

router.post('/', authenticate, createPet);
router.get('/', authenticate, getMyPets);
router.get('/:id', optionalAuth, getPetById);
router.put('/:id', authenticate, updatePet);
router.delete('/:id', authenticate, deletePet);
router.post('/:id/images', authenticate, upload.single('image'), uploadPetImage);

export default router;
