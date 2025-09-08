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

// Validate Shopify configuration
export function validateShopifyConfig(config: ShopifyConfig): { valid: boolean; error?: string } {
  if (!config.storeName || config.storeName.trim() === '') {
    return { valid: false, error: 'Store name is required' };
  }
  
  if (!config.storefrontAccessToken || config.storefrontAccessToken.trim() === '') {
    return { valid: false, error: 'Storefront access token is required' };
  }
  
  if (!config.productVariantId || config.productVariantId.trim() === '') {
    return { valid: false, error: 'Product variant ID is required' };
  }
  
  // Check if product variant ID has the correct format
  if (!config.productVariantId.startsWith('gid://shopify/ProductVariant/')) {
    return { valid: false, error: 'Product variant ID must be in the format: gid://shopify/ProductVariant/[ID]' };
  }
  
  return { valid: true };
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

// Create or add to cart via Shopify Storefront API with automatic image generation
export async function addToShopifyCart(config: ShopifyConfig, mapData: CustomMapData, cartId?: string) {
  // Validate configuration first
  const validation = validateShopifyConfig(config);
  if (!validation.valid) {
    return {
      success: false,
      error: `Configuration error: ${validation.error}`
    };
  }
  
  try {
    console.log('Capturing map image for cart...');
    
    // Capture the map image from the preview area
    let imageData = '';
    try {
      const previewElement = document.querySelector('[data-testid="map-preview-area"]') as HTMLElement;
      if (previewElement) {
        // Use html2canvas to capture the image
        const html2canvas = (await import('html2canvas')).default;
        
        // Wait for any pending renders
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const canvas = await html2canvas(previewElement, {
          scale: 3.125, // Exactly 300 DPI (300/96 = 3.125)
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          removeContainer: true,
          imageTimeout: 30000, // Extended timeout for 300 DPI rendering
          onclone: (clonedDoc) => {
            // Clean up the cloned document for export
            const clonedElement = clonedDoc.body;
            
            // Remove zoom controls and interactive elements
            const elementsToRemove = clonedElement.querySelectorAll(
              '[data-testid*="zoom"], .absolute.top-4.right-4, .cursor-se-resize, .hover\\:bg-black\\/10'
            );
            elementsToRemove.forEach(el => el.remove());
            
            // Optimize text elements for engraving (black text, no shadows)
            const textElements = clonedElement.querySelectorAll('[data-testid*="draggable-text"]');
            textElements.forEach(el => {
              const htmlEl = el as HTMLElement;
              htmlEl.style.color = '#000000'; // Black text for engraving
              htmlEl.style.fontWeight = 'bold';
              htmlEl.style.textShadow = 'none'; // No shadows for clean engraving
            });
            
            // Optimize icons for engraving (black icons, no effects)
            const iconElements = clonedElement.querySelectorAll('[data-testid*="draggable-icon"] svg, [data-testid*="draggable-compass"] svg');
            iconElements.forEach(el => {
              const htmlEl = el as HTMLElement;
              htmlEl.style.color = '#000000'; // Black icons for engraving
              htmlEl.style.fill = '#000000';
              htmlEl.style.stroke = '#000000';
              htmlEl.style.filter = 'none'; // No effects for clean engraving
            });
          }
        });
        
        // Convert to base64 JPEG with high quality for 8-30MB range
        imageData = canvas.toDataURL('image/jpeg', 0.92); // High quality for specification compliance
        console.log('Map image captured successfully');
      }
    } catch (imageError) {
      console.warn('Failed to capture image, proceeding without:', imageError);
    }
    
    console.log('Sending request to server proxy...');
    
    const response = await fetch('/api/shopify/add-to-cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config,
        mapData,
        cartId,
        imageData // Send the captured image
      })
    });
    
    const result = await response.json();
    console.log('Server proxy response:', result);
    
    return result;
  } catch (error) {
    console.error('Error in client addToShopifyCart:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred'
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

// Test Shopify connection and product variant
export async function testShopifyConnection(config: ShopifyConfig) {
  const validation = validateShopifyConfig(config);
  if (!validation.valid) {
    return {
      success: false,
      error: `Configuration error: ${validation.error}`
    };
  }
  
  try {
    const response = await fetch('/api/shopify/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config)
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred'
    };
  }
}

// Fetch product price from Shopify
export async function fetchShopifyProductPrice(config: ShopifyConfig): Promise<{ success: boolean; price?: number; currency?: string; error?: string }> {
  const validation = validateShopifyConfig(config);
  if (!validation.valid) {
    return {
      success: false,
      error: `Configuration error: ${validation.error}`
    };
  }
  
  try {
    const response = await fetch('/api/shopify/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config)
    });
    
    const result = await response.json();
    
    if (result.success && result.variant?.price) {
      return {
        success: true,
        price: parseFloat(result.variant.price.amount),
        currency: result.variant.price.currencyCode
      };
    } else {
      return {
        success: false,
        error: result.error || 'Could not fetch product price'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred'
    };
  }
}