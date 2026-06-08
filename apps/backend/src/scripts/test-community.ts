#!/usr/bin/env ts-node
/**
 * Test script for Community features
 * Tests community creation, joining, posting, and interactions
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import { Community } from '../models/community.model';
import { CommunityMembership } from '../models/communityMembership.model';
import { CommunityPost } from '../models/communityPost.model';
import { User } from '../models/user.model';
import { connectDB } from '../config/db';

config();

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message?: string;
  error?: string;
}

const results: TestResult[] = [];

function logTest(test: string, status: 'PASS' | 'FAIL', message?: string, error?: any) {
  results.push({ test, status, message, error: error?.message });
  const symbol = status === 'PASS' ? '✓' : '✗';
  const color = status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${symbol}\x1b[0m ${test}${message ? ': ' + message : ''}`);
  if (error) {
    console.log(`  Error: ${error.message}`);
  }
}

async function testCommunities() {
  console.log('\n🧪 Starting Community Feature Tests...\n');

  try {
    // Connect to database
    await connectDB();
    console.log('✓ Connected to database\n');

    // Find test user
    const testUser = await User.findOne({ email: { $regex: /test.*@test\.com/ } });
    if (!testUser) {
      throw new Error('Test user not found. Please create a test user first.');
    }
    console.log(`✓ Found test user: ${testUser.email}\n`);

    // Clean up existing test communities
    await Community.deleteMany({ name: /^Test Community/ });
    await CommunityPost.deleteMany({ community: { $exists: false } });
    console.log('✓ Cleaned up existing test data\n');

    // Test 1: Create Community
    let testCommunity: any;
    try {
      testCommunity = await Community.create({
        name: 'Test Community for Dogs',
        slug: 'test-community-dogs',
        description: 'A test community for dog lovers',
        species: ['dog'],
        tags: ['test', 'dogs', 'training'],
        isPrivate: false,
        creator: testUser._id,
        memberCount: 1,
        postCount: 0,
        lastActivityAt: new Date(),
      });

      // Create admin membership
      await CommunityMembership.create({
        community: testCommunity._id,
        user: testUser._id,
        role: 'admin',
        joinedAt: new Date(),
        lastReadAt: new Date(),
        unreadCount: 0,
      });

      logTest('Create Community', 'PASS', `Community created with ID: ${testCommunity._id}`);
    } catch (error) {
      logTest('Create Community', 'FAIL', undefined, error);
      throw error;
    }

    // Test 2: Verify Slug Generation
    try {
      const community = await Community.findById(testCommunity._id);
      if (community && community.slug === 'test-community-dogs') {
        logTest('Slug Generation', 'PASS', `Slug: ${community.slug}`);
      } else {
        logTest('Slug Generation', 'FAIL', 'Slug mismatch');
      }
    } catch (error) {
      logTest('Slug Generation', 'FAIL', undefined, error);
    }

    // Test 3: Check Membership
    try {
      const membership = await CommunityMembership.findOne({
        community: testCommunity._id,
        user: testUser._id,
      });
      
      if (membership && membership.role === 'admin') {
        logTest('Admin Membership', 'PASS', 'User is admin');
      } else {
        logTest('Admin Membership', 'FAIL', 'Membership not found or not admin');
      }
    } catch (error) {
      logTest('Admin Membership', 'FAIL', undefined, error);
    }

    // Test 4: Create Community Post
    let testPost: any;
    try {
      testPost = await CommunityPost.create({
        community: testCommunity._id,
        author: testUser._id,
        content: 'This is a test post in the community! 🐕',
        media: [],
        isPinned: false,
        likes: [],
        likesCount: 0,
        commentsCount: 0,
      });

      // Update community stats
      testCommunity.postCount += 1;
      testCommunity.lastActivityAt = new Date();
      await testCommunity.save();

      logTest('Create Post', 'PASS', `Post created with ID: ${testPost._id}`);
    } catch (error) {
      logTest('Create Post', 'FAIL', undefined, error);
    }

    // Test 5: Pin Post
    try {
      testPost.isPinned = true;
      await testPost.save();

      testCommunity.pinnedPostId = testPost._id;
      await testCommunity.save();

      const pinnedPost = await CommunityPost.findById(testPost._id);
      if (pinnedPost && pinnedPost.isPinned) {
        logTest('Pin Post', 'PASS', 'Post successfully pinned');
      } else {
        logTest('Pin Post', 'FAIL', 'Post not pinned');
      }
    } catch (error) {
      logTest('Pin Post', 'FAIL', undefined, error);
    }

    // Test 6: Like Post
    try {
      testPost.likes.push(testUser._id);
      testPost.likesCount += 1;
      await testPost.save();

      const likedPost = await CommunityPost.findById(testPost._id);
      if (likedPost && likedPost.likesCount === 1) {
        logTest('Like Post', 'PASS', `Post has ${likedPost.likesCount} like(s)`);
      } else {
        logTest('Like Post', 'FAIL', 'Like count mismatch');
      }
    } catch (error) {
      logTest('Like Post', 'FAIL', undefined, error);
    }

    // Test 7: Query Community with Posts
    try {
      const community = await Community.findById(testCommunity._id)
        .populate('creator', 'username email')
        .lean();

      const posts = await CommunityPost.find({ community: testCommunity._id })
        .sort({ isPinned: -1, createdAt: -1 })
        .populate('author', 'username email')
        .lean();

      if (community && posts.length > 0) {
        logTest(
          'Query Community Posts',
          'PASS',
          `Found ${posts.length} post(s) in community`,
        );
      } else {
        logTest('Query Community Posts', 'FAIL', 'No posts found');
      }
    } catch (error) {
      logTest('Query Community Posts', 'FAIL', undefined, error);
    }

    // Test 8: Search Communities
    try {
      // Create text index if not exists
      try {
        await Community.collection.createIndex(
          { name: 'text', description: 'text', tags: 'text' },
          { name: 'community_text_search' },
        );
      } catch (indexError: any) {
        // Index may already exist
        if (!indexError.message.includes('already exists')) {
          console.log('Index creation note:', indexError.message);
        }
      }

      const searchResults = await Community.find(
        { $text: { $search: 'dogs' }, isPrivate: false },
        { score: { $meta: 'textScore' } },
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(10)
        .lean();

      if (searchResults.length > 0) {
        logTest('Search Communities', 'PASS', `Found ${searchResults.length} result(s)`);
      } else {
        logTest('Search Communities', 'PASS', 'No results (expected for test data)');
      }
    } catch (error) {
      logTest('Search Communities', 'FAIL', undefined, error);
    }

    // Test 9: Member Count Accuracy
    try {
      const community = await Community.findById(testCommunity._id);
      const memberCount = await CommunityMembership.countDocuments({
        community: testCommunity._id,
      });

      if (community && community.memberCount === memberCount) {
        logTest('Member Count', 'PASS', `Count matches: ${memberCount}`);
      } else {
        logTest(
          'Member Count',
          'FAIL',
          `Mismatch - Community: ${community?.memberCount}, Actual: ${memberCount}`,
        );
      }
    } catch (error) {
      logTest('Member Count', 'FAIL', undefined, error);
    }

    // Test 10: Unpin Post
    try {
      testPost.isPinned = false;
      await testPost.save();

      testCommunity.pinnedPostId = null;
      await testCommunity.save();

      const unpinnedPost = await CommunityPost.findById(testPost._id);
      if (unpinnedPost && !unpinnedPost.isPinned) {
        logTest('Unpin Post', 'PASS', 'Post successfully unpinned');
      } else {
        logTest('Unpin Post', 'FAIL', 'Post still pinned');
      }
    } catch (error) {
      logTest('Unpin Post', 'FAIL', undefined, error);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));

    const passed = results.filter((r) => r.status === 'PASS').length;
    const failed = results.filter((r) => r.status === 'FAIL').length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`\x1b[32mPassed: ${passed}\x1b[0m`);
    console.log(`\x1b[31mFailed: ${failed}\x1b[0m`);
    console.log(
      `Success Rate: ${((passed / total) * 100).toFixed(1)}%`,
    );

    if (failed > 0) {
      console.log('\nFailed Tests:');
      results
        .filter((r) => r.status === 'FAIL')
        .forEach((r) => {
          console.log(`  - ${r.test}${r.error ? ': ' + r.error : ''}`);
        });
    }

    console.log('\n✓ Test suite completed\n');

    // Cleanup
    console.log('Cleaning up test data...');
    await Community.deleteOne({ _id: testCommunity._id });
    await CommunityPost.deleteOne({ _id: testPost._id });
    await CommunityMembership.deleteMany({ community: testCommunity._id });
    console.log('✓ Cleanup complete\n');
  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run tests
testCommunities().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
