import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

const shopifyConfigSchema = z.object({
  storeName: z.string().min(1),
  storefrontAccessToken: z.string().min(1),
  productVariantId: z.string().min(1),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const config = shopifyConfigSchema.parse(req.body);
    
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
    
    const response = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
      },
      body: JSON.stringify({ query })
    });
    
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      });
    }
    
    const data = await response.json();
    
    if (data.errors) {
      return res.status(400).json({
        success: false,
        error: `GraphQL errors: ${data.errors.map((e: any) => e.message).join(', ')}`
      });
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
    
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error finding Shopify products:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}