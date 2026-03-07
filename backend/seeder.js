import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import connectDB from './config/db.js';
import bcrypt from 'bcryptjs';

// Convert the mockData format from frontend to a backend friendly array
import { products as mockProducts } from './data/products.js';

dotenv.config();

connectDB();

const importData = async () => {
    try {
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();

        const salt = bcrypt.genSaltSync(10);

        const createdUsers = await User.insertMany([
            {
                name: 'Admin User',
                email: 'admin@example.com',
                password: bcrypt.hashSync('password123', salt),
                isAdmin: true
            },
            {
                name: 'John Doe',
                email: 'john@example.com',
                password: bcrypt.hashSync('password123', salt),
                isAdmin: false
            }
        ]);

        const adminUser = createdUsers[0]._id;

        const sampleProducts = mockProducts.map(product => {
            return {
                ...product,
                user: adminUser,
                // Replace any fields that don't match the new schema exactly
                countInStock: product.stock !== undefined ? product.stock : (product.inStock ? 10 : 0),
            }
        });

        await Product.insertMany(sampleProducts);

        console.log('Data Imported!'.green.inverse);
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`.red.inverse);
        process.exit(1);
    }
}

const destroyData = async () => {
    try {
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();

        console.log('Data Destroyed!'.red.inverse);
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`.red.inverse);
        process.exit(1);
    }
}

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
