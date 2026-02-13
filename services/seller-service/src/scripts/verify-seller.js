import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Seller from '../models/Seller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const verifySeller = async () => {
    await connectDB();

    try {

        console.log('Clearing existing sellers...');
        await Seller.deleteMany({});
        try {
            await Seller.collection.dropIndexes();
            console.log('Dropped indexes');
        } catch (e) {
            console.log('No indexes to drop or error dropping indexes:', e.message);
        }
        console.log('Cleared existing sellers and indexes');


        console.log('Creating single seller...');
        const seller1 = new Seller({
            storeName: 'Test Store 123',
            ownerName: 'Alice',
            email: 'alice@store123.com',
            phone: '555-0101',
            address: {
                city: 'Test City',
                state: 'Test State'
            },
            isVerified: true
        });
        await seller1.save();
        console.log('Success: Created single seller:', seller1.storeName);

        console.log('Creating bulk sellers...');
        const sellers = [
            {
                storeName: 'Bulk Store A',
                ownerName: 'Bob',
                email: 'bob@storeA.com',
                phone: '555-0102',
                address: { city: 'City A', state: 'State A' }
            },
            {
                storeName: 'Bulk Store B',
                ownerName: 'Charlie',
                email: 'charlie@storeB.com',
                phone: '555-0103',
                address: { city: 'City B', state: 'State B' }
            }
        ];

        const createdSellers = await Seller.insertMany(sellers);
        console.log(`Success: Bulk created ${createdSellers.length} sellers`);

        // Verify total count
        const totalSellers = await Seller.countDocuments();
        console.log('Total sellers in DB:', totalSellers);

        if (totalSellers === 3) {
            console.log('VERIFICATION COMPLETE: ALL CHECKS PASSED');
        } else {
            console.error(`VERIFICATION FAILED: Expected 3 sellers, found ${totalSellers}`);
            process.exit(1);
        }

    } catch (error) {
        console.error('Verification Error:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    }
};

verifySeller();
