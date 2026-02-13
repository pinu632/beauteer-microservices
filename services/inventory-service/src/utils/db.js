import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        // Explicitly force IPv4 to avoid SSL/TLS issues in some Docker/Network environments
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            family: 4,
            tls:true,
            tlsAllowInvalidCertificates:true
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};
