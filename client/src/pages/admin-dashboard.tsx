import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Eye, Users, FileImage, Package, TrendingUp, Store, ShoppingCart, Archive, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";

interface GeneratedMap {
  id: string;
  fileName: string;
  fileSize: number;
  downloadCount: number;
  createdAt: string;
  userId: string;
  shopifyOrderId?: string;
  userName?: string;
  customerEmail?: string;
}

interface ShopifyOrder {
  id: string;
  shopifyOrderId: string;
  shopifyOrderNumber?: string;
  customerEmail?: string;
  customerName?: string;
  status: string;
  createdAt: string;
  userId: string;
  userName?: string;
}

interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
  shopifyStoreUrl?: string;
  isActive: boolean;
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  totalMaps: number;
  totalOrders: number;
  totalDownloads: number;
}

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

export default function AdminDashboard() {
  const [maps, setMaps] = useState<GeneratedMap[]>([]);
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalMaps: 0, totalOrders: 0, totalDownloads: 0 });
  const [storeAnalytics, setStoreAnalytics] = useState<StoreAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);


  useEffect(() => {
    checkAdminAccess();
  }, []);



  useEffect(() => {
    if (adminToken) {
      loadStoreAnalytics();
    }
  }, [adminToken]);

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setIsAdmin(false);
        setAdminToken(null);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/check-access', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setIsAdmin(true);
        setAdminToken(token);
        loadAdminData();
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setIsAdmin(false);
        setAdminToken(null);
      }
    } catch (error) {
      console.error('Failed to check admin access:', error);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      setIsAdmin(false);
      setAdminToken(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const [mapsRes, ordersRes, usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/maps'),
        fetch('/api/admin/orders'),
        fetch('/api/admin/users'),
        fetch('/api/admin/stats')
      ]);

      const [mapsData, ordersData, usersData, statsData] = await Promise.all([
        mapsRes.json(),
        ordersRes.json(),
        usersRes.json(),
        statsRes.json()
      ]);

      setMaps(mapsData);
      setOrders(ordersData);
      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/store-analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStoreAnalytics(data);
      } else {
        const errorData = await response.json();
        setAnalyticsError(errorData.error || 'Failed to load store analytics');
      }
    } catch (error) {
      console.error('Failed to load store analytics:', error);
      setAnalyticsError('Failed to connect to store analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const downloadMap = async (mapId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/admin/download-map/${mapId}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Refresh data to update download count
      loadAdminData();
    } catch (error) {
      console.error('Failed to download map:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    // Redirect to login page
    window.location.href = '/admin/login';
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage customers, orders, and generated maps</p>
        </div>
        <Button 
          onClick={() => window.location.href = '/'}
          variant="outline"
        >
          Back to Map Builder
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated Maps</CardTitle>
            <FileImage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMaps}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shopify Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDownloads}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="maps" className="space-y-4">
        <TabsList>
          <TabsTrigger value="maps">Generated Maps</TabsTrigger>
          <TabsTrigger value="orders">Shopify Orders</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Store Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="maps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Generated Maps</CardTitle>
              <CardDescription>
                View and download all maps generated by customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maps.map((map) => (
                    <TableRow key={map.id}>
                      <TableCell className="font-medium">{map.fileName}</TableCell>
                      <TableCell>{map.userName || map.userId}</TableCell>
                      <TableCell>
                        {map.shopifyOrderId ? (
                          <Badge variant="secondary">{map.shopifyOrderId}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{formatFileSize(map.fileSize)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{map.downloadCount}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(map.createdAt)}</TableCell>
                      <TableCell>
                        <Button
                          onClick={() => downloadMap(map.id, map.fileName)}
                          size="sm"
                          variant="outline"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shopify Orders</CardTitle>
              <CardDescription>
                Track all orders and their processing status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Store Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.shopifyOrderNumber || order.shopifyOrderId}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-sm text-gray-500">{order.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{order.userName || order.userId}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            order.status === 'completed' ? 'default' :
                            order.status === 'processing' ? 'secondary' :
                            order.status === 'failed' ? 'destructive' : 'outline'
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Shopify Store</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {user.shopifyStoreUrl || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.isActive ? 'default' : 'outline'}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Store Analytics</h2>
              <p className="text-gray-600">Comprehensive Shopify store metrics and insights</p>
            </div>
            <Button 
              onClick={loadStoreAnalytics}
              disabled={analyticsLoading}
              variant="outline"
            >
              {analyticsLoading ? 'Loading...' : 'Refresh Data'}
            </Button>
          </div>

          {analyticsError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <div className="text-red-600">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-red-800 font-medium">Unable to load store analytics</p>
                    <p className="text-red-600 text-sm">{analyticsError}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {storeAnalytics && (
            <>
              {/* Store Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Store className="h-5 w-5" />
                    <span>Store Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Store Name</p>
                      <p className="font-medium">{storeAnalytics.store.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Domain</p>
                      <p className="font-medium">{storeAnalytics.store.domain}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Plan</p>
                      <p className="font-medium">{storeAnalytics.store.plan}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Currency</p>
                      <p className="font-medium">{storeAnalytics.store.currency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Timezone</p>
                      <p className="font-medium">{storeAnalytics.store.timezone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="font-medium">{formatDate(storeAnalytics.store.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products & Collections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="h-5 w-5" />
                      <span>Products</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">{storeAnalytics.products.total}</span>
                        <span className="text-gray-600">Total Products</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-green-600">Published</span>
                          <span className="font-medium">{storeAnalytics.products.published}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-yellow-600">Draft</span>
                          <span className="font-medium">{storeAnalytics.products.draft}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Archived</span>
                          <span className="font-medium">{storeAnalytics.products.archived}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Archive className="h-5 w-5" />
                      <span>Collections</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">{storeAnalytics.collections.total}</span>
                        <span className="text-gray-600">Total Collections</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-blue-600">Smart Collections</span>
                          <span className="font-medium">{storeAnalytics.collections.smart}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-600">Custom Collections</span>
                          <span className="font-medium">{storeAnalytics.collections.custom}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Orders & Customers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ShoppingCart className="h-5 w-5" />
                      <span>Orders</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">{storeAnalytics.orders.total}</span>
                        <span className="text-gray-600">Total Orders</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-green-600">Fulfilled</span>
                          <span className="font-medium">{storeAnalytics.orders.fulfilled}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-yellow-600">Pending</span>
                          <span className="font-medium">{storeAnalytics.orders.pending}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-600">Cancelled</span>
                          <span className="font-medium">{storeAnalytics.orders.cancelled}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600 flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            Total Value
                          </span>
                          <span className="font-bold">{storeAnalytics.store.currency} {storeAnalytics.orders.totalValue.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Customers</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">{storeAnalytics.customers.total}</span>
                        <span className="text-gray-600">Total Customers</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-blue-600">Returning</span>
                          <span className="font-medium">{storeAnalytics.customers.returning}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600">New</span>
                          <span className="font-medium">{storeAnalytics.customers.new}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Inventory Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Inventory Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{storeAnalytics.inventory.totalVariants}</div>
                      <div className="text-sm text-gray-600">Total Variants</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{storeAnalytics.inventory.inStock}</div>
                      <div className="text-sm text-gray-600">In Stock</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{storeAnalytics.inventory.lowStock}</div>
                      <div className="text-sm text-gray-600">Low Stock (≤5)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{storeAnalytics.inventory.outOfStock}</div>
                      <div className="text-sm text-gray-600">Out of Stock</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {!storeAnalytics && !analyticsLoading && !analyticsError && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Store Analytics</h3>
                  <p className="text-gray-600 mb-4">Click "Refresh Data" to load comprehensive store metrics from your Shopify store.</p>
                  <Button onClick={loadStoreAnalytics} variant="outline">
                    Load Store Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>


      </Tabs>
    </div>
  );
}