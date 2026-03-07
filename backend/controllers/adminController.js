import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
    try {
        // Run all DB queries concurrently for speed
        const [
            totalOrders,
            totalProducts,
            totalUsers,
            revenueResult,
            recentOrders,
            topProducts,
            ordersByStatus,
        ] = await Promise.all([
            Order.countDocuments(),
            Product.countDocuments(),
            User.countDocuments(),

            // Total revenue from paid orders
            Order.aggregate([
                { $match: { isPaid: true } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]),

            // 5 most recent orders with user info
            Order.find({})
                .populate('user', 'name email')
                .sort({ createdAt: -1 })
                .limit(5)
                .select('_id totalPrice isPaid isDelivered createdAt user'),

            // Top 5 best-selling products by revenue (orders contain orderItems)
            Order.aggregate([
                { $unwind: '$orderItems' },
                {
                    $group: {
                        _id: '$orderItems.product',
                        name: { $first: '$orderItems.name' },
                        image: { $first: '$orderItems.image' },
                        totalSold: { $sum: '$orderItems.qty' },
                        totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } }
                    }
                },
                { $sort: { totalSold: -1 } },
                { $limit: 5 }
            ]),

            // Order count grouped by status
            Order.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),
        ]);

        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // Build sales sparkline: last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        const dailySales = await Order.aggregate([
            { $match: { isPaid: true, createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$totalPrice' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            totalOrders,
            totalProducts,
            totalUsers,
            totalRevenue,
            recentOrders,
            topProducts,
            ordersByStatus,
            dailySales,
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle admin role for a user
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from removing their own admin rights
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot change your own admin status' });
        }

        user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : !user.isAdmin;
        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getAdminStats, updateUserRole };
