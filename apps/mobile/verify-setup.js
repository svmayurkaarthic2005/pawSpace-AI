#!/usr/bin/env node

/**
 * Quick verification script for Google Sign-In configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Google Sign-In Configuration...\n');

let hasErrors = false;

// Check 1: google-services.json exists
const googleServicesPath = path.join(__dirname, 'android', 'app', 'google-services.json');
if (!fs.existsSync(googleServicesPath)) {
  console.error('❌ google-services.json NOT FOUND!');
  console.error('   Location: android/app/google-services.json\n');
  hasErrors = true;
} else {
  console.log('✅ google-services.json exists');
  
  // Check 2: Verify contents
  try {
    const googleServices = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
    
    // Check package name
    const packageName = googleServices.client[0]?.client_info?.android_client_info?.package_name;
    if (packageName === 'com.mayur.pawspace') {
      console.log('✅ Package name matches: com.mayur.pawspace');
    } else {
      console.error(`❌ Package name mismatch: ${packageName}`);
      hasErrors = true;
    }
    
    // Check OAuth clients
    const oauthClients = googleServices.client[0]?.oauth_client || [];
    const androidClient = oauthClients.find(c => c.client_type === 1);
    const webClient = oauthClients.find(c => c.client_type === 3);
    
    if (androidClient) {
      console.log('✅ Android OAuth client (type 1) present');
      console.log(`   Client ID: ${androidClient.client_id}`);
      
      // Check SHA certificate
      if (androidClient.android_info?.certificate_hash) {
        console.log(`✅ SHA-1 certificate present: ${androidClient.android_info.certificate_hash}`);
      } else {
        console.error('❌ SHA certificate missing in Android OAuth client');
        hasErrors = true;
      }
    } else {
      console.error('❌ Android OAuth client (type 1) NOT FOUND');
      hasErrors = true;
    }
    
    if (webClient) {
      console.log('✅ Web OAuth client (type 3) present');
      console.log(`   Client ID: ${webClient.client_id}`);
    } else {
      console.error('❌ Web OAuth client (type 3) NOT FOUND');
      hasErrors = true;
    }
    
  } catch (error) {
    console.error('❌ Failed to parse google-services.json:', error.message);
    hasErrors = true;
  }
}

// Check 3: App.tsx configuration
const appTsxPath = path.join(__dirname, 'App.tsx');
if (!fs.existsSync(appTsxPath)) {
  console.error('❌ App.tsx NOT FOUND!');
  hasErrors = true;
} else {
  const appTsx = fs.readFileSync(appTsxPath, 'utf8');
  
  if (appTsx.includes('GoogleSignin.configure')) {
    console.log('✅ GoogleSignin.configure found in App.tsx');
    
    // Check for webClientId
    const webClientIdMatch = appTsx.match(/webClientId:\s*['"]([^'"]+)['"]/);
    if (webClientIdMatch) {
      console.log(`✅ webClientId configured: ${webClientIdMatch[1]}`);
      
      // Verify it ends with .apps.googleusercontent.com
      if (webClientIdMatch[1].endsWith('.apps.googleusercontent.com')) {
        console.log('✅ webClientId format is valid');
      } else {
        console.error('❌ webClientId format looks invalid');
        hasErrors = true;
      }
    } else {
      console.error('❌ webClientId NOT FOUND in App.tsx');
      hasErrors = true;
    }
  } else {
    console.error('❌ GoogleSignin.configure NOT FOUND in App.tsx');
    hasErrors = true;
  }
}

// Check 4: AndroidManifest.xml permissions
const manifestPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (!fs.existsSync(manifestPath)) {
  console.error('❌ AndroidManifest.xml NOT FOUND!');
  hasErrors = true;
} else {
  const manifest = fs.readFileSync(manifestPath, 'utf8');
  
  if (manifest.includes('android.permission.INTERNET')) {
    console.log('✅ INTERNET permission present in AndroidManifest.xml');
  } else {
    console.error('❌ INTERNET permission MISSING in AndroidManifest.xml');
    hasErrors = true;
  }
}

// Check 5: build.gradle has google-services plugin
const buildGradlePath = path.join(__dirname, 'android', 'app', 'build.gradle');
if (!fs.existsSync(buildGradlePath)) {
  console.error('❌ build.gradle NOT FOUND!');
  hasErrors = true;
} else {
  const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
  
  if (buildGradle.includes('com.google.gms.google-services')) {
    console.log('✅ google-services plugin applied in build.gradle');
  } else {
    console.error('❌ google-services plugin NOT FOUND in build.gradle');
    hasErrors = true;
  }
  
  // Check applicationId
  const appIdMatch = buildGradle.match(/applicationId\s+["']([^"']+)["']/);
  if (appIdMatch) {
    if (appIdMatch[1] === 'com.mayur.pawspace') {
      console.log('✅ applicationId matches: com.mayur.pawspace');
    } else {
      console.error(`❌ applicationId mismatch: ${appIdMatch[1]} (expected: com.mayur.pawspace)`);
      hasErrors = true;
    }
  }
}

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('❌ CONFIGURATION HAS ERRORS!');
  console.log('\nPlease fix the errors above before testing.\n');
  process.exit(1);
} else {
  console.log('✅ ALL CHECKS PASSED!');
  console.log('\nConfiguration looks good. Now:');
  console.log('1. Verify SHA-256 is added to Firebase Console');
  console.log('2. Verify Google Sign-In is enabled in Firebase Authentication');
  console.log('3. Download FRESH google-services.json from Firebase');
  console.log('4. Run: cd android && ./gradlew clean && cd ..');
  console.log('5. Run: npx react-native run-android\n');
  process.exit(0);
}
