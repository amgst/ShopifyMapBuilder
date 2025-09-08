import { NextApiRequest, NextApiResponse } from 'next';
import { shopifyService } from '../server/shopify-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { action } = req.query;

  try {
    switch (action) {
      case 'test-connection':
        return await handleTestConnection(req, res);
      case 'find-products':
        return await handleFindProducts(req, res);
      case 'add-to-cart':
        return await handleAddToCart(req, res);
      case 'get-cart':
        return await handleGetCart(req, res);
      default:
        return res.status(404).json({ error: 'Action not found' });
    }
  } catch (error) {
    console.error('Shopify API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function handleTestConnection(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const shopName = process.env.SHOPIFY_SHOP_NAME;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!shopName || !accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Shopify credentials not configured' 
      });
    }

    const response = await fetch(`https://${shopName}.myshopify.com/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      shop: {
        name: data.shop.name,
        domain: data.shop.domain,
        email: data.shop.email,
        currency: data.shop.currency
      }
    });
  } catch (error) {
    console.error('Shopify connection test failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Connection test failed' 
    });
  }
}

async function handleFindProducts(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, limit = 10 } = req.query;
    
    const shopName = process.env.SHOPIFY_SHOP_NAME;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!shopName || !accessToken) {
      return res.status(400).json({ error: 'Shopify credentials not configured' });
    }

    let url = `https://${shopName}.myshopify.com/admin/api/2023-10/products.json?limit=${limit}`;
    
    if (query) {
      url += `&title=${encodeURIComponent(query as string)}`;
    }

    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const data = await response.json();
    
    return res.status(200).json({
      products: data.products.map((product: any) => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
        variants: product.variants.map((variant: any) => ({
          id: variant.id,
          title: variant.title,
          price: variant.price,
          sku: variant.sku,
          inventory_quantity: variant.inventory_quantity
        }))
      }))
    });
  } catch (error) {
    console.error('Find products error:', error);
    return res.status(500).json({ error: error.message || 'Failed to find products' });
  }
}

async function handleAddToCart(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { variantId, quantity = 1, properties = {} } = req.body;

    if (!variantId) {
      return res.status(400).json({ error: 'Variant ID is required' });
    }

    const shopName = process.env.SHOPIFY_SHOP_NAME;
    const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

    if (!shopName || !storefrontToken) {
      return res.status(400).json({ error: 'Shopify credentials not configured' });
    }

    // Create cart mutation
    const createCartMutation = `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
            lines(first: 100) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      product {
                        title
                      }
                    }
                  }
                }
              }
            }
            cost {
              totalAmount {
                amount
                currencyCode
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        lines: [{
          merchandiseId: variantId,
          quantity: parseInt(quantity),
          attributes: Object.entries(properties).map(([key, value]) => ({
            key,
            value: String(value)
          }))
        }]
      }
    };

    const response = await fetch(`https://${shopName}.myshopify.com/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontToken,
      },
      body: JSON.stringify({
        query: createCartMutation,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    if (data.data.cartCreate.userErrors.length > 0) {
      throw new Error(data.data.cartCreate.userErrors[0].message);
    }

    return res.status(200).json({
      success: true,
      cart: data.data.cartCreate.cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to add to cart' 
    });
  }
}

async function handleGetCart(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cartId } = req.query;

    if (!cartId) {
      return res.status(400).json({ error: 'Cart ID is required' });
    }

    const shopName = process.env.SHOPIFY_SHOP_NAME;
    const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

    if (!shopName || !storefrontToken) {
      return res.status(400).json({ error: 'Shopify credentials not configured' });
    }

    const getCartQuery = `
      query getCart($cartId: ID!) {
        cart(id: $cartId) {
          id
          checkoutUrl
          lines(first: 100) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      title
                    }
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${shopName}.myshopify.com/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontToken,
      },
      body: JSON.stringify({
        query: getCartQuery,
        variables: { cartId }
      })
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return res.status(200).json({
      success: true,
      cart: data.data.cart
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get cart' 
    });
  }
}