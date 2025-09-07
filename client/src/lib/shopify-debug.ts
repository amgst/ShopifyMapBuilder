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

    return data.data.products.edges.map((edge: any) => ({
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
  } catch (error) {
    console.error('Error fetching products:', error);
    return null;
  }
}