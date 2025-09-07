// Comprehensive Add-to-Cart Testing Script
// This tests all add-to-cart functionality systematically

const testConfig = {
  storeName: 'vgpcreatives',
  storefrontAccessToken: '172c37b6b7a7759406ad719a4f149d42',
  productVariantId: 'gid://shopify/ProductVariant/41068385009711'
};

const testMapData = {
  location: {
    lat: 48.8566,
    lng: 2.3522,
    zoom: 12,
    searchQuery: "Paris, France",
    city: "PARIS",
    country: "FRANCE",
    coordinates: "48.857°N / 2.352°E"
  },
  productSettings: {
    shape: 'rectangle',
    size: 'standard',
    material: 'oak',
    aspectRatio: 2.62
  },
  customizations: {
    texts: [
      {
        id: 'test-text-1',
        content: 'PARIS',
        x: 50,
        y: 70,
        fontSize: 36,
        fontFamily: 'Inter Bold',
        color: 'black'
      }
    ],
    icons: [
      {
        id: 'test-icon-1',
        type: 'star',
        x: 25,
        y: 25,
        size: 32
      }
    ]
  },
  price: 64.99
};

async function testEndpoint(url, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function runComprehensiveTests() {
  console.log('🧪 Starting Comprehensive Add-to-Cart Tests...\n');
  
  const tests = [];
  
  // Test 1: Health Check
  console.log('1️⃣ Testing Shopify Health Check...');
  const healthCheck = await testEndpoint('http://localhost:3000/api/shopify/health-check', 'POST', testConfig);
  tests.push({
    name: 'Shopify Health Check',
    passed: healthCheck.success && healthCheck.data?.success,
    details: healthCheck.data?.results || healthCheck.error,
    critical: true
  });
  
  // Test 2: Connection Test
  console.log('2️⃣ Testing Shopify Connection...');
  const connectionTest = await testEndpoint('http://localhost:3000/api/shopify/test-connection', 'POST', testConfig);
  tests.push({
    name: 'Shopify Connection',
    passed: connectionTest.success && connectionTest.data?.success,
    details: connectionTest.data?.variant || connectionTest.error,
    critical: true
  });
  
  // Test 3: Product Finding
  console.log('3️⃣ Testing Product Finding...');
  const productTest = await testEndpoint('http://localhost:3000/api/shopify/find-products', 'POST', testConfig);
  tests.push({
    name: 'Product Discovery',
    passed: productTest.success && productTest.data?.success,
    details: `Found ${productTest.data?.products?.length || 0} products`,
    critical: false
  });
  
  // Test 4: Cart Creation (Add to Cart)
  console.log('4️⃣ Testing Add to Cart (New Cart)...');
  const addToCartTest = await testEndpoint('http://localhost:3000/api/shopify/add-to-cart', 'POST', {
    config: testConfig,
    mapData: testMapData
  });
  tests.push({
    name: 'Add to Cart (New)',
    passed: addToCartTest.success && addToCartTest.data?.success,
    details: addToCartTest.data?.cart || addToCartTest.error,
    critical: true
  });
  
  let cartId = null;
  if (addToCartTest.success && addToCartTest.data?.cart?.id) {
    cartId = addToCartTest.data.cart.id;
    
    // Test 5: Cart Retrieval
    console.log('5️⃣ Testing Cart Retrieval...');
    const getCartTest = await testEndpoint('http://localhost:3000/api/shopify/get-cart', 'POST', {
      config: testConfig,
      cartId: cartId
    });
    tests.push({
      name: 'Cart Retrieval',
      passed: getCartTest.success && getCartTest.data?.success,
      details: `Cart has ${getCartTest.data?.cart?.totalQuantity || 0} items`,
      critical: false
    });
    
    // Test 6: Add to Existing Cart
    console.log('6️⃣ Testing Add to Existing Cart...');
    const addToExistingTest = await testEndpoint('http://localhost:3000/api/shopify/add-to-cart', 'POST', {
      config: testConfig,
      mapData: { ...testMapData, price: 89.99 }, // Different price for variety
      cartId: cartId
    });
    tests.push({
      name: 'Add to Existing Cart',
      passed: addToExistingTest.success && addToExistingTest.data?.success,
      details: `Total items: ${addToExistingTest.data?.cart?.totalQuantity || 0}`,
      critical: false
    });
  }
  
  // Test 7: Error Handling (Invalid Config)
  console.log('7️⃣ Testing Error Handling...');
  const errorTest = await testEndpoint('http://localhost:3000/api/shopify/test-connection', 'POST', {
    storeName: 'invalid-store-name',
    storefrontAccessToken: 'invalid-token',
    productVariantId: 'invalid-id'
  });
  tests.push({
    name: 'Error Handling',
    passed: !errorTest.success || (errorTest.data && !errorTest.data.success),
    details: 'Properly handles invalid configuration',
    critical: false
  });
  
  // Print Results
  console.log('\n📊 TEST RESULTS SUMMARY:');
  console.log('═'.repeat(50));
  
  let criticalPassed = 0;
  let criticalTotal = 0;
  let allPassed = 0;
  
  tests.forEach((test, index) => {
    const status = test.passed ? '✅ PASS' : '❌ FAIL';
    const critical = test.critical ? ' (CRITICAL)' : '';
    
    console.log(`${index + 1}. ${test.name}${critical}: ${status}`);
    if (typeof test.details === 'object') {
      console.log(`   Details: ${JSON.stringify(test.details, null, 2).slice(0, 200)}...`);
    } else {
      console.log(`   Details: ${test.details}`);
    }
    
    if (test.passed) allPassed++;
    if (test.critical) {
      criticalTotal++;
      if (test.passed) criticalPassed++;
    }
  });
  
  console.log('\n🎯 FINAL ASSESSMENT:');
  console.log(`Critical Tests: ${criticalPassed}/${criticalTotal} passed`);
  console.log(`All Tests: ${allPassed}/${tests.length} passed`);
  
  const isReady = criticalPassed === criticalTotal;
  console.log(`\n${isReady ? '🟢 ADD-TO-CART IS READY!' : '🔴 ISSUES NEED ATTENTION'}`);
  
  if (isReady) {
    console.log('✨ All critical functionality is working correctly!');
    if (cartId) {
      console.log(`🛒 Test cart created with ID: ${cartId}`);
    }
  } else {
    console.log('⚠️  Please review failed critical tests above.');
  }
  
  return { tests, isReady, cartId };
}

// Run the tests if this script is executed directly
if (typeof window === 'undefined') {
  runComprehensiveTests().catch(console.error);
}