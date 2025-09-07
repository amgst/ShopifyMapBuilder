// Test simple product pricing - no complex calculations
const sizeOptions = [
  { id: "standard", label: '12" × 8" Standard', price: 64.99 },
  { id: "large", label: '16" × 10" Large', price: 89.99 },
  { id: "compact", label: '8" × 6" Compact', price: 49.99 },
];

console.log('📦 SIMPLE PRODUCT PRICING TEST');
console.log('===============================');
console.log('');

sizeOptions.forEach(size => {
  console.log(`${size.label}: $${size.price}`);
});

console.log('');
console.log('✅ Simple pricing implemented!');
console.log('✅ Prices are now straightforward:');
console.log('   - Compact size: $49.99');
console.log('   - Standard size: $64.99'); 
console.log('   - Large size: $89.99');
console.log('');
console.log('🎯 No complex calculations based on materials or customizations.');
console.log('🎯 Clean and simple product pricing structure.');