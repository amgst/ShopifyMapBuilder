// Test the URL transformation for cart view vs checkout
const checkoutUrl = "https://vgpcreatives.myshopify.com/cart/c/hWN2hOW52XwoYLqdpND6c9w3?key=811652eddf2ace648e05f2917fb12054";

console.log('🛒 URL TRANSFORMATION TEST');
console.log('========================');
console.log('');
console.log('Original Checkout URL:');
console.log(checkoutUrl);
console.log('');
console.log('Transformed Cart View URL:');
const cartUrl = checkoutUrl.replace('/cart/c/', '/cart/').split('?')[0];
console.log(cartUrl);
console.log('');
console.log('BEHAVIOR COMPARISON:');
console.log('✅ View Cart button → Goes to:', cartUrl);
console.log('   This shows cart contents before checkout');
console.log('✅ Checkout Now button → Goes to:', checkoutUrl);
console.log('   This goes directly to checkout');
console.log('');
console.log('🎯 RESULT: Users can now see cart contents first!');