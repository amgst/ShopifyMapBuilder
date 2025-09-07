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
    const schema = z.object({
      config: shopifyConfigSchema,
      cartId: z.string()
    });
    
    const { config, cartId } = schema.parse(req.body);
    
    const shopifyUrl = `https://${config.storeName}.myshopify.com/api/2024-10/graphql.json`;
    
    const query = `
      query getCart($cartId: ID!) {
        cart(id: $cartId) {
          id
          checkoutUrl
          totalQuantity
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
                attributes {
                  key
                  value
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
      body: JSON.stringify({ query, variables: { cartId } })
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
    
    res.json({
      success: true,
      cart: data.data.cart
    });
  } catch (error) {
    console.error('Error getting Shopify cart:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}