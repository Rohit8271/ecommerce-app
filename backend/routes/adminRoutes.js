import express from 'express';
import { getAdminStats, updateUserRole } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', protect, admin, getAdminStats);

// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
router.put('/users/:id/role', protect, admin, updateUserRole);

export default router;
