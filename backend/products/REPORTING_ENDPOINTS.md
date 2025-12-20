# Reporting and Analytics Endpoints

This document describes the reporting and analytics API endpoints available for admin users.

## Base URL

All reporting endpoints are under: `/api/admin/reports/`

## Authentication

All endpoints require:
- Valid JWT token in Authorization header: `Authorization: Bearer <token>`
- User must have admin role

## Available Endpoints

### 1. Sales Dashboard

**Endpoint:** `GET /api/admin/reports/sales-dashboard/`

**Description:** Get comprehensive sales dashboard with summary statistics and top performers.

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format
- `top_n` (optional): Number of top items to return (default: 10)

**Response:**
```json
{
  "summary": {
    "total_orders": 100,
    "total_revenue": 50000.00,
    "avg_order_value": 500.00,
    "total_customers": 50,
    "total_items_sold": 200
  },
  "top_products": [
    {
      "product_id": 1,
      "product_name": "T-Shirt",
      "product_category": "Apparel",
      "total_quantity": 50,
      "total_revenue": 2500.00,
      "order_count": 25,
      "avg_unit_price": 50.00
    }
  ],
  "top_customers": [
    {
      "customer_id": 1,
      "customer_email": "customer@example.com",
      "customer_name": "John Doe",
      "total_orders": 10,
      "total_revenue": 5000.00,
      "avg_order_value": 500.00,
      "total_items": 20
    }
  ]
}
```

### 2. Sales by Product

**Endpoint:** `GET /api/admin/reports/sales-by-product/`

**Description:** Get sales report grouped by product.

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format
- `limit` (optional): Limit number of results

**Response:**
```json
[
  {
    "product_id": 1,
    "product_name": "T-Shirt",
    "product_category": "Apparel",
    "total_quantity": 50,
    "total_revenue": 2500.00,
    "order_count": 25,
    "avg_unit_price": 50.00
  }
]
```

### 3. Sales by Customer

**Endpoint:** `GET /api/admin/reports/sales-by-customer/`

**Description:** Get sales report grouped by customer.

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format
- `limit` (optional): Limit number of results

**Response:**
```json
[
  {
    "customer_id": 1,
    "customer_email": "customer@example.com",
    "customer_name": "John Doe",
    "total_orders": 10,
    "total_revenue": 5000.00,
    "avg_order_value": 500.00,
    "total_items": 20
  }
]
```

### 4. Sales Summary

**Endpoint:** `GET /api/admin/reports/sales-summary/`

**Description:** Get overall sales summary statistics.

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format

**Response:**
```json
{
  "total_orders": 100,
  "total_revenue": 50000.00,
  "avg_order_value": 500.00,
  "total_customers": 50,
  "total_items_sold": 200
}
```

### 5. Purchase Dashboard (Placeholder)

**Endpoint:** `GET /api/admin/reports/purchase-dashboard/`

**Description:** Get comprehensive purchase dashboard data.

**Status:** PLACEHOLDER - Will be fully implemented when purchase order system is complete.

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format
- `top_n` (optional): Number of top items to return (default: 10)

**Response:**
```json
{
  "summary": {
    "total_orders": 0,
    "total_cost": 0.0,
    "avg_order_value": 0.0,
    "total_vendors": 0,
    "total_items_purchased": 0
  },
  "top_products": [],
  "top_vendors": []
}
```

### 6. Purchases by Product (Placeholder)

**Endpoint:** `GET /api/admin/reports/purchases-by-product/`

**Description:** Get purchase report grouped by product.

**Status:** PLACEHOLDER - Will be implemented when purchase order system is complete.

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format
- `limit` (optional): Limit number of results

**Response:** Empty list

### 7. Purchases by Vendor (Placeholder)

**Endpoint:** `GET /api/admin/reports/purchases-by-vendor/`

**Description:** Get purchase report grouped by vendor.

**Status:** PLACEHOLDER - Will be implemented when purchase order system is complete.

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format
- `limit` (optional): Limit number of results

**Response:** Empty list

### 8. Purchase Summary (Placeholder)

**Endpoint:** `GET /api/admin/reports/purchase-summary/`

**Description:** Get overall purchase summary statistics.

**Status:** PLACEHOLDER - Will be implemented when purchase order system is complete.

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format

**Response:**
```json
{
  "total_orders": 0,
  "total_cost": 0.0,
  "avg_order_value": 0.0,
  "total_vendors": 0,
  "total_items_purchased": 0
}
```

## Example Usage

### Get sales dashboard for last month

```bash
curl -X GET \
  'http://localhost:8000/api/admin/reports/sales-dashboard/?start_date=2024-12-01&end_date=2024-12-31&top_n=5' \
  -H 'Authorization: Bearer <your-jwt-token>'
```

### Get top 20 products by revenue

```bash
curl -X GET \
  'http://localhost:8000/api/admin/reports/sales-by-product/?limit=20' \
  -H 'Authorization: Bearer <your-jwt-token>'
```

### Get sales summary for a specific date range

```bash
curl -X GET \
  'http://localhost:8000/api/admin/reports/sales-summary/?start_date=2024-01-01&end_date=2024-12-31' \
  -H 'Authorization: Bearer <your-jwt-token>'
```

## Technical Details

### Database Optimization

All sales reports use PostgreSQL-optimized raw SQL queries with:
- `GROUP BY` for aggregation
- `SUM()` for totals
- `AVG()` for averages
- `COUNT(DISTINCT)` for unique counts
- Proper JOINs for related data
- Indexes on foreign keys for performance

### Data Filtering

- Only confirmed orders are included in sales reports
- Date filters are applied at the database level for efficiency
- Results are ordered by revenue/cost in descending order

### Permissions

- All endpoints require authentication
- Only users with admin role can access these endpoints
- Enforced by `IsAdminUserRole` permission class

## Future Enhancements

When the purchase order system is fully implemented, the placeholder endpoints will be updated to:
- Query actual purchase order data
- Calculate real purchase metrics
- Provide vendor performance analytics
- Support purchase trend analysis
