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
      query testProductVariant($variantId: ID!) {
        node(id: $variantId) {
          ... on ProductVariant {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
            product {
              id
              title
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
      body: JSON.stringify({ 
        query, 
        variables: { variantId: config.productVariantId } 
      })
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
    
    if (!data.data.node) {
      return res.status(404).json({
        success: false,
        error: 'Product variant not found. Please check the variant ID.'
      });
    }
    
    const variant = data.data.node;
    if (!variant.availableForSale) {
      return res.status(400).json({
        success: false,
        error: 'Product variant is not available for sale.'
      });
    }
    
    res.json({
      success: true,
      variant: {
        id: variant.id,
        title: variant.title,
        price: variant.price,
        product: variant.product
      }
    });
  } catch (error) {
    console.error('Error testing Shopify connection:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}