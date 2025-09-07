// Debug utility to find products and variants in your Shopify store
import { ShopifyConfig } from './shopify';

export async function findShopifyProducts(config: ShopifyConfig) {
  const shopifyUrl = `https://${config.storeName}.myshopify.com/api/2024-10/graphql.json`;
  
  const query = `
    query getProducts {
      products(first: 20) {
        edges {
          node {
            id
            title
            handle
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  availableForSale
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('GraphQL Errors:', data.errors);
      return null;
    }

    const products = data.data.products.edges.map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title,
      handle: edge.node.handle,
      variants: edge.node.variants.edges.map((variantEdge: any) => ({
        id: variantEdge.node.id,
        title: variantEdge.node.title,
        price: variantEdge.node.price,
        availableForSale: variantEdge.node.availableForSale
      }))
    }));

    // Show first few products with their variant IDs for testing
    console.log('First 3 products for testing:');
    products.slice(0, 3).forEach((product: any, index: number) => {
      console.log(`Product ${index + 1}:`, {
        title: product.title,
        handle: product.handle,
        firstVariantId: product.variants[0]?.id || 'No variants'
      });
    });
    
    // Try to find custom map product
    const customMapProduct = products.find((p: any) => p.handle === 'custom-map-product' || p.title.toLowerCase().includes('map'));
    if (customMapProduct) {
      console.log('Found map-related product:', customMapProduct);
      if (customMapProduct.variants.length > 0) {
        console.log('🎯 USE THIS VARIANT ID:', customMapProduct.variants[0].id);
      }
    } else {
      console.log('No map product found, using first available product for testing');
      if (products.length > 0 && products[0].variants.length > 0) {
        console.log('🎯 TEST WITH THIS VARIANT ID:', products[0].variants[0].id);
      }
    }

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return null;
  }
}