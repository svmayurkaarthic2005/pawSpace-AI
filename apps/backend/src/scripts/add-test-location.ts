import mongoose from 'mongoose';
import { User } from '../models/user.model';
import { env } from '../config/env';

/**
 * Script to add test location to a user
 * Usage: npx ts-node src/scripts/add-test-location.ts <username>
 */

async function addTestLocation(username: string) {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ username: username.toLowerCase() });
    
    if (!user) {
      console.error(`❌ User "${username}" not found`);
      process.exit(1);
    }

    // Add location name (you can customize this)
    user.locationName = 'Chennai, India';
    
    // Optionally add geo coordinates for Chennai
    user.location = {
      type: 'Point',
      coordinates: [80.2707, 13.0827], // [longitude, latitude]
    };

    await user.save();

    console.log(`✅ Location added to user "${username}"`);
    console.log(`   Location: ${user.locationName}`);
    console.log(`   Coordinates: ${user.location?.coordinates}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

const username = process.argv[2];

if (!username) {
  console.error('Usage: npx ts-node src/scripts/add-test-location.ts <username>');
  process.exit(1);
}

addTestLocation(username);
