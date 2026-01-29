/**
 * Database Cleanup Script
 * 
 * This script clears all collections in the database to start fresh
 * after the Phase 1 schema changes (mess fund system implementation).
 * 
 * Usage: node clear-database.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const clearDatabase = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/messmate';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.collections();
    console.log(`\nFound ${collections.length} collections`);

    // Drop each collection
    for (const collection of collections) {
      console.log(`Dropping collection: ${collection.collectionName}`);
      await collection.drop();
    }

    console.log('\n✅ All collections cleared successfully!');
    console.log('\nYou can now:');
    console.log('1. Register a new user');
    console.log('2. Create a new mess');
    console.log('3. Start using the updated system\n');

  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

clearDatabase();
