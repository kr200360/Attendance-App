import mongoose from 'mongoose';
import { config } from './env';
import path from 'path';

let memoryServer: any = null;

export async function connectDatabase(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', false);

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    console.log(`Connecting to MongoDB at: ${config.mongodbUri.replace(/:[^:@]+@/, ':****@')}`);
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log('MongoDB connected successfully');
    return mongoose;
  } catch (err: any) {
    console.warn(`Could not connect to external MongoDB: ${err.message}`);

    // In dev or test mode, spin up MongoDB Memory Server for zero-friction local development
    if (config.nodeEnv !== 'production') {
      console.log('Spinning up in-memory MongoDB server for development/testing...');
      try {
        process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(process.cwd(), '.mongo-bin');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memUri = memoryServer.getUri();
        await mongoose.connect(memUri);
        console.log(`MongoDB Memory Server connected at: ${memUri}`);
        return mongoose;
      } catch (memErr: any) {
        console.error('Failed to start in-memory MongoDB server:', memErr.message);
        throw err;
      }
    } else {
      throw err;
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
  }
  console.log('MongoDB disconnected');
}
