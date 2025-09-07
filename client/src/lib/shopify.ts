// Shopify Storefront API integration for custom map products
export interface ShopifyConfig {
  storeName: string;
  storefrontAccessToken: string;
  productVariantId: string;
}

export interface CustomMapData {
  location: {
    lat: number;
    lng: number;
    zoom: number;
    searchQuery: string;
    city: string;
    country: string;
    coordinates: string;
  };
  productSettings: {
    shape: string;
    size: string;
    material: string;
    aspectRatio: number;
  };
  customizations: {
    texts: Array<{
      id: string;
      content: string;
      x: number;
      y: number;
      fontSize: number;
      fontFamily: string;
      color: string;
    }>;
    icons: Array<{
      id: string;
      type: string;
      x: number;
      y: number;
      size: number;
    }>;
    compass?: {
      type: string;
      x: number;
      y: number;
      size: number;
    };
  };
  price: number;
}

// Convert map data to Shopify line item attributes
export function createLineItemAttributes(mapData: CustomMapData) {
  const attributes = [
    // Location details
    { key: "Map Location", value: mapData.location.searchQuery },
    { key: "Coordinates", value: mapData.location.coordinates },
    { key: "City", value: mapData.location.city },
    { key: "Country", value: mapData.location.country },
    { key: "Zoom Level", value: mapData.location.zoom.toString() },
    
    // Product configuration
    { key: "Product Shape", value: mapData.productSettings.shape },
    { key: "Product Size", value: mapData.productSettings.size },
    { key: "Material", value: mapData.productSettings.material },
    { key: "Aspect Ratio", value: mapData.productSettings.aspectRatio.toString() },
    { key: "Price", value: `$${mapData.price.toFixed(2)}` },
    
    // Custom texts
    { key: "Custom Text Count", value: mapData.customizations.texts.length.toString() },
    ...mapData.customizations.texts.map((text, index) => ({
      key: `Text ${index + 1}`,
      value: `"${text.content}" (${text.fontSize}px ${text.fontFamily}, ${text.color}) at ${text.x.toFixed(1)}%, ${text.y.toFixed(1)}%`
    })),
    
    // Custom icons
    { key: "Custom Icon Count", value: mapData.customizations.icons.length.toString() },
    ...mapData.customizations.icons.map((icon, index) => ({
      key: `Icon ${index + 1}`,
      value: `${icon.type} (size: ${icon.size}) at ${icon.x.toFixed(1)}%, ${icon.y.toFixed(1)}%`
    })),
    
    // Compass
    ...(mapData.customizations.compass ? [
      { key: "Compass", value: `${mapData.customizations.compass.type} (size: ${mapData.customizations.compass.size}) at ${mapData.customizations.compass.x.toFixed(1)}%, ${mapData.customizations.compass.y.toFixed(1)}%` }
    ] : []),
    
    // Internal data for order processing (private attributes)
    { key: "_map_config_json", value: JSON.stringify(mapData) },
    { key: "_generated_timestamp", value: new Date().toISOString() }
  ];

  return attributes.filter(attr => attr.value && attr.value.trim() !== "");
}

// Create or add to cart via Shopify Storefront API
export async function addToShopifyCart(config: ShopifyConfig, mapData: CustomMapData, cartId?: string) {
  const shopifyUrl = `https://${config.storeName}.myshopify.com/api/2024-10/graphql.json`;
  
  const attributes = createLineItemAttributes(mapData);
  
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
      lines: [
        {
          quantity: 1,
          merchandiseId: config.productVariantId,
          attributes
        }
      ]
    } :
    {
      input: {
        lines: [
          {
            quantity: 1,
            merchandiseId: config.productVariantId,
            attributes
          }
        ]
      }
    };

  try {
    const response = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
      },
      body: JSON.stringify({ query: mutation, variables })
    });

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const result = cartId ? data.data.cartLinesAdd : data.data.cartCreate;
    
    if (result.userErrors && result.userErrors.length > 0) {
      throw new Error(`Shopify errors: ${JSON.stringify(result.userErrors)}`);
    }

    return {
      success: true,
      cart: result.cart,
      checkoutUrl: result.cart.checkoutUrl
    };
  } catch (error) {
    console.error('Error adding to Shopify cart:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Get cart by ID
export async function getShopifyCart(config: ShopifyConfig, cartId: string) {
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

  try {
    const response = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables: { cartId } })
    });

    const data = await response.json();
    return data.data.cart;
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
}