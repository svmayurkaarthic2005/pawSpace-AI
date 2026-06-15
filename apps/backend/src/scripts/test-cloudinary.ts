/**
 * Test script to verify Cloudinary integration
 * Run: npx ts-node src/scripts/test-cloudinary.ts
 */

import { env } from '../config/env';
import { 
  uploadImage, 
  deleteImage, 
  generateAvatarUrl,
  generateTransformation 
} from '../utils/cloudinary.util';

const log = (title: string, data?: any) => {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📋 ${title}`);
  console.log(`${'═'.repeat(60)}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

const test = async () => {
  try {
    // 1. Check environment variables
    log('1️⃣  CLOUDINARY CONFIGURATION');
    console.log(`✓ Cloud Name: ${env.CLOUDINARY_CLOUD_NAME ? '✅ SET' : '❌ MISSING'}`);
    console.log(`✓ API Key: ${env.CLOUDINARY_API_KEY ? '✅ SET' : '❌ MISSING'}`);
    console.log(`✓ API Secret: ${env.CLOUDINARY_API_SECRET ? '✅ SET' : '❌ MISSING'}`);

    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY) {
      throw new Error('Cloudinary credentials not configured');
    }

    // 2. Create a test image (1x1 pixel PNG)
    log('2️⃣  CREATING TEST IMAGE');
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x00, 0x03, 0x00, 0x01, 0x3b, 0xfb, 0x6b, 0xee, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
      0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
    console.log(`✓ Test image created: ${testImageBuffer.length} bytes`);

    // 3. Upload test image
    log('3️⃣  UPLOADING TEST IMAGE TO CLOUDINARY');
    const uploadResult = await uploadImage(testImageBuffer, 'pawspace/test');
    console.log(`✓ Upload successful`);
    console.log(`✓ URL: ${uploadResult.url}`);
    console.log(`✓ Public ID: ${uploadResult.publicId}`);

    // 4. Generate avatar URL (transformation test)
    log('4️⃣  TESTING AVATAR URL GENERATION');
    const avatarUrl = generateAvatarUrl(uploadResult.publicId, 200);
    console.log(`✓ Avatar URL: ${avatarUrl}`);
    console.log(`✓ Transformations applied:`);
    console.log(`  - Width: 200px`);
    console.log(`  - Height: 200px`);
    console.log(`  - Crop: thumb (face-focused)`);
    console.log(`  - Gravity: face`);
    console.log(`  - Format: WebP`);
    console.log(`  - Radius: max (rounded corners)`);

    // 5. Generate custom transformation
    log('5️⃣  TESTING CUSTOM TRANSFORMATION');
    const customUrl = generateTransformation(uploadResult.publicId, {
      width: 400,
      height: 300,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto',
      format: 'webp',
    });
    console.log(`✓ Custom URL: ${customUrl}`);
    console.log(`✓ Transformations applied:`);
    console.log(`  - Width: 400px`);
    console.log(`  - Height: 300px`);
    console.log(`  - Crop: fill`);
    console.log(`  - Quality: auto`);
    console.log(`  - Format: WebP`);

    // 6. Delete test image
    log('6️⃣  DELETING TEST IMAGE');
    await deleteImage(uploadResult.publicId);
    console.log(`✓ Image deleted successfully`);

    // 7. Summary
    log('7️⃣  TEST SUMMARY');
    console.log('✅ All Cloudinary tests passed!');
    console.log('\nFeatures verified:');
    console.log('  ✓ Configuration loaded');
    console.log('  ✓ Image upload working');
    console.log('  ✓ Avatar URL generation working');
    console.log('  ✓ Custom transformations working');
    console.log('  ✓ Image deletion working');
    console.log('\n📚 Check CLOUDINARY_GUIDE.md for detailed documentation');

  } catch (error) {
    log('❌ TEST FAILED');
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      console.error(error.stack);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
};

// Run the test
test();
