// Quick script to get first available product variant ID
const testConfig = {
  storeName: 'vgpcreatives',
  storefrontAccessToken: '172c37b6b7a7759406ad719a4f149d42',
  productVariantId: 'placeholder'
};

async function getFirstValidVariant() {
  try {
    const response = await fetch('http://localhost:3000/api/shopify/find-products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testConfig)
    });
    
    const data = await response.json();
    
    if (data.success && data.products && data.products.length > 0) {
      for (const product of data.products) {
        if (product.variants && product.variants.length > 0) {
          for (const variant of product.variants) {
            if (variant.availableForSale) {
              console.log('🎯 FOUND VALID PRODUCT VARIANT:');
              console.log(`Product: ${product.title}`);
              console.log(`Variant: ${variant.title}`);
              console.log(`Price: $${variant.price.amount} ${variant.price.currencyCode}`);
              console.log(`Variant ID: ${variant.id}`);
              console.log('\n📋 UPDATE YOUR CONFIG WITH:');
              console.log(`productVariantId: '${variant.id}'`);
              return variant.id;
            }
          }
        }
      }
    }
    
    console.log('❌ No available product variants found');
    return null;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

getFirstValidVariant();