// Quick test to verify current cart functionality and show cart URLs
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
    searchQuery: "Test Location",
    city: "Paris",
    country: "France",
    coordinates: "48.857°N / 2.352°E"
  },
  productSettings: {
    shape: 'rectangle',
    size: 'standard',
    material: 'oak',
    aspectRatio: 2.62
  },
  customizations: {
    texts: [{ id: 'test', content: 'Test Map', x: 50, y: 70, fontSize: 24, fontFamily: 'Inter Bold', color: 'black' }],
    icons: [],
  },
  price: 64.99
};

async function testCartCreation() {
  console.log('🛒 TESTING CART CREATION AND ACCESS');
  console.log('================================');
  
  try {
    // Create a new cart
    const response = await fetch('http://localhost:3000/api/shopify/add-to-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: testConfig,
        mapData: testMapData
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Cart created successfully!');
      console.log('');
      console.log('📋 CART DETAILS:');
      console.log(`   Cart ID: ${result.cart.id}`);
      console.log(`   Total Items: ${result.cart.totalQuantity}`);
      console.log('');
      console.log('🔗 IMPORTANT - CART ACCESS:');
      console.log(`   Checkout URL: ${result.checkoutUrl}`);
      console.log('');
      console.log('💡 HOW TO ACCESS YOUR CART:');
      console.log('   1. Use the checkout URL above (this is the correct cart)');
      console.log('   2. The general /cart page will be empty - this is normal');
      console.log('   3. Storefront API carts have unique URLs with checkout tokens');
      console.log('');
      console.log('✨ In the app, clicking "Add to Cart" should:');
      console.log('   - Show a success toast with "View Cart" and "Checkout" buttons');
      console.log('   - Automatically open the cart in a new tab after 1.5 seconds');
      console.log('   - Take you directly to your cart with the custom map');
      
      return result.checkoutUrl;
    } else {
      console.log('❌ Cart creation failed:', result.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

testCartCreation();