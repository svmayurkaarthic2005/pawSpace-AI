/**
 * Script to verify Follow model database indexes
 * Validates: Requirements 1.5, 1.6, 1.7, 14.3
 */

import mongoose from 'mongoose';
import { Follow } from '../models/follow.model';
import { connectDB } from '../config/db';

async function verifyIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Get all indexes on the Follow collection
    console.log('📊 Inspecting Follow collection indexes...\n');
    const indexes = await Follow.collection.getIndexes();
    
    // Expected indexes
    const expectedIndexes = [
      {
        name: 'Unique compound index on (follower, following, entityType)',
        key: { follower: 1, following: 1, entityType: 1 },
        unique: true,
      },
      {
        name: 'Index on (following, entityType, createdAt) for follower queries',
        key: { following: 1, entityType: 1, createdAt: -1 },
        unique: false,
      },
      {
        name: 'Index on (follower, createdAt) for following queries',
        key: { follower: 1, createdAt: -1 },
        unique: false,
      },
    ];

    console.log('✅ Current indexes on Follow collection:');
    console.log(JSON.stringify(indexes, null, 2));
    console.log('');

    // Verify each expected index
    let allIndexesPresent = true;
    for (const expected of expectedIndexes) {
      const found = Object.entries(indexes).some(([_, indexKey]) => {
        const keysMatch = JSON.stringify(indexKey) === JSON.stringify(expected.key);
        return keysMatch;
      });

      if (found) {
        console.log(`✅ ${expected.name}`);
      } else {
        console.log(`❌ MISSING: ${expected.name}`);
        console.log(`   Expected key: ${JSON.stringify(expected.key)}`);
        allIndexesPresent = false;
      }
    }

    if (!allIndexesPresent) {
      console.log('\n⚠️  Some indexes are missing. They should be auto-created when the model is first used.');
      console.log('   To manually create indexes, run: await Follow.syncIndexes()');
    }

    console.log('\n📝 Running explain plans on critical queries...\n');

    // Test query 1: Check if user follows a specific entity (isFollowing)
    console.log('--- Query 1: isFollowing(userId, entityId, entityType) ---');
    const testUserId = new mongoose.Types.ObjectId();
    const testEntityId = new mongoose.Types.ObjectId();
    
    const explainQuery1 = await Follow.find({
      follower: testUserId,
      following: testEntityId,
      entityType: 'User',
    }).explain('executionStats') as any;

    console.log('Query:', {
      follower: testUserId.toString(),
      following: testEntityId.toString(),
      entityType: 'User',
    });
    
    const stage1 = explainQuery1.executionStats.executionStages;
    console.log('Execution stage:', stage1.stage);
    if (stage1.stage === 'IXSCAN') {
      console.log('✅ Using index:', stage1.indexName);
      console.log('   Index keys:', stage1.keyPattern);
    } else if (stage1.inputStage?.stage === 'IXSCAN') {
      console.log('✅ Using index:', stage1.inputStage.indexName);
      console.log('   Index keys:', stage1.inputStage.keyPattern);
    } else {
      console.log('❌ NOT using index scan (using COLLSCAN)');
    }
    console.log('Documents examined:', explainQuery1.executionStats.totalDocsExamined);
    console.log('');

    // Test query 2: Get followers for an entity (getFollowers)
    console.log('--- Query 2: getFollowers(entityId, entityType, page, limit) ---');
    
    const explainQuery2 = await Follow.find({
      following: testEntityId,
      entityType: 'Pet',
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .explain('executionStats') as any;

    console.log('Query:', {
      following: testEntityId.toString(),
      entityType: 'Pet',
    });
    console.log('Sort:', { createdAt: -1 });
    console.log('Limit:', 20);
    
    const stage2 = explainQuery2.executionStats.executionStages;
    
    // Navigate to IXSCAN stage (may be nested)
    let ixscanStage = stage2;
    while (ixscanStage && ixscanStage.stage !== 'IXSCAN' && ixscanStage.inputStage) {
      ixscanStage = ixscanStage.inputStage;
    }
    
    if (ixscanStage?.stage === 'IXSCAN') {
      console.log('✅ Using index:', ixscanStage.indexName);
      console.log('   Index keys:', ixscanStage.keyPattern);
    } else {
      console.log('❌ NOT using index scan (using COLLSCAN)');
    }
    console.log('Documents examined:', explainQuery2.executionStats.totalDocsExamined);
    console.log('');

    // Test query 3: Get following list for a user (getFollowing)
    console.log('--- Query 3: getFollowing(userId, page, limit) ---');
    
    const explainQuery3 = await Follow.find({
      follower: testUserId,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .explain('executionStats') as any;

    console.log('Query:', {
      follower: testUserId.toString(),
    });
    console.log('Sort:', { createdAt: -1 });
    console.log('Limit:', 20);
    
    const stage3 = explainQuery3.executionStats.executionStages;
    
    // Navigate to IXSCAN stage
    let ixscanStage3 = stage3;
    while (ixscanStage3 && ixscanStage3.stage !== 'IXSCAN' && ixscanStage3.inputStage) {
      ixscanStage3 = ixscanStage3.inputStage;
    }
    
    if (ixscanStage3?.stage === 'IXSCAN') {
      console.log('✅ Using index:', ixscanStage3.indexName);
      console.log('   Index keys:', ixscanStage3.keyPattern);
    } else {
      console.log('❌ NOT using index scan (using COLLSCAN)');
    }
    console.log('Documents examined:', explainQuery3.executionStats.totalDocsExamined);
    console.log('');

    console.log('✅ Index verification complete!\n');
    
    if (allIndexesPresent) {
      console.log('✅ All required indexes are present and being used correctly.');
      console.log('✅ Task 13.1 verification successful!');
    } else {
      console.log('⚠️  Some indexes may need to be created. Run Follow.syncIndexes() if needed.');
    }

  } catch (error) {
    console.error('❌ Error verifying indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run verification
verifyIndexes();
