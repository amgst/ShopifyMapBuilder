import { useState, useEffect } from 'react';
import { ShopifyConfig, CustomMapData, addToShopifyCart } from '@/lib/shopify';

// Hook for managing Shopify integration
export function useShopify() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartId, setCartId] = useState<string | null>(null);

  // Load cart ID from localStorage on mount
  useEffect(() => {
    const savedCartId = localStorage.getItem('shopify_cart_id');
    if (savedCartId) {
      setCartId(savedCartId);
    }
  }, []);

  // Save cart ID to localStorage
  const saveCartId = (newCartId: string) => {
    setCartId(newCartId);
    localStorage.setItem('shopify_cart_id', newCartId);
  };

  // Add item to cart
  const addToCart = async (config: ShopifyConfig, mapData: CustomMapData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await addToShopifyCart(config, mapData, cartId || undefined);
      
      if (result.success && result.cart) {
        // Save cart ID for future use
        saveCartId(result.cart.id);
        
        return {
          success: true,
          cartId: result.cart.id,
          checkoutUrl: result.checkoutUrl,
          totalItems: result.cart.totalQuantity
        };
      } else {
        setError(result.error || 'Failed to add item to cart');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Clear cart ID (for testing or new sessions)
  const clearCart = () => {
    setCartId(null);
    localStorage.removeItem('shopify_cart_id');
  };

  return {
    isLoading,
    error,
    cartId,
    addToCart,
    clearCart,
    setError
  };
}