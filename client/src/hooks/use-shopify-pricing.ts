import { useState, useEffect } from 'react';
import { fetchShopifyProductPrice, ShopifyConfig } from '@/lib/shopify';

// Size-specific variant IDs for different product sizes
const VARIANT_IDS = {
  compact: 'gid://shopify/ProductVariant/41068385009711', // 8" × 6" Compact
  standard: 'gid://shopify/ProductVariant/41068385042479', // 12" × 8" Standard  
  large: 'gid://shopify/ProductVariant/41068385075247' // 16" × 10" Large
};

interface ShopifyPricingState {
  price: number | null;
  currency: string | null;
  loading: boolean;
  error: string | null;
}

export function useShopifyPricing(baseConfig: ShopifyConfig, size: string = 'standard') {
  const [state, setState] = useState<ShopifyPricingState>({
    price: null,
    currency: null,
    loading: true,
    error: null
  });

  const fetchPrice = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Use size-specific variant ID
      const variantId = VARIANT_IDS[size as keyof typeof VARIANT_IDS] || VARIANT_IDS.standard;
      const config = {
        ...baseConfig,
        productVariantId: variantId
      };
      
      const result = await fetchShopifyProductPrice(config);
      
      if (result.success) {
        setState({
          price: result.price || null,
          currency: result.currency || null,
          loading: false,
          error: null
        });
      } else {
        setState({
          price: null,
          currency: null,
          loading: false,
          error: result.error || 'Failed to fetch price'
        });
      }
    } catch (error) {
      setState({
        price: null,
        currency: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  useEffect(() => {
    fetchPrice();
  }, [size]); // Re-fetch when size changes

  return {
    ...state,
    refetch: fetchPrice
  };
}

// Fallback prices in case Shopify is unavailable
export const FALLBACK_PRICES = {
  compact: 49.99,
  standard: 64.99,
  large: 89.99
};

// Get price with fallback
export function getPriceWithFallback(shopifyPrice: number | null, size: string): number {
  if (shopifyPrice !== null) {
    return shopifyPrice;
  }
  
  // Use fallback prices based on size
  return FALLBACK_PRICES[size as keyof typeof FALLBACK_PRICES] || FALLBACK_PRICES.standard;
}