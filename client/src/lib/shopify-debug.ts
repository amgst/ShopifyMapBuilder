// Debug utility to find products and variants in your Shopify store
import { ShopifyConfig } from './shopify';

export async function findShopifyProducts(config: ShopifyConfig) {
  try {
    const response = await fetch('/api/shopify/find-products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Products found via server proxy:', result.products);
      return result.products;
    } else {
      console.error('Error from server proxy:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error finding products:', error);
    return null;
  }
}