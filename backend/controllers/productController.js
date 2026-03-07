import Product from '../models/Product.js';

// @desc    Fetch all products with optional search, category filter, and pagination
// @route   GET /api/products?keyword=&category=&pageNumber=&pageSize=
// @access  Public
const getProducts = async (req, res) => {
    try {
        const pageSize = Math.min(Number(req.query.pageSize) || 12, 100); // cap at 100
        const page = Math.max(Number(req.query.pageNumber) || 1, 1);

        const filter = {};

        // Keyword search on name and description
        if (req.query.keyword) {
            filter.$or = [
                { name: { $regex: req.query.keyword, $options: 'i' } },
                { description: { $regex: req.query.keyword, $options: 'i' } },
            ];
        }

        // Category filtering (case-insensitive exact match)
        if (req.query.category && req.query.category !== 'all') {
            filter.category = { $regex: `^${req.query.category}$`, $options: 'i' };
        }

        // Price range filtering
        if (req.query.minPrice || req.query.maxPrice) {
            filter.price = {};
            if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
        }

        // Sort option
        const sortOptions = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            rating: { rating: -1 },
        };
        const sort = sortOptions[req.query.sort] || { createdAt: -1 };

        const [count, products] = await Promise.all([
            Product.countDocuments(filter),
            Product.find(filter)
                .sort(sort)
                .limit(pageSize)
                .skip(pageSize * (page - 1))
        ]);

        res.json({
            products,
            page,
            pages: Math.ceil(count / pageSize),
            pageSize,
            total: count
        });
    } catch (error) {
        res.status(500).json({ message: 'Server currently unavailable. Please try again later.' });
    }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server currently unavailable. Please try again later.' });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    try {
        const { name, price, description, category, stock, brand, isNew, image, colors, features, specifications } = req.body;

        if (!name || !price || !description || !category || !image) {
            return res.status(400).json({ message: 'Please provide name, price, description, category, and image' });
        }

        const product = new Product({
            name,
            price: Number(price),
            user: req.user._id,
            image,
            category,
            countInStock: Number(stock) || 0,
            numReviews: 0,
            description,
            brand: brand || '',
            isNewProduct: isNew || false,
            colors: colors || [],
            features: features || [],
            specifications: specifications || {},
            reviews: [],
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        const { name, price, description, category, stock, brand, isNew, image, colors, features, specifications } = req.body;

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Use nullish coalescing to allow explicit 0 values
        if (name !== undefined) product.name = name;
        if (price !== undefined) product.price = Number(price);
        if (description !== undefined) product.description = description;
        if (category !== undefined) product.category = category;
        if (stock !== undefined) product.countInStock = Number(stock);
        if (brand !== undefined) product.brand = brand;
        if (isNew !== undefined) product.isNewProduct = isNew;
        if (image !== undefined) product.image = image;
        if (colors !== undefined) product.colors = colors;
        if (features !== undefined) product.features = features;
        if (specifications !== undefined) product.specifications = specifications;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await Product.deleteOne({ _id: product._id });
        res.json({ message: 'Product removed successfully', id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get distinct product categories
// @route   GET /api/products/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
const getProductReviews = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).select('reviews numReviews rating name');
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Sort by newest first
        const sorted = [...product.reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json({ reviews: sorted, numReviews: product.numReviews, rating: product.rating });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a product review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;

        if (!rating || !comment) {
            return res.status(400).json({ message: 'Please provide a rating and comment.' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Prevent duplicate reviews from the same user
        const alreadyReviewed = product.reviews.find(
            r => r.user && r.user.toString() === req.user._id.toString()
        );
        if (alreadyReviewed) {
            return res.status(400).json({ message: 'You have already reviewed this product.' });
        }

        const review = {
            name: req.user.name,
            rating: Number(rating),
            comment,
            user: req.user._id,
        };

        product.reviews.push(review);
        product.numReviews = product.reviews.length;
        product.rating =
            product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;

        await product.save();
        const newReview = product.reviews[product.reviews.length - 1];
        res.status(201).json({ message: 'Review added', review: newReview, rating: product.rating, numReviews: product.numReviews });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a product review
// @route   PUT /api/products/:id/reviews/:reviewId
// @access  Private
const updateProductReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        if (!rating || !comment) return res.status(400).json({ message: 'Please provide a rating and comment.' });
        if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5.' });

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const review = product.reviews.id(req.params.reviewId);
        if (!review) return res.status(404).json({ message: 'Review not found' });

        // Only the author can edit
        if (review.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorised to edit this review' });
        }

        review.rating = Number(rating);
        review.comment = comment;
        product.rating = product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;
        await product.save();

        res.json({ message: 'Review updated', review, rating: product.rating, numReviews: product.numReviews });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a product review
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private
const deleteProductReview = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const review = product.reviews.id(req.params.reviewId);
        if (!review) return res.status(404).json({ message: 'Review not found' });

        // Only the author (or admin) can delete
        if (review.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorised to delete this review' });
        }

        product.reviews.pull({ _id: req.params.reviewId });
        product.numReviews = product.reviews.length;
        product.rating = product.reviews.length > 0
            ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
            : 0;
        await product.save();

        res.json({ message: 'Review deleted', rating: product.rating, numReviews: product.numReviews });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getCategories, createProductReview, getProductReviews, updateProductReview, deleteProductReview };
