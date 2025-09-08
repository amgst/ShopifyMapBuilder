import { Request, Response } from "express";
import { storage } from "../../server/storage";

interface StoreAnalytics {
  products: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  collections: {
    total: number;
    smart: number;
    custom: number;
  };
  orders: {
    total: number;
    fulfilled: number;
    pending: number;
    cancelled: number;
    totalValue: number;
  };
  customers: {
    total: number;
    returning: number;
    new: number;
  };
  inventory: {
    totalVariants: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  store: {
    name: string;
    domain: string;
    plan: string;
    currency: string;
    timezone: string;
    createdAt: string;
  };
}

export async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get admin user with Shopify credentials
    const adminUser = await storage.getUserByUsername('admin');
    if (!adminUser || !adminUser.shopifyAccessToken) {
      return res.status(400).json({ 
        error: 'Shopify Admin API token required. Please add your Admin API token in Settings to view store analytics.' 
      });
    }

    const { shopifyStoreUrl, shopifyAccessToken } = adminUser;
    const baseUrl = `https://${shopifyStoreUrl}`;
    const headers = {
      'X-Shopify-Access-Token': shopifyAccessToken,
      'Content-Type': 'application/json'
    };

    // Fetch store information
    const storeResponse = await fetch(`${baseUrl}/admin/api/2023-10/shop.json`, { headers });
    const storeData = await storeResponse.json();

    // Fetch products
    const productsResponse = await fetch(`${baseUrl}/admin/api/2023-10/products.json?limit=250`, { headers });
    const productsData = await productsResponse.json();

    // Fetch product count by status
    const publishedProductsResponse = await fetch(`${baseUrl}/admin/api/2023-10/products/count.json?status=active`, { headers });
    const draftProductsResponse = await fetch(`${baseUrl}/admin/api/2023-10/products/count.json?status=draft`, { headers });
    const archivedProductsResponse = await fetch(`${baseUrl}/admin/api/2023-10/products/count.json?status=archived`, { headers });

    const publishedCount = await publishedProductsResponse.json();
    const draftCount = await draftProductsResponse.json();
    const archivedCount = await archivedProductsResponse.json();

    // Fetch collections
    const collectionsResponse = await fetch(`${baseUrl}/admin/api/2023-10/collections.json?limit=250`, { headers });
    const collectionsData = await collectionsResponse.json();

    const smartCollectionsResponse = await fetch(`${baseUrl}/admin/api/2023-10/smart_collections/count.json`, { headers });
    const customCollectionsResponse = await fetch(`${baseUrl}/admin/api/2023-10/custom_collections/count.json`, { headers });

    const smartCollectionsCount = await smartCollectionsResponse.json();
    const customCollectionsCount = await customCollectionsResponse.json();

    // Fetch orders
    const ordersResponse = await fetch(`${baseUrl}/admin/api/2023-10/orders.json?limit=250&status=any`, { headers });
    const ordersData = await ordersResponse.json();

    const fulfilledOrdersResponse = await fetch(`${baseUrl}/admin/api/2023-10/orders/count.json?status=any&fulfillment_status=fulfilled`, { headers });
    const pendingOrdersResponse = await fetch(`${baseUrl}/admin/api/2023-10/orders/count.json?status=any&fulfillment_status=pending`, { headers });
    const cancelledOrdersResponse = await fetch(`${baseUrl}/admin/api/2023-10/orders/count.json?status=cancelled`, { headers });

    const fulfilledOrdersCount = await fulfilledOrdersResponse.json();
    const pendingOrdersCount = await pendingOrdersResponse.json();
    const cancelledOrdersCount = await cancelledOrdersResponse.json();

    // Fetch customers
    const customersResponse = await fetch(`${baseUrl}/admin/api/2023-10/customers/count.json`, { headers });
    const customersCount = await customersResponse.json();

    // Calculate inventory metrics from products
    let totalVariants = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    if (productsData.products) {
      productsData.products.forEach((product: any) => {
        if (product.variants) {
          product.variants.forEach((variant: any) => {
            totalVariants++;
            const inventory = variant.inventory_quantity || 0;
            if (inventory === 0) {
              outOfStock++;
            } else if (inventory <= 5) {
              lowStock++;
            } else {
              inStock++;
            }
          });
        }
      });
    }

    // Calculate total order value
    let totalOrderValue = 0;
    if (ordersData.orders) {
      totalOrderValue = ordersData.orders.reduce((sum: number, order: any) => {
        return sum + parseFloat(order.total_price || '0');
      }, 0);
    }

    // Calculate returning vs new customers (simplified)
    const totalCustomers = customersCount.count || 0;
    const returningCustomers = Math.floor(totalCustomers * 0.3); // Estimate 30% returning
    const newCustomers = totalCustomers - returningCustomers;

    const analytics: StoreAnalytics = {
      products: {
        total: (publishedCount.count || 0) + (draftCount.count || 0) + (archivedCount.count || 0),
        published: publishedCount.count || 0,
        draft: draftCount.count || 0,
        archived: archivedCount.count || 0
      },
      collections: {
        total: (smartCollectionsCount.count || 0) + (customCollectionsCount.count || 0),
        smart: smartCollectionsCount.count || 0,
        custom: customCollectionsCount.count || 0
      },
      orders: {
        total: (fulfilledOrdersCount.count || 0) + (pendingOrdersCount.count || 0) + (cancelledOrdersCount.count || 0),
        fulfilled: fulfilledOrdersCount.count || 0,
        pending: pendingOrdersCount.count || 0,
        cancelled: cancelledOrdersCount.count || 0,
        totalValue: totalOrderValue
      },
      customers: {
        total: totalCustomers,
        returning: returningCustomers,
        new: newCustomers
      },
      inventory: {
        totalVariants,
        inStock,
        lowStock,
        outOfStock
      },
      store: {
        name: storeData.shop?.name || 'Unknown Store',
        domain: storeData.shop?.domain || shopifyStoreUrl,
        plan: storeData.shop?.plan_name || 'Unknown',
        currency: storeData.shop?.currency || 'USD',
        timezone: storeData.shop?.timezone || 'UTC',
        createdAt: storeData.shop?.created_at || new Date().toISOString()
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Store analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch store analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default handler;