/**
 * Script to fix events with invalid (0,0) coordinates
 * Run: npx ts-node src/scripts/fix-event-coordinates.ts
 */

import mongoose from 'mongoose';
import { Event } from '../models/event.model';
import { geocodeAddress } from '../utils/googleMaps.util';
import { env } from '../config/env';

async function fixEventCoordinates() {
  try {
    // Connect to database
    await mongoose.connect(env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Find events with invalid coordinates (0, 0)
    const invalidEvents = await Event.find({
      'location.coordinates.coordinates': [0, 0],
    }).exec();

    console.log(`\nFound ${invalidEvents.length} events with invalid coordinates`);

    if (invalidEvents.length === 0) {
      console.log('✓ All events have valid coordinates!');
      process.exit(0);
    }

    let fixed = 0;
    let failed = 0;

    for (const event of invalidEvents) {
      try {
        console.log(`\nProcessing: ${event.title}`);
        console.log(`  Address: ${event.location.address}`);

        // Try to geocode the address
        const geocoded = await geocodeAddress(event.location.address);

        if (geocoded) {
          event.location.coordinates.coordinates = [geocoded.lng, geocoded.lat];
          await event.save();
          console.log(`  ✓ Fixed: [${geocoded.lng}, ${geocoded.lat}]`);
          fixed++;
        } else {
          console.log(`  ✗ Failed to geocode`);
          failed++;
        }

        // Rate limit to avoid hitting API limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`  ✗ Error:`, error);
        failed++;
      }
    }

    console.log(`\n========================================`);
    console.log(`Summary:`);
    console.log(`  Total: ${invalidEvents.length}`);
    console.log(`  Fixed: ${fixed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`========================================\n`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  fixEventCoordinates();
}

export default fixEventCoordinates;
