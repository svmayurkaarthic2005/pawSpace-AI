/**
 * Integration Test: Pagination Limits
 * 
 * This script tests the pagination validation utility and verifies
 * that the maximum page size of 50 is enforced correctly.
 */

import { validatePagination, MAX_PAGE_SIZE } from '../utils';

function runTests() {
  console.log('\n=== Pagination Limits Integration Test ===\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Valid parameters within limits
  try {
    const result = validatePagination(1, 20);
    if (result.page === 1 && result.limit === 20) {
      console.log('✅ Test 1: Valid parameters (page=1, limit=20) -> PASSED');
      passed++;
    } else {
      console.log('❌ Test 1: Valid parameters -> FAILED (unexpected values)');
      failed++;
    }
  } catch (err) {
    console.log('❌ Test 1: Valid parameters -> FAILED (threw error)');
    failed++;
  }
  
  // Test 2: Limit exceeds maximum (should cap at 50)
  try {
    const result = validatePagination(1, 100);
    if (result.page === 1 && result.limit === 50) {
      console.log('✅ Test 2: Limit exceeds max (limit=100) capped to 50 -> PASSED');
      passed++;
    } else {
      console.log(`❌ Test 2: Limit exceeds max -> FAILED (got limit=${result.limit}, expected 50)`);
      failed++;
    }
  } catch (err) {
    console.log('❌ Test 2: Limit exceeds max -> FAILED (threw error)');
    failed++;
  }
  
  // Test 3: Invalid page (zero)
  try {
    validatePagination(0, 20);
    console.log('❌ Test 3: Invalid page=0 -> FAILED (should throw error)');
    failed++;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid page parameter')) {
      console.log('✅ Test 3: Invalid page=0 throws error -> PASSED');
      passed++;
    } else {
      console.log('❌ Test 3: Invalid page=0 -> FAILED (wrong error message)');
      failed++;
    }
  }
  
  // Test 4: Invalid page (negative)
  try {
    validatePagination(-1, 20);
    console.log('❌ Test 4: Invalid page=-1 -> FAILED (should throw error)');
    failed++;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid page parameter')) {
      console.log('✅ Test 4: Invalid page=-1 throws error -> PASSED');
      passed++;
    } else {
      console.log('❌ Test 4: Invalid page=-1 -> FAILED (wrong error message)');
      failed++;
    }
  }
  
  // Test 5: Invalid limit (zero)
  try {
    validatePagination(1, 0);
    console.log('❌ Test 5: Invalid limit=0 -> FAILED (should throw error)');
    failed++;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid limit parameter')) {
      console.log('✅ Test 5: Invalid limit=0 throws error -> PASSED');
      passed++;
    } else {
      console.log('❌ Test 5: Invalid limit=0 -> FAILED (wrong error message)');
      failed++;
    }
  }
  
  // Test 6: Invalid limit (negative)
  try {
    validatePagination(1, -5);
    console.log('❌ Test 6: Invalid limit=-5 -> FAILED (should throw error)');
    failed++;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid limit parameter')) {
      console.log('✅ Test 6: Invalid limit=-5 throws error -> PASSED');
      passed++;
    } else {
      console.log('❌ Test 6: Invalid limit=-5 -> FAILED (wrong error message)');
      failed++;
    }
  }
  
  // Test 7: String parameters (valid)
  try {
    const result = validatePagination('2', '30');
    if (result.page === 2 && result.limit === 30) {
      console.log('✅ Test 7: String parameters ("2", "30") converted correctly -> PASSED');
      passed++;
    } else {
      console.log('❌ Test 7: String parameters -> FAILED (unexpected values)');
      failed++;
    }
  } catch (err) {
    console.log('❌ Test 7: String parameters -> FAILED (threw error)');
    failed++;
  }
  
  // Test 8: Invalid string parameters
  try {
    validatePagination('abc', '20');
    console.log('❌ Test 8: Invalid string page="abc" -> FAILED (should throw error)');
    failed++;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid page parameter')) {
      console.log('✅ Test 8: Invalid string page="abc" throws error -> PASSED');
      passed++;
    } else {
      console.log('❌ Test 8: Invalid string page="abc" -> FAILED (wrong error message)');
      failed++;
    }
  }
  
  // Test 9: Limit exactly at maximum (should not be capped)
  try {
    const result = validatePagination(1, 50);
    if (result.page === 1 && result.limit === 50) {
      console.log('✅ Test 9: Limit at max (limit=50) unchanged -> PASSED');
      passed++;
    } else {
      console.log('❌ Test 9: Limit at max -> FAILED (unexpected values)');
      failed++;
    }
  } catch (err) {
    console.log('❌ Test 9: Limit at max -> FAILED (threw error)');
    failed++;
  }
  
  // Test 10: Very large limit (should cap at 50)
  try {
    const result = validatePagination(5, 1000);
    if (result.page === 5 && result.limit === 50) {
      console.log('✅ Test 10: Very large limit (limit=1000) capped to 50 -> PASSED');
      passed++;
    } else {
      console.log(`❌ Test 10: Very large limit -> FAILED (got limit=${result.limit}, expected 50)`);
      failed++;
    }
  } catch (err) {
    console.log('❌ Test 10: Very large limit -> FAILED (threw error)');
    failed++;
  }
  
  console.log('\n=== Test Results ===\n');
  console.log(`Total: ${passed + failed}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Pagination limits are correctly implemented.\n');
    console.log(`✓ Maximum page size enforced: ${MAX_PAGE_SIZE}`);
    console.log('✓ Page parameter validation working');
    console.log('✓ Limit parameter validation working');
    console.log('✓ String to number conversion working');
    console.log('✓ Proper error messages returned\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.\n');
    process.exit(1);
  }
}

// Run tests
runTests();
