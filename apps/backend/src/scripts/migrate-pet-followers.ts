/**
 * Migration Script: Pet Followers to Follow Collection
 * 
 * This script migrates pet followers from the embedded Pet.followers array
 * to the Follow collection with entityType 'Pet'.
 * 
 * Features:
 * - Idempotent: Safe to run multiple times
 * - Transactional: Uses MongoDB sessions for consistency
 * - Validates counts: Ensures followerCount matches actual Follow records
 * - Updates user followingCount: Increments for each migrated follower
 * - Progress logging: Shows migration progress and statistics
 * 
 * Usage:
 *   ts-node apps/backend/src/scripts/migrate-pet-followers.ts
 */

import mongoose from 'mongoose';
import { Pet } from '../models/pet.model';
import { User } from '../models/user.model';
import { Follow } from '../models/follow.model';
import { connectDB } from '../config/db';

interface MigrationStats {
  totalPets: number;
  petsWithFollowers: number;
  followRecordsCreated: number;
  followRecordsSkipped: number;
  userCountsUpdated: number;
  errors: number;
}

async function migratePetFollowers(): Promise<void> {
  console.log('🚀 Starting pet followers migration...\n');

  const stats: MigrationStats = {
    totalPets: 0,
    petsWithFollowers: 0,
    followRecordsCreated: 0,
    followRecordsSkipped: 0,
    userCountsUpdated: 0,
    errors: 0,
  };

  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database\n');

    // Find all pets with non-empty followers array and not yet migrated
    const pets = await Pet.find({
      followers: { $exists: true, $ne: [] },
      followersLegacyMigrated: { $ne: true },
    })
      .select('_id name followers followerCount')
      .lean()
      .exec();

    stats.totalPets = pets.length;
    console.log(`📊 Found ${stats.totalPets} pets with followers to migrate\n`);

    if (stats.totalPets === 0) {
      console.log('✨ No pets need migration. Exiting.\n');
      return;
    }

    // Process each pet
    for (const pet of pets) {
      const petId = pet._id.toString();
      const followers = pet.followers || [];

      if (followers.length === 0) continue;

      stats.petsWithFollowers++;
      console.log(`\n🐾 Processing pet: ${pet.name} (${petId})`);
      console.log(`   Followers to migrate: ${followers.length}`);

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        let createdCount = 0;
        let skippedCount = 0;
        const userCountUpdates: string[] = [];

        // Create Follow records for each follower
        for (const followerId of followers) {
          const followerIdStr = followerId.toString();

          // Check if Follow record already exists (idempotency)
          const existingFollow = await Follow.findOne({
            follower: followerId,
            following: pet._id,
            entityType: 'Pet',
          })
            .session(session)
            .exec();

          if (existingFollow) {
            skippedCount++;
            console.log(`   ⏭️  Skip: Follow record already exists for follower ${followerIdStr}`);
            continue;
          }

          // Create Follow record
          await Follow.create(
            [
              {
                follower: followerId,
                following: pet._id,
                entityType: 'Pet',
                createdAt: new Date(),
              },
            ],
            { session },
          );
          createdCount++;

          // Update User's followingCount
          await User.findByIdAndUpdate(
            followerId,
            { $inc: { followingCount: 1 } },
            { session },
          ).exec();
          userCountUpdates.push(followerIdStr);

          console.log(`   ✅ Created Follow record for follower ${followerIdStr}`);
        }

        // Verify Pet followerCount matches actual Follow records
        const actualFollowCount = await Follow.countDocuments({
          following: pet._id,
          entityType: 'Pet',
        })
          .session(session)
          .exec();

        // Update Pet followerCount to match actual Follow records
        await Pet.findByIdAndUpdate(
          pet._id,
          {
            followerCount: actualFollowCount,
            followersLegacyMigrated: true,
          },
          { session },
        ).exec();

        console.log(`   📊 Verified followerCount: ${actualFollowCount} (was ${pet.followerCount || 0})`);
        console.log(`   ✅ Marked pet as migrated`);

        // Commit transaction
        await session.commitTransaction();
        console.log(`   ✅ Transaction committed successfully`);

        stats.followRecordsCreated += createdCount;
        stats.followRecordsSkipped += skippedCount;
        stats.userCountsUpdated += userCountUpdates.length;
      } catch (error) {
        await session.abortTransaction();
        console.error(`   ❌ Error migrating pet ${petId}:`, error);
        stats.errors++;
      } finally {
        session.endSession();
      }
    }

    // Print final statistics
    console.log('\n' + '='.repeat(60));
    console.log('📈 Migration Summary');
    console.log('='.repeat(60));
    console.log(`Total pets found:           ${stats.totalPets}`);
    console.log(`Pets with followers:        ${stats.petsWithFollowers}`);
    console.log(`Follow records created:     ${stats.followRecordsCreated}`);
    console.log(`Follow records skipped:     ${stats.followRecordsSkipped}`);
    console.log(`User counts updated:        ${stats.userCountsUpdated}`);
    console.log(`Errors:                     ${stats.errors}`);
    console.log('='.repeat(60));

    if (stats.errors === 0) {
      console.log('\n✨ Migration completed successfully!\n');
    } else {
      console.log(`\n⚠️  Migration completed with ${stats.errors} error(s)\n`);
    }
  } catch (error) {
    console.error('❌ Fatal error during migration:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('👋 Database connection closed\n');
  }
}

// Run migration if executed directly
if (require.main === module) {
  migratePetFollowers()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Unhandled error:', error);
      process.exit(1);
    });
}

export { migratePetFollowers };
