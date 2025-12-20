/**
 * Demo Data for Limina Platform
 * Comprehensive demo data showing realistic merchant dashboard scenarios
 */

export const DEMO_MERCHANT = {
  id: 'demo-merchant-001',
  name: 'Demo Store',
  email: 'demo@limina.io',
  company_name: 'TechStyle Electronics',
  subscription_plan: 'pro',
  onboarding_completed: true,
  created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
};

export const DEMO_PRODUCTS = [
  {
    id: 'demo-prod-001',
    merchant_id: DEMO_MERCHANT.id,
    title: 'iPhone 16 Pro',
    description: 'Latest iPhone with A18 Pro chip',
    price: 999.00,
    current_price: 999.00,
    currency: 'GBP',
    image_url: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=400&h=400&fit=crop',
  },
  {
    id: 'demo-prod-002',
    merchant_id: DEMO_MERCHANT.id,
    title: 'MacBook Pro 14"',
    description: 'M3 Pro chip, 14-inch Liquid Retina XDR',
    price: 1999.00,
    current_price: 1999.00,
    currency: 'GBP',
    image_url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop',
  },
  {
    id: 'demo-prod-003',
    merchant_id: DEMO_MERCHANT.id,
    title: 'Sony WH-1000XM5',
    description: 'Industry-leading noise cancelling headphones',
    price: 349.00,
    current_price: 349.00,
    currency: 'GBP',
    image_url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop',
  },
  {
    id: 'demo-prod-004',
    merchant_id: DEMO_MERCHANT.id,
    title: 'Apple Watch Ultra 2',
    description: 'The most rugged Apple Watch ever',
    price: 799.00,
    current_price: 799.00,
    currency: 'GBP',
    image_url: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=400&fit=crop',
  },
  {
    id: 'demo-prod-005',
    merchant_id: DEMO_MERCHANT.id,
    title: 'iPad Pro 12.9"',
    description: 'M2 chip with Liquid Retina XDR display',
    price: 1099.00,
    current_price: 1099.00,
    currency: 'GBP',
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop',
  },
];

export const DEMO_CUSTOMERS = [
  { id: 'demo-cust-001', email: 'sarah.johnson@gmail.com', name: 'Sarah Johnson' },
  { id: 'demo-cust-002', email: 'mike.chen@outlook.com', name: 'Mike Chen' },
  { id: 'demo-cust-003', email: 'emma.wilson@yahoo.com', name: 'Emma Wilson' },
  { id: 'demo-cust-004', email: 'james.taylor@gmail.com', name: 'James Taylor' },
  { id: 'demo-cust-005', email: 'olivia.brown@icloud.com', name: 'Olivia Brown' },
  { id: 'demo-cust-006', email: 'david.martinez@gmail.com', name: 'David Martinez' },
  { id: 'demo-cust-007', email: 'sophia.garcia@outlook.com', name: 'Sophia Garcia' },
  { id: 'demo-cust-008', email: 'william.jones@gmail.com', name: 'William Jones' },
  { id: 'demo-cust-009', email: 'ava.miller@yahoo.com', name: 'Ava Miller' },
  { id: 'demo-cust-010', email: 'alexander.davis@gmail.com', name: 'Alexander Davis' },
  { id: 'demo-cust-011', email: 'isabella.rodriguez@icloud.com', name: 'Isabella Rodriguez' },
  { id: 'demo-cust-012', email: 'ethan.wilson@outlook.com', name: 'Ethan Wilson' },
];

