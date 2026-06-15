/**
 * Script to sync Follow model indexes with schema definition
 * This will drop old indexes and create new ones with entityType
 * Validates: Requirements 1.5, 1.6, 1.7, 14.3
 */

import mongoose from 'mongoose';
import { Follow } from '../models/follow.model';
import { connectDB } from '../config/db';

async function syncIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 Current indexes:');
    const currentIndexes = await Follow.collection.getIndexes();
    console.log(JSON.stringify(currentIndexes, null, 2));
    console.log('');

    console.log('🔄 Syncing indexes with schema definition...');
    console.log('   This will drop outdated indexes and create new ones.\n');
    
    // This will:
    // 1. Compare indexes in the schema with those in MongoDB
    // 2. Drop indexes that are not in the schema
    // 3. Create indexes that are in the schema but not in MongoDB
    await Follow.syncIndexes();
    
    console.log('✅ Index sync complete!\n');

    console.log('📊 Updated indexes:');
    const updatedIndexes = await Follow.collection.getIndexes();
    console.log(JSON.stringify(updatedIndexes, null, 2));
    console.log('');

    // Verify the expected indexes exist
    const expectedIndexes = [
      { name: 'follower_1_following_1_entityType_1', key: [['follower', 1], ['following', 1], ['entityType', 1]] },
      { name: 'following_1_entityType_1_createdAt_-1', key: [['following', 1], ['entityType', 1], ['createdAt', -1]] },
      { name: 'follower_1_createdAt_-1', key: [['follower', 1], ['createdAt', -1]] },
    ];

    console.log('✅ Verifying expected indexes:');
    let allPresent = true;
    for (const expected of expectedIndexes) {
      const found = updatedIndexes[expected.name];
      
      if (found && JSON.stringify(found) === JSON.stringify(expected.key)) {
        console.log(`✅ Found: ${expected.name}`);
      } else {
        console.log(`❌ Missing or incorrect: ${expected.name}`);
        allPresent = false;
      }
    }
    
    console.log('');
    if (allPresent) {
      console.log('✅ All required indexes are present!');
      console.log('✅ Task 13.1 complete: Database indexes verified and synced!');
    } else {
      console.log('❌ Some required indexes are still missing.');
    }

  } catch (error) {
    console.error('❌ Error syncing indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run sync
syncIndexes();
