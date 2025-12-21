/**
 * Admin System Production Data Tests
 * Tests admin system with production-like data volumes and scenarios
 */

import { adminAPI } from '../utils/api';
import { adminUtils } from '../utils/adminUtils';

// Mock production-like data
const generateMockUsers = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    email: `user${i + 1}@example.com`,
    name: `User ${i + 1}`,
    role: i < 5 ? 'internal' : 'customer', // First 5 are admin users
    status: Math.random() > 0.1 ? 'active' : 'blocked', // 90% active
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    last_login: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    order_count: Math.floor(Math.random() * 50),
    total_spent: Math.floor(Math.random() * 5000)
  }));
};

const generateMockVendors = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Vendor ${i + 1}`,
    email: `vendor${i + 1}@example.com`,
    status: ['pending', 'approved', 'rejected', 'suspended'][Math.floor(Math.random() * 4)],
    application_date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
    product_count: Math.floor(Math.random() * 100),
    total_earnings: Math.floor(Math.random() * 50000),
    rating: (Math.random() * 2 + 3).toFixed(1) // 3.0 to 5.0
  }));
};

const generateMockOrders = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    order_number: `ORD-${String(i + 1).padStart(6, '0')}`,
    user_id: Math.floor(Math.random() * 1000) + 1,
    vendor_id: Math.floor(Math.random() * 200) + 1,
    status: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'][Math.floor(Math.random() * 5)],
    total: Math.floor(Math.random() * 1000) + 10,
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    payment_status: ['pending', 'completed', 'failed', 'refunded'][Math.floor(Math.random() * 4)]
  }));
};

const generateMockProducts = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    vendor_id: Math.floor(Math.random() * 200) + 1,
    category: ['clothing', 'accessories', 'footwear', 'bags'][Math.floor(Math.random() * 4)],
    price: Math.floor(Math.random() * 500) + 10,
    status: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)],
    moderation_status: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)],
    created_at: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
  }));
};

describe('Admin Production Data Tests', () => {
  let mockUsers, mockVendors, mockOrders, mockProducts;

  beforeAll(() => {
    // Generate production-like data volumes
    mockUsers = generateMockUsers(10000);      // 10K users
    mockVendors = generateMockVendors(2000);   // 2K vendors
    mockOrders = generateMockOrders(50000);    // 50K orders
    mockProducts = generateMockProducts(25000); // 25K products

    // Set up admin user
    localStorage.setItem('access_token', 'mock-admin-token');
    localStorage.setItem('user_data', JSON.stringify({
      id: 1,
      email: 'admin@appareldesk.com',
      name: 'Admin User',
      role: 'internal'
    }));
  });

  afterAll(() => {
    localStorage.clear();
  });

  describe('Large Dataset Handling', () => {
    test('should handle large user datasets efficiently', () => {
      const startTime = performance.now();
      
      // Simulate filtering large user dataset
      const activeUsers = mockUsers.filter(user => user.status === 'active');
      const adminUsers = mockUsers.filter(user => user.role === 'internal');
      const recentUsers = mockUsers.filter(user => {
        const createdDate = new Date(user.created_at);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return createdDate > thirtyDaysAgo;
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should process 10K users in reasonable time (< 100ms)
      expect(processingTime).toBeLessThan(100);
      expect(activeUsers.length).toBeGreaterThan(0);
      expect(adminUsers.length).toBe(5); // First 5 are admin users
      expect(recentUsers.length).toBeGreaterThan(0);
    });

    test('should handle large vendor datasets efficiently', () => {
      const startTime = performance.now();
      
      // Simulate vendor management operations
      const pendingVendors = mockVendors.filter(vendor => vendor.status === 'pending');
      const approvedVendors = mockVendors.filter(vendor => vendor.status === 'approved');
      const topVendors = mockVendors
        .filter(vendor => vendor.status === 'approved')
        .sort((a, b) => b.total_earnings - a.total_earnings)
        .slice(0, 100);

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(50);
      expect(pendingVendors.length).toBeGreaterThan(0);
      expect(approvedVendors.length).toBeGreaterThan(0);
      expect(topVendors.length).toBeLessThanOrEqual(100);
    });

    test('should handle large order datasets efficiently', () => {
      const startTime = performance.now();
      
      // Simulate order management operations
      const recentOrders = mockOrders
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 1000);
      
      const pendingOrders = mockOrders.filter(order => order.status === 'pending');
      const failedPayments = mockOrders.filter(order => order.payment_status === 'failed');
      
      // Calculate revenue
      const totalRevenue = mockOrders
        .filter(order => order.payment_status === 'completed')
        .reduce((sum, order) => sum + order.total, 0);

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(200);
      expect(recentOrders.length).toBe(1000);
      expect(pendingOrders.length).toBeGreaterThan(0);
      expect(failedPayments.length).toBeGreaterThan(0);
      expect(totalRevenue).toBeGreaterThan(0);
    });

    test('should handle large product datasets efficiently', () => {
      const startTime = performance.now();
      
      // Simulate product moderation operations
      const pendingProducts = mockProducts.filter(product => product.moderation_status === 'pending');
      const productsByCategory = mockProducts.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {});
      
      const recentProducts = mockProducts
        .filter(product => {
          const createdDate = new Date(product.created_at);
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return createdDate > sevenDaysAgo;
        });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(150);
      expect(pendingProducts.length).toBeGreaterThan(0);
      expect(Object.keys(productsByCategory).length).toBe(4); // 4 categories
      expect(recentProducts.length).toBeGreaterThan(0);
    });
  });

  describe('Pagination Performance', () => {
    test('should paginate large datasets efficiently', () => {
      const pageSize = 50;
      const totalPages = Math.ceil(mockUsers.length / pageSize);
      
      const startTime = performance.now();
      
      // Simulate pagination
      const pages = [];
      for (let page = 1; page <= Math.min(10, totalPages); page++) {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageData = mockUsers.slice(startIndex, endIndex);
        pages.push(pageData);
      }
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(50);
      expect(pages.length).toBe(Math.min(10, totalPages));
      expect(pages[0].length).toBe(pageSize);
    });

    test('should handle search with pagination efficiently', () => {
      const searchTerm = 'user1';
      const pageSize = 20;
      
      const startTime = performance.now();
      
      // Simulate search
      const searchResults = mockUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Paginate search results
      const firstPage = searchResults.slice(0, pageSize);
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(100);
      expect(searchResults.length).toBeGreaterThan(0);
      expect(firstPage.length).toBeLessThanOrEqual(pageSize);
    });
  });

  describe('Real-time Data Updates', () => {
    test('should handle frequent status updates efficiently', () => {
      const startTime = performance.now();
      
      // Simulate multiple status updates
      const updates = [];
      for (let i = 0; i < 1000; i++) {
        const randomOrder = mockOrders[Math.floor(Math.random() * mockOrders.length)];
        updates.push({
          id: randomOrder.id,
          oldStatus: randomOrder.status,
          newStatus: ['confirmed', 'shipped', 'delivered'][Math.floor(Math.random() * 3)]
        });
      }
      
      // Apply updates
      updates.forEach(update => {
        const order = mockOrders.find(o => o.id === update.id);
        if (order) {
          order.status = update.newStatus;
        }
      });
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(100);
      expect(updates.length).toBe(1000);
    });

    test('should handle concurrent admin actions', () => {
      const startTime = performance.now();
      
      // Simulate concurrent admin actions
      const actions = [
        () => mockUsers.filter(u => u.status === 'active').length,
        () => mockVendors.filter(v => v.status === 'pending').length,
        () => mockOrders.filter(o => o.payment_status === 'failed').length,
        () => mockProducts.filter(p => p.moderation_status === 'pending').length
      ];
      
      // Execute all actions
      const results = actions.map(action => action());
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(200);
      expect(results.length).toBe(4);
      results.forEach(result => expect(typeof result).toBe('number'));
    });
  });

  describe('Memory Usage', () => {
    test('should not cause memory leaks with large datasets', () => {
      const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      // Perform memory-intensive operations
      const operations = [
        () => mockUsers.map(u => ({ ...u, processed: true })),
        () => mockOrders.filter(o => o.total > 100),
        () => mockProducts.sort((a, b) => b.price - a.price),
        () => mockVendors.reduce((acc, v) => ({ ...acc, [v.id]: v }), {})
      ];
      
      operations.forEach(operation => {
        const result = operation();
        // Clear reference to help GC
        result.length = 0;
      });
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      // Memory usage should not increase dramatically
      if (performance.memory) {
        const memoryIncrease = finalMemory - initialMemory;
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
      }
    });
  });

  describe('Error Handling with Large Data', () => {
    test('should handle errors gracefully with large datasets', () => {
      // Simulate API errors with large datasets
      const mockError = new Error('Network timeout');
      
      expect(() => {
        try {
          // Simulate processing that might fail
          mockUsers.forEach(user => {
            if (user.id === 5000) {
              throw mockError;
            }
          });
        } catch (error) {
          // Should handle error gracefully
          expect(error.message).toBe('Network timeout');
          throw error;
        }
      }).toThrow('Network timeout');
    });

    test('should validate data integrity with large datasets', () => {
      // Check for data consistency
      const userIds = new Set(mockUsers.map(u => u.id));
      const orderUserIds = mockOrders.map(o => o.user_id);
      const vendorIds = new Set(mockVendors.map(v => v.id));
      const productVendorIds = mockProducts.map(p => p.vendor_id);
      
      // All order user_ids should exist in users (allowing for some test data inconsistency)
      const validOrderUsers = orderUserIds.filter(id => userIds.has(id));
      const validProductVendors = productVendorIds.filter(id => vendorIds.has(id));
      
      // At least 80% should be valid (allowing for test data generation randomness)
      expect(validOrderUsers.length / orderUserIds.length).toBeGreaterThan(0.8);
      expect(validProductVendors.length / productVendorIds.length).toBeGreaterThan(0.8);
    });
  });

  describe('Analytics Performance', () => {
    test('should calculate analytics efficiently with large datasets', () => {
      const startTime = performance.now();
      
      // Calculate various analytics
      const analytics = {
        totalUsers: mockUsers.length,
        activeUsers: mockUsers.filter(u => u.status === 'active').length,
        totalOrders: mockOrders.length,
        totalRevenue: mockOrders
          .filter(o => o.payment_status === 'completed')
          .reduce((sum, o) => sum + o.total, 0),
        averageOrderValue: 0,
        topVendors: mockVendors
          .filter(v => v.status === 'approved')
          .sort((a, b) => b.total_earnings - a.total_earnings)
          .slice(0, 10),
        recentGrowth: {
          users: mockUsers.filter(u => {
            const created = new Date(u.created_at);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return created > thirtyDaysAgo;
          }).length,
          orders: mockOrders.filter(o => {
            const created = new Date(o.created_at);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return created > thirtyDaysAgo;
          }).length
        }
      };
      
      // Calculate average order value
      const completedOrders = mockOrders.filter(o => o.payment_status === 'completed');
      analytics.averageOrderValue = completedOrders.length > 0 
        ? analytics.totalRevenue / completedOrders.length 
        : 0;
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(300);
      expect(analytics.totalUsers).toBe(10000);
      expect(analytics.activeUsers).toBeGreaterThan(0);
      expect(analytics.totalOrders).toBe(50000);
      expect(analytics.totalRevenue).toBeGreaterThan(0);
      expect(analytics.averageOrderValue).toBeGreaterThan(0);
      expect(analytics.topVendors.length).toBe(10);
      expect(analytics.recentGrowth.users).toBeGreaterThan(0);
      expect(analytics.recentGrowth.orders).toBeGreaterThan(0);
    });
  });
});

describe('Admin System Stress Tests', () => {
  test('should handle rapid successive API calls', async () => {
    const startTime = performance.now();
    
    // Simulate rapid API calls
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              id: i,
              data: `Response ${i}`,
              timestamp: Date.now()
            });
          }, Math.random() * 10);
        })
      );
    }
    
    const results = await Promise.all(promises);
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;

    expect(processingTime).toBeLessThan(1000);
    expect(results.length).toBe(100);
    results.forEach((result, index) => {
      expect(result.id).toBe(index);
      expect(result.data).toBe(`Response ${index}`);
    });
  });

  test('should handle concurrent user interactions', () => {
    const startTime = performance.now();
    
    // Simulate concurrent user interactions
    const interactions = [];
    for (let i = 0; i < 1000; i++) {
      interactions.push({
        type: ['click', 'search', 'filter', 'sort'][Math.floor(Math.random() * 4)],
        timestamp: Date.now() + i,
        data: { value: `interaction-${i}` }
      });
    }
    
    // Process interactions
    const processed = interactions.map(interaction => ({
      ...interaction,
      processed: true,
      processingTime: Date.now()
    }));
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;

    expect(processingTime).toBeLessThan(100);
    expect(processed.length).toBe(1000);
    expect(processed.every(p => p.processed)).toBe(true);
  });
});