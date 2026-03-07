import express from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getCategories, createProductReview, getProductReviews, updateProductReview, deleteProductReview } from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getProducts)
    .post(protect, admin, createProduct);

// Must come before /:id route
router.get('/categories', getCategories);

router.route('/:id')
    .get(getProductById)
    .put(protect, admin, updateProduct)
    .delete(protect, admin, deleteProduct);

// Review routes
router.route('/:id/reviews')
    .get(getProductReviews)
    .post(protect, createProductReview);

router.route('/:id/reviews/:reviewId')
    .put(protect, updateProductReview)
    .delete(protect, deleteProductReview);

export default router;
