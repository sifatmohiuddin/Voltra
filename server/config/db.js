import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error(
      '\n✗ MONGODB_URI is not set. Copy .env.example to .env and add your connection string.\n' +
        '  A free cluster takes about 2 minutes at https://www.mongodb.com/cloud/atlas\n'
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`✓ MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}