// Generate more realistic buy orders with clustered pricing
export const DEMO_BUY_ORDERS = [
  // iPhone 16 Pro - Multiple customers at different price points
  {
    id: 'demo-order-001',
    customer_id: 'demo-cust-001',
    product_id: 'demo-prod-001',
    merchant_id: DEMO_MERCHANT.id,
    target_price: 899.00,
    current_price: 999.00,
    status: 'monitoring',
    payment_status: 'authorized',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    customers: DEMO_CUSTOMERS[0],
    products: DEMO_PRODUCTS[0],
  },
  {
    id: 'demo-order-002',
    customer_id: 'demo-cust-002',
    product_id: 'demo-prod-001',
    merchant_id: DEMO_MERCHANT.id,
    target_price: 899.00,
    current_price: 999.00,
    status: 'monitoring',
    payment_status: 'authorized',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString(),
    customers: DEMO_CUSTOMERS[1],
    products: DEMO_PRODUCTS[0],
  },
  {
    id: 'demo-order-003',
    customer_id: 'demo-cust-003',
    product_id: 'demo-prod-001',
    merchant_id: DEMO_MERCHANT.id,
    target_price: 899.00,
    current_price: 999.00,
    status: 'monitoring',
    payment_status: 'authorized',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString(),
    customers: DEMO_CUSTOMERS[2],
    products: DEMO_PRODUCTS[0],
  },
  {
    id: 'demo-order-004',
    customer_id: 'demo-cust-004',
    product_id: 'demo-prod-001',
    merchant_id: DEMO_MERCHANT.id,
    target_price: 849.00,
    current_price: 999.00,
    status: 'monitoring',
    payment_status: 'authorized',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    customers: DEMO_CUSTOMERS[3],
    products: DEMO_PRODUCTS[0],
  },
  {
    id: 'demo-order-005',
    customer_id: 'demo-cust-005',
    product_id: 'demo-prod-001',
    merchant_id: DEMO_MERCHANT.id,
    target_price: 849.00,
    current_price: 999.00,
    status: 'monitoring',
    payment_status: 'authorized',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString(),
    customers: DEMO_CUSTOMERS[4],
    products: DEMO_PRODUCTS[0],
  },
  {
    id: 'demo-order-006',
    customer_id: 'demo-cust-006',
    product_id: 'demo-prod-001',
    merchant_id: DEMO_MERCHANT.id,
    target_price: 949.00,
    current_price: 999.00,
    status: 'monitoring',
    payment_status: 'authorized',
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    customers: DEMO_CUSTOMERS[5],
    products: DEMO_PRODUCTS[0],
  },
  // MacBook Pro - Fewer but higher value
  {
    id: 'demo-order-007',
    customer_id: 'demo-cust-007',
    product_id: 'demo-prod-002',
    merchant_id: DEMO_MERCHANT.id,
    target_price: 1799.00,
    current_price: 1999.00,
    status: 'monitoring',
    payment_status: 'authorized',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
    customers: DEMO_CUSTOMERS[6],
    products: DEMO_PRODUCTS[1],
  },
  {
    id: 'demo-order-008',
    customer_id: 'demo-cust-008',
    product_id: 'demo-prod-002',
    merchant_id: DEMO_MERCHANT.id,
    target_price: 1799.00,
    current_price: 1999.00,
    status: 'monitoring',
    payment_status: 'authorized',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    customers: DEMO_CUSTOMERS[7],
    products: DEMO_PRODUCTS[1],
  },
  {
    id: 'demo-order-009',
    customer_id: 'demo-cust-009',
    product_id: 'demo-prod-002',
    merchant_id: DEMO_MERCHANT.id,
    target_price: 1699.00,
    current_price: 1999.00,
    status: 'monitoring',
    payment_status: 'authorized',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString(),
    customers: DEMO_CUSTOMERS[8],
    products: DEMO_PRODUCTS[1],
  },
  // Sony Headphones - Already fulfilled some
  {
    id: 'demo-order-010',
    customer_id: 'demo-cust-010',
    product_id: 'demo-prod-003',
    merchant_id: DEMO_MERCHANT.id,
    target_price: 299.00,
    current_price: 349.00,
    status: 'fulfilled',
    payment_status: 'captured',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    fulfilled_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    customers: DEMO_CUSTOMERS[9],
    products: DEMO_PRODUCTS[2],
  },
  {
    id: 'demo-order-011',
    customer_id: 'demo-cust-011',
    product_id: 'demo-prod-003',
    merchant_id: DEMO_MERCHANT.id,
    target_price: 299.00,
    current_price: 349.00,
    status: 'fulfilled',
    payment_status: 'captured',
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    fulfilled_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    customers: DEMO_CUSTOMERS[10],
    products: DEMO_PRODUCTS[2],
  },
  {
    id: 'demo-order-012',
    customer_id: 'demo-cust-012',
    product_id: 'demo-prod-003',
    merchant_id: DEMO_MERCHANT.id,
    target_price: 279.00,
    current_price: 349.00,
    status: 'monitoring',
    payment_status: 'authorized',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    customers: DEMO_CUSTOMERS[11],
    products: DEMO_PRODUCTS[2],
  },
  // Apple Watch Ultra
  {
    id: 'demo-order-013',
    customer_id: 'demo-cust-001',
    product_id: 'demo-prod-004',
    merchant_id: DEMO_MERCHANT.id,
    target_price: 699.00,
    current_price: 799.00,
    status: 'monitoring',
    payment_status: 'authorized',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString(),
    customers: DEMO_CUSTOMERS[0],
    products: DEMO_PRODUCTS[3],
  },
  {
    id: 'demo-order-014',
    customer_id: 'demo-cust-003',
    product_id: 'demo-prod-004',
    merchant_id: DEMO_MERCHANT.id,
    target_price: 749.00,
    current_price: 799.00,
    status: 'monitoring',
    payment_status: 'authorized',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString(),
    customers: DEMO_CUSTOMERS[2],
    products: DEMO_PRODUCTS[3],
  },
  // iPad Pro
  {
    id: 'demo-order-015',
    customer_id: 'demo-cust-005',
    product_id: 'demo-prod-005',
    merchant_id: DEMO_MERCHANT.id,
    target_price: 999.00,
    current_price: 1099.00,
    status: 'fulfilled',
    payment_status: 'captured',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    fulfilled_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    customers: DEMO_CUSTOMERS[4],
    products: DEMO_PRODUCTS[4],
  },
  {
    id: 'demo-order-016',
    customer_id: 'demo-cust-007',
    product_id: 'demo-prod-005',
    merchant_id: DEMO_MERCHANT.id,
    target_price: 949.00,
    current_price: 1099.00,
    status: 'monitoring',
    payment_status: 'authorized',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
    customers: DEMO_CUSTOMERS[6],
    products: DEMO_PRODUCTS[4],
  },
];

