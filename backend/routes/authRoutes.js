import express from 'express';
import { registerUser, authUser, getUsers, deleteUser, getUserById, getUserProfile, updateUserProfile } from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(registerUser).get(protect, admin, getUsers);
router.post('/login', authUser);

// Profile routes MUST go before /:id routes so 'profile' isn't parsed as an ID
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.route('/:id').delete(protect, admin, deleteUser).get(protect, admin, getUserById);

export default router;
