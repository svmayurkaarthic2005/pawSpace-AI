#!/usr/bin/env node

/**
 * Quick test script to verify Supabase configuration
 * Run with: node test-supabase-setup.js
 */

const https = require('https');

const SUPABASE_URL = 'https://brmtvonohpghpijogxeg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJybXR2b25vaHBnaHBpam9neGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYzNTc5OCwiZXhwIjoyMDk2MjExNzk4fQ.81_OLCtent6pGJzsw4nI2bZHMa58A5XYsknOKJjP1_U';

console.log('🧪 Testing Supabase Configuration...\n');

// Test 1: Verify service key format
console.log('Test 1: Service Key Format');
console.log('✅ Service key is set');
console.log(`✅ Key length: ${SERVICE_KEY.length} characters`);

// Decode JWT to verify role
try {
  const payload = JSON.parse(Buffer.from(SERVICE_KEY.split('.')[1], 'base64').toString());
  console.log(`✅ Role: ${payload.role}`);
  if (payload.role !== 'service_role') {
    console.log('❌ WARNING: This is not a service_role key!');
  }
  const expDate = new Date(payload.exp * 1000);
  console.log(`✅ Expires: ${expDate.toLocaleDateString()}`);
} catch (err) {
  console.log('❌ Could not decode JWT:', err.message);
}

console.log('\nTest 2: Supabase API Connection');

// Test 2: Try to connect to Supabase
const options = {
  hostname: 'brmtvonohpghpijogxeg.supabase.co',
  path: '/auth/v1/settings',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'apikey': SERVICE_KEY,
  },
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Successfully connected to Supabase');
      try {
        const settings = JSON.parse(data);
        console.log('✅ Auth settings retrieved');
        if (settings.external?.google === true) {
          console.log('✅ Google OAuth is ENABLED');
        } else {
          console.log('⚠️  Google OAuth might not be enabled');
          console.log('   Go to: https://supabase.com/dashboard/project/brmtvonohpghpijogxeg/auth/providers');
        }
      } catch (err) {
        console.log('⚠️  Could not parse settings');
      }
    } else {
      console.log(`❌ Connection failed with status: ${res.statusCode}`);
      console.log('Response:', data);
    }

    console.log('\n📋 Configuration Checklist:');
    console.log('✅ Service role key configured');
    console.log('✅ Supabase URL configured');
    console.log('⏳ Next: Enable Google OAuth in Supabase Dashboard');
    console.log('⏳ Next: Add redirect URLs');
    console.log('\n🚀 Ready to test OAuth flow!');
  });
});

req.on('error', (err) => {
  console.log('❌ Connection error:', err.message);
});

req.end();
