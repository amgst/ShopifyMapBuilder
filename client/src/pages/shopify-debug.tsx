import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ShopifyConfig, testShopifyConnection, addToShopifyCart, validateShopifyConfig } from '@/lib/shopify';
import { findShopifyProducts } from '@/lib/shopify-debug';

export default function ShopifyDebugPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string>('');
  
  // Default Shopify config
  const [config, setConfig] = useState<ShopifyConfig>({
    storeName: 'vgpcreatives',
    storefrontAccessToken: '172c37b6b7a7759406ad719a4f149d42',
    productVariantId: 'gid://shopify/ProductVariant/41068385009711'
  });

  const log = (message: string) => {
    setResults(prev => prev + `\n${new Date().toLocaleTimeString()}: ${message}`);
    console.log(message);
  };

  const clearLog = () => {
    setResults('');
  };

  const testConnection = async () => {
    // Validate configuration first
    if (!config.storeName.trim()) {
      toast({
        title: "Configuration Error",
        description: "Store name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!config.storefrontAccessToken.trim()) {
      toast({
        title: "Configuration Error",
        description: "Storefront access token is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!config.productVariantId.trim()) {
      toast({
        title: "Configuration Error",
        description: "Product variant ID is required",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    clearLog();
    
    try {
      log('🔧 Starting Shopify connection test...');
      
      // Step 1: Validate configuration
      const validation = validateShopifyConfig(config);
      if (!validation.valid) {
        log(`❌ Configuration validation failed: ${validation.error}`);
        toast({
          title: "Configuration Error",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
      log('✅ Configuration validation passed');
      
      // Step 2: Test connection and product variant
      log('🔍 Testing connection and product variant...');
      const connectionResult = await testShopifyConnection(config);
      
      if (connectionResult.success) {
        log(`✅ Connection successful!`);
        log(`📦 Product: ${connectionResult.variant?.product?.title}`);
        log(`🏷️ Variant: ${connectionResult.variant?.title}`);
        log(`💰 Price: ${connectionResult.variant?.price?.amount} ${connectionResult.variant?.price?.currencyCode}`);
        
        toast({
          title: "Connection Successful!",
          description: `Found product: ${connectionResult.variant?.product?.title}`,
        });
      } else {
        log(`❌ Connection failed: ${connectionResult.error}`);
        toast({
          title: "Connection Failed",
          description: connectionResult.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      log(`💥 Exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testAddToCart = async () => {
    setLoading(true);
    
    try {
      log('🛒 Testing add to cart...');
      
      // Create sample map data
      const sampleMapData = {
        location: {
          lat: 48.8566,
          lng: 2.3522,
          zoom: 12,
          searchQuery: 'Paris, France',
          city: 'Paris',
          country: 'France',
          coordinates: '48.857°N / 2.352°E'
        },
        productSettings: {
          shape: 'rectangle' as const,
          size: 'standard',
          material: 'oak',
          aspectRatio: 2.62
        },
        customizations: {
          texts: [{
            id: 'test-text',
            content: 'Test Map',
            x: 50,
            y: 70,
            fontSize: 24,
            fontFamily: 'Inter Bold',
            color: 'black'
          }],
          icons: [],
        },
        price: 64.99
      };
      
      log('📦 Sample map data created');
      
      const result = await addToShopifyCart(config, sampleMapData);
      
      if (result.success) {
        log('✅ Successfully added to cart!');
        log(`🛒 Cart ID: ${result.cart?.id}`);
        log(`🔗 Checkout URL: ${result.checkoutUrl}`);
        log(`📊 Total items: ${result.cart?.totalQuantity}`);
        
        toast({
          title: "Add to Cart Successful!",
          description: `Added sample map to cart`,
        });
      } else {
        log(`❌ Add to cart failed: ${result.error}`);
        toast({
          title: "Add to Cart Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      log(`💥 Exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testFindProducts = async () => {
    setLoading(true);
    
    try {
      log('🔍 Finding products in store...');
      
      const products = await findShopifyProducts(config);
      
      if (products && products.length > 0) {
        log(`✅ Found ${products.length} products in store`);
        
        products.slice(0, 5).forEach((product: any, index: number) => {
          log(`📦 Product ${index + 1}: ${product.title}`);
          if (product.variants && product.variants.length > 0) {
            log(`   🏷️ First variant ID: ${product.variants[0].id}`);
            log(`   💰 Price: ${product.variants[0].price?.amount} ${product.variants[0].price?.currencyCode}`);
          }
        });
        
        toast({
          title: "Products Found!",
          description: `Found ${products.length} products in your store`,
        });
      } else {
        log('❌ No products found or error occurred');
        toast({
          title: "No Products Found",
          description: "Could not find any products in your store",
          variant: "destructive",
        });
      }
    } catch (error) {
      log(`💥 Exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Shopify Integration Debug Tool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={config.storeName}
                  onChange={(e) => setConfig(prev => ({ ...prev, storeName: e.target.value }))}
                  placeholder="your-store-name"
                />
              </div>
              
              <div>
                <Label htmlFor="accessToken">Storefront Access Token</Label>
                <Input
                  id="accessToken"
                  type="password"
                  value={config.storefrontAccessToken}
                  onChange={(e) => setConfig(prev => ({ ...prev, storefrontAccessToken: e.target.value }))}
                  placeholder="Your storefront access token"
                />
              </div>
              
              <div>
                <Label htmlFor="variantId">Product Variant ID</Label>
                <Input
                  id="variantId"
                  value={config.productVariantId}
                  onChange={(e) => setConfig(prev => ({ ...prev, productVariantId: e.target.value }))}
                  placeholder="gid://shopify/ProductVariant/123456"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={testConnection} disabled={loading}>
                Test Connection
              </Button>
              <Button onClick={testFindProducts} disabled={loading}>
                Find Products
              </Button>
              <Button onClick={testAddToCart} disabled={loading}>
                Test Add to Cart
              </Button>
              <Button onClick={clearLog} variant="outline">
                Clear Log
              </Button>
            </div>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}