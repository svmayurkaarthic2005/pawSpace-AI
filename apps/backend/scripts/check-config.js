#!/usr/bin/env node
/**
 * Configuration validation script
 * Run: node scripts/check-config.js
 */

require('dotenv').config();

const checks = {
  'Google Maps API': {
    key: 'GOOGLE_MAPS_API_KEY',
    required: true,
    validate: (val) => val && val.length > 20 && val !== 'your_google_maps_api_key_here',
    error: 'Google Maps API key not configured. Event creation will fail.',
    guide: 'See EVENTS_FIX_GUIDE.md for setup instructions',
  },
  'MongoDB': {
    key: 'MONGODB_URI',
    required: true,
    validate: (val) => val && val.startsWith('mongodb'),
    error: 'MongoDB connection string not configured',
  },
  'Redis': {
    key: 'REDIS_URL',
    required: true,
    validate: (val) => val && val.startsWith('redis'),
    error: 'Redis connection string not configured',
  },
  'JWT Secret': {
    key: 'JWT_SECRET',
    required: true,
    validate: (val) => val && val.length >= 32,
    error: 'JWT_SECRET must be at least 32 characters',
  },
  'Cloudinary': {
    key: 'CLOUDINARY_API_KEY',
    required: true,
    validate: (val) => !!val,
    error: 'Cloudinary not configured. Image uploads will fail.',
  },
  'Firebase': {
    key: 'FIREBASE_PROJECT_ID',
    required: true,
    validate: (val) => !!val,
    error: 'Firebase not configured. Push notifications will fail.',
  },
  'Groq AI': {
    key: 'GROQ_API_KEY',
    required: false,
    validate: (val) => !!val,
    error: 'Groq AI not configured. AI features will be disabled.',
  },
};

console.log('\n🔍 PawSpace Backend Configuration Check\n');
console.log('=' .repeat(60));

let errors = 0;
let warnings = 0;

for (const [name, check] of Object.entries(checks)) {
  const value = process.env[check.key];
  const isValid = check.validate(value);
  
  if (!isValid && check.required) {
    console.log(`\n❌ ${name}`);
    console.log(`   ${check.error}`);
    if (check.guide) {
      console.log(`   📖 ${check.guide}`);
    }
    errors++;
  } else if (!isValid && !check.required) {
    console.log(`\n⚠️  ${name}`);
    console.log(`   ${check.error}`);
    warnings++;
  } else {
    console.log(`\n✅ ${name}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log(`\nSummary: ${errors} error(s), ${warnings} warning(s)\n`);

if (errors > 0) {
  console.log('❌ Configuration has critical errors. Fix them before starting the server.\n');
  process.exit(1);
} else if (warnings > 0) {
  console.log('⚠️  Configuration has warnings. Some features may not work.\n');
  process.exit(0);
} else {
  console.log('✅ All required services are configured!\n');
  process.exit(0);
}