// Aggregate demand by product and price point
export const DEMO_DEMAND_BY_PRODUCT = DEMO_PRODUCTS.map(product => {
  const orders = DEMO_BUY_ORDERS.filter(o => o.product_id === product.id && o.status === 'monitoring');
  const pricePoints: Record<number, number> = {};

  orders.forEach(order => {
    pricePoints[order.target_price] = (pricePoints[order.target_price] || 0) + 1;
  });

  return {
    product,
    totalWaiting: orders.length,
    pricePoints: Object.entries(pricePoints)
      .map(([price, count]) => ({ price: Number(price), count }))
      .sort((a, b) => b.price - a.price),
    lowestAsk: orders.length > 0 ? Math.min(...orders.map(o => o.target_price)) : null,
    highestAsk: orders.length > 0 ? Math.max(...orders.map(o => o.target_price)) : null,
    potentialRevenue: orders.reduce((sum, o) => sum + o.target_price, 0),
  };
});

// Calculate stats
const monitoringOrders = DEMO_BUY_ORDERS.filter(o => o.status === 'monitoring');
const fulfilledOrders = DEMO_BUY_ORDERS.filter(o => o.status === 'fulfilled');

export const DEMO_STATS = {
  totalOrders: DEMO_BUY_ORDERS.length,
  activeOrders: monitoringOrders.length,
  fulfilledOrders: fulfilledOrders.length,
  totalRevenue: fulfilledOrders.reduce((sum, o) => sum + o.target_price, 0),
  pendingRevenue: monitoringOrders.reduce((sum, o) => sum + o.target_price, 0),
  conversionRate: Math.round((fulfilledOrders.length / DEMO_BUY_ORDERS.length) * 100),
  averageOrderValue: Math.round(
    DEMO_BUY_ORDERS.reduce((sum, o) => sum + o.target_price, 0) / DEMO_BUY_ORDERS.length
  ),
  totalCustomers: new Set(DEMO_BUY_ORDERS.map(o => o.customer_id)).size,
};

// Analytics data for demo
export const DEMO_ANALYTICS = {
  overview: {
    totalOrders: DEMO_STATS.totalOrders,
    activeOrders: DEMO_STATS.activeOrders,
    fulfilledOrders: DEMO_STATS.fulfilledOrders,
    totalRevenue: DEMO_STATS.totalRevenue,
    averageOrderValue: DEMO_STATS.averageOrderValue,
    conversionRate: DEMO_STATS.conversionRate,
  },
  demandByPrice: DEMO_PRODUCTS.map(product => {
    const orders = DEMO_BUY_ORDERS.filter(o => o.product_id === product.id);
    const priceGroups: Record<number, { orders: number; revenue: number }> = {};

    orders.forEach(order => {
      if (!priceGroups[order.target_price]) {
        priceGroups[order.target_price] = { orders: 0, revenue: 0 };
      }
      priceGroups[order.target_price].orders++;
      priceGroups[order.target_price].revenue += order.target_price;
    });

    return {
      productId: product.id,
      title: product.title,
      currentPrice: product.current_price,
      demandByPrice: Object.entries(priceGroups)
        .map(([price, data]) => ({
          price: Number(price),
          orders: data.orders,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.price - a.price),
    };
  }),
  recentActivity: DEMO_BUY_ORDERS
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map(order => ({
      id: order.id,
      status: order.status,
      target_price: order.target_price,
      created_at: order.created_at,
      product_title: order.products.title,
      customer_name: order.customers.name,
    })),
  // Weekly trend data
  weeklyTrend: [
    { day: 'Mon', orders: 2, revenue: 1798 },
    { day: 'Tue', orders: 3, revenue: 2547 },
    { day: 'Wed', orders: 1, revenue: 899 },
    { day: 'Thu', orders: 4, revenue: 3196 },
    { day: 'Fri', orders: 2, revenue: 1598 },
    { day: 'Sat', orders: 3, revenue: 2397 },
    { day: 'Sun', orders: 1, revenue: 749 },
  ],
};

// Sample email that would be sent to customer
export const DEMO_EMAIL_TEMPLATE = {
  subject: "Great news! Your target price has been matched",
  customerName: "Sarah",
  productName: "iPhone 16 Pro",
  originalPrice: 999,
  targetPrice: 899,
  discountCode: "LIMINA-SARAH-899",
  expiresIn: "48 hours",
  storeName: "TechStyle Electronics",
  storeUrl: "https://techstyle.com",
};

export function isDemo(searchParams: URLSearchParams | null): boolean {
  return searchParams?.get('demo') === 'true';
}
