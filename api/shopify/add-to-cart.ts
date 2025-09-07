import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

// Shopify configuration schema
const shopifyConfigSchema = z.object({
  storeName: z.string().min(1),
  storefrontAccessToken: z.string().min(1),
  productVariantId: z.string().min(1),
});

// Custom map data schema
const customMapDataSchema = z.object({
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    zoom: z.number(),
    searchQuery: z.string(),
    city: z.string(),
    country: z.string(),
    coordinates: z.string(),
  }),
  productSettings: z.object({
    shape: z.string(),
    size: z.string(),
    material: z.string(),
    aspectRatio: z.number(),
  }),
  customizations: z.object({
    texts: z.array(z.any()),
    icons: z.array(z.any()),
    compass: z.any().optional(),
  }),
  price: z.number(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const schema = z.object({
      config: shopifyConfigSchema,
      mapData: customMapDataSchema,
      cartId: z.string().optional(),
      imageData: z.string().optional()
    });
    
    const { config, mapData, cartId, imageData } = schema.parse(req.body);
    
    const shopifyUrl = `https://${config.storeName}.myshopify.com/api/2024-10/graphql.json`;
    
    // Create line item attributes with map data
    const attributes = [
      { key: "Map Location", value: mapData.location.searchQuery },
      { key: "Coordinates", value: mapData.location.coordinates },
      { key: "City", value: mapData.location.city },
      { key: "Country", value: mapData.location.country },
      { key: "Zoom Level", value: mapData.location.zoom.toString() },
      { key: "Product Shape", value: mapData.productSettings.shape },
      { key: "Product Size", value: mapData.productSettings.size },
      { key: "Material", value: mapData.productSettings.material },
      { key: "Price", value: `$${mapData.price.toFixed(2)}` },
      { key: "Custom Text Count", value: mapData.customizations.texts.length.toString() },
      ...mapData.customizations.texts.map((text: any, index: number) => ({
        key: `Text ${index + 1}`,
        value: `"${text.content}" (${text.fontSize}px ${text.fontFamily}, ${text.color})`
      })),
      { key: "Custom Icon Count", value: mapData.customizations.icons.length.toString() },
      ...mapData.customizations.icons.map((icon: any, index: number) => ({
        key: `Icon ${index + 1}`,
        value: `${icon.type} (size: ${icon.size})`
      })),
      ...(mapData.customizations.compass ? [{
        key: "Compass",
        value: `${mapData.customizations.compass.type} (size: ${mapData.customizations.compass.size})`
      }] : []),
      { key: "_map_config_json", value: JSON.stringify(mapData) },
      { key: "_generated_timestamp", value: new Date().toISOString() }
    ].filter(attr => attr.value && attr.value.trim() !== "");
    
    const mutation = cartId ? 
      // Add to existing cart
      `mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart {
            id
            checkoutUrl
            totalQuantity
            lines(first: 10) {
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
          userErrors {
            field
            message
          }
        }
      }` :
      // Create new cart
      `mutation cartCreate($input: CartInput) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
            totalQuantity
            lines(first: 10) {
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
          userErrors {
            field
            message
          }
        }
      }`;
    
    const variables = cartId ? 
      {
        cartId,
        lines: [{
          quantity: 1,
          merchandiseId: config.productVariantId,
          attributes
        }]
      } :
      {
        input: {
          lines: [{
            quantity: 1,
            merchandiseId: config.productVariantId,
            attributes
          }]
        }
      };
    
    const response = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
      },
      body: JSON.stringify({ query: mutation, variables })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText} - ${errorText}`
      });
    }
    
    const data = await response.json();
    
    if (data.errors) {
      return res.status(400).json({
        success: false,
        error: `GraphQL errors: ${data.errors.map((e: any) => e.message).join(', ')}`
      });
    }
    
    const result = cartId ? data.data?.cartLinesAdd : data.data?.cartCreate;
    
    if (!result) {
      return res.status(500).json({
        success: false,
        error: 'No result data received from Shopify API'
      });
    }
    
    if (result.userErrors && result.userErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Shopify validation errors: ${result.userErrors.map((error: any) => `${error.field}: ${error.message}`).join(', ')}`
      });
    }
    
    res.json({
      success: true,
      cart: result.cart,
      checkoutUrl: result.cart.checkoutUrl
    });
  } catch (error) {
    console.error('Error adding to Shopify cart:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}