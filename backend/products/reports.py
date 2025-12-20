"""
PostgreSQL-optimized reporting queries for sales and purchases.
Uses raw SQL with GROUP BY, SUM, JOINs for optimal performance.
"""
from django.db import connection
from decimal import Decimal
from typing import List, Dict, Any, Optional
from datetime import datetime, date


class SalesReports:
    """
    PostgreSQL-optimized sales reporting queries.
    """
    
    @staticmethod
    def sales_by_product(
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get sales report grouped by product.
        
        Uses PostgreSQL GROUP BY, SUM, and JOINs for optimal performance.
        
        Args:
            start_date: Optional start date filter
            end_date: Optional end date filter
            limit: Optional limit on number of results
        
        Returns:
            List of dictionaries with product sales data:
            - product_id: Product ID
            - product_name: Product name
            - product_category: Product category
            - total_quantity: Total quantity sold
            - total_revenue: Total revenue (SUM of line_total)
            - order_count: Number of orders containing this product
            - avg_unit_price: Average unit price
        """
        query = """
            SELECT 
                p.id AS product_id,
                p.product_name,
                p.product_category,
                SUM(sol.quantity) AS total_quantity,
                SUM(sol.line_total) AS total_revenue,
                COUNT(DISTINCT sol.order_id) AS order_count,
                AVG(sol.unit_price) AS avg_unit_price
            FROM 
                products_product p
            INNER JOIN 
                sale_order_lines sol ON p.id = sol.product_id
            INNER JOIN 
                sale_orders so ON sol.order_id = so.id
            WHERE 
                so.status = 'confirmed'
        """
        
        params = []
        
        # Add date filters if provided
        if start_date:
            query += " AND so.order_date >= %s"
            params.append(start_date)
        
        if end_date:
            query += " AND so.order_date <= %s"
            params.append(end_date)
        
        # Group by product
        query += """
            GROUP BY 
                p.id, p.product_name, p.product_category
            ORDER BY 
                total_revenue DESC
        """
        
        # Add limit if provided
        if limit:
            query += " LIMIT %s"
            params.append(limit)
        
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            columns = [col[0] for col in cursor.description]
            results = [
                dict(zip(columns, row))
                for row in cursor.fetchall()
            ]
        
        # Convert Decimal to float for JSON serialization
        for result in results:
            if result['total_revenue']:
                result['total_revenue'] = float(result['total_revenue'])
            if result['avg_unit_price']:
                result['avg_unit_price'] = float(result['avg_unit_price'])
        
        return results
    
    @staticmethod
    def sales_by_customer(
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get sales report grouped by customer.
        
        Uses PostgreSQL GROUP BY, SUM, and JOINs for optimal performance.
        
        Args:
            start_date: Optional start date filter
            end_date: Optional end date filter
            limit: Optional limit on number of results
        
        Returns:
            List of dictionaries with customer sales data:
            - customer_id: Customer ID
            - customer_email: Customer email
            - customer_name: Customer full name
            - total_orders: Total number of orders
            - total_revenue: Total revenue from customer
            - avg_order_value: Average order value
            - total_items: Total items purchased
        """
        query = """
            SELECT 
                u.id AS customer_id,
                u.email AS customer_email,
                u.name AS customer_name,
                COUNT(DISTINCT so.id) AS total_orders,
                SUM(so.total_amount) AS total_revenue,
                AVG(so.total_amount) AS avg_order_value,
                COALESCE(SUM(sol.quantity), 0) AS total_items
            FROM 
                users u
            INNER JOIN 
                sale_orders so ON u.id = so.customer_id
            LEFT JOIN 
                sale_order_lines sol ON so.id = sol.order_id
            WHERE 
                so.status = 'confirmed'
                AND u.role = 'portal'
        """
        
        params = []
        
        # Add date filters if provided
        if start_date:
            query += " AND so.order_date >= %s"
            params.append(start_date)
        
        if end_date:
            query += " AND so.order_date <= %s"
            params.append(end_date)
        
        # Group by customer
        query += """
            GROUP BY 
                u.id, u.email, u.name
            ORDER BY 
                total_revenue DESC
        """
        
        # Add limit if provided
        if limit:
            query += " LIMIT %s"
            params.append(limit)
        
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            columns = [col[0] for col in cursor.description]
            results = [
                dict(zip(columns, row))
                for row in cursor.fetchall()
            ]
        
        # Convert Decimal to float for JSON serialization
        for result in results:
            if result['total_revenue']:
                result['total_revenue'] = float(result['total_revenue'])
            if result['avg_order_value']:
                result['avg_order_value'] = float(result['avg_order_value'])
        
        return results
    
    @staticmethod
    def sales_summary(
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Get overall sales summary statistics.
        
        Args:
            start_date: Optional start date filter
            end_date: Optional end date filter
        
        Returns:
            Dictionary with summary statistics:
            - total_orders: Total number of confirmed orders
            - total_revenue: Total revenue
            - avg_order_value: Average order value
            - total_customers: Number of unique customers
            - total_items_sold: Total items sold
        """
        query = """
            SELECT 
                COUNT(DISTINCT so.id) AS total_orders,
                SUM(so.total_amount) AS total_revenue,
                AVG(so.total_amount) AS avg_order_value,
                COUNT(DISTINCT so.customer_id) AS total_customers,
                SUM(sol.quantity) AS total_items_sold
            FROM 
                sale_orders so
            LEFT JOIN 
                sale_order_lines sol ON so.id = sol.order_id
            WHERE 
                so.status = 'confirmed'
        """
        
        params = []
        
        # Add date filters if provided
        if start_date:
            query += " AND so.order_date >= %s"
            params.append(start_date)
        
        if end_date:
            query += " AND so.order_date <= %s"
            params.append(end_date)
        
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            columns = [col[0] for col in cursor.description]
            result = dict(zip(columns, cursor.fetchone()))
        
        # Convert Decimal to float and handle None values
        if result['total_revenue']:
            result['total_revenue'] = float(result['total_revenue'])
        else:
            result['total_revenue'] = 0.0
        
        if result['avg_order_value']:
            result['avg_order_value'] = float(result['avg_order_value'])
        else:
            result['avg_order_value'] = 0.0
        
        if not result['total_items_sold']:
            result['total_items_sold'] = 0
        
        return result


class PurchaseReports:
    """
    PostgreSQL-optimized purchase reporting queries.
    Note: This is a placeholder implementation as VendorBill is currently a stub.
    Full implementation will be added when purchase order system is implemented.
    """
    
    @staticmethod
    def purchases_by_product(
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get purchase report grouped by product.
        
        PLACEHOLDER: Will be implemented when purchase order system is complete.
        
        Expected structure when implemented:
        - Uses PostgreSQL GROUP BY, SUM, and JOINs
        - Joins purchase_order_lines with products
        - Groups by product
        - Calculates total quantity, total cost, order count
        
        Args:
            start_date: Optional start date filter
            end_date: Optional end date filter
            limit: Optional limit on number of results
        
        Returns:
            List of dictionaries with product purchase data
        """
        # Placeholder query structure (will be implemented with purchase orders)
        query = """
            -- PLACEHOLDER: To be implemented with purchase order system
            -- Expected structure:
            -- SELECT 
            --     p.id AS product_id,
            --     p.product_name,
            --     p.product_category,
            --     SUM(pol.quantity) AS total_quantity,
            --     SUM(pol.line_total) AS total_cost,
            --     COUNT(DISTINCT pol.order_id) AS order_count,
            --     AVG(pol.unit_price) AS avg_unit_price
            -- FROM 
            --     products_product p
            -- INNER JOIN 
            --     purchase_order_lines pol ON p.id = pol.product_id
            -- INNER JOIN 
            --     purchase_orders po ON pol.order_id = po.id
            -- WHERE 
            --     po.status = 'confirmed'
            -- GROUP BY 
            --     p.id, p.product_name, p.product_category
            -- ORDER BY 
            --     total_cost DESC
            
            SELECT 
                NULL::bigint AS product_id,
                NULL::varchar AS product_name,
                NULL::varchar AS product_category,
                0::bigint AS total_quantity,
                0::numeric AS total_cost,
                0::bigint AS order_count,
                0::numeric AS avg_unit_price
            WHERE FALSE
        """
        
        with connection.cursor() as cursor:
            cursor.execute(query)
            columns = [col[0] for col in cursor.description]
            results = [
                dict(zip(columns, row))
                for row in cursor.fetchall()
            ]
        
        return results
    
    @staticmethod
    def purchases_by_vendor(
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get purchase report grouped by vendor.
        
        PLACEHOLDER: Will be implemented when purchase order system is complete.
        
        Expected structure when implemented:
        - Uses PostgreSQL GROUP BY, SUM, and JOINs
        - Joins purchase_orders with vendors
        - Groups by vendor
        - Calculates total orders, total cost, average order value
        
        Args:
            start_date: Optional start date filter
            end_date: Optional end date filter
            limit: Optional limit on number of results
        
        Returns:
            List of dictionaries with vendor purchase data
        """
        # Placeholder query structure (will be implemented with purchase orders)
        query = """
            -- PLACEHOLDER: To be implemented with purchase order system
            -- Expected structure:
            -- SELECT 
            --     v.id AS vendor_id,
            --     v.vendor_name,
            --     v.vendor_email,
            --     COUNT(DISTINCT po.id) AS total_orders,
            --     SUM(po.total_amount) AS total_cost,
            --     AVG(po.total_amount) AS avg_order_value,
            --     SUM(pol.quantity) AS total_items
            -- FROM 
            --     vendors v
            -- INNER JOIN 
            --     purchase_orders po ON v.id = po.vendor_id
            -- LEFT JOIN 
            --     purchase_order_lines pol ON po.id = pol.order_id
            -- WHERE 
            --     po.status = 'confirmed'
            -- GROUP BY 
            --     v.id, v.vendor_name, v.vendor_email
            -- ORDER BY 
            --     total_cost DESC
            
            SELECT 
                NULL::bigint AS vendor_id,
                NULL::varchar AS vendor_name,
                NULL::varchar AS vendor_email,
                0::bigint AS total_orders,
                0::numeric AS total_cost,
                0::numeric AS avg_order_value,
                0::bigint AS total_items
            WHERE FALSE
        """
        
        with connection.cursor() as cursor:
            cursor.execute(query)
            columns = [col[0] for col in cursor.description]
            results = [
                dict(zip(columns, row))
                for row in cursor.fetchall()
            ]
        
        return results
    
    @staticmethod
    def purchase_summary(
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Get overall purchase summary statistics.
        
        PLACEHOLDER: Will be implemented when purchase order system is complete.
        
        Args:
            start_date: Optional start date filter
            end_date: Optional end date filter
        
        Returns:
            Dictionary with summary statistics
        """
        return {
            'total_orders': 0,
            'total_cost': 0.0,
            'avg_order_value': 0.0,
            'total_vendors': 0,
            'total_items_purchased': 0
        }


class ReportingService:
    """
    High-level reporting service that combines sales and purchase reports.
    """
    
    @staticmethod
    def get_sales_dashboard(
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        top_n: int = 10
    ) -> Dict[str, Any]:
        """
        Get comprehensive sales dashboard data.
        
        Args:
            start_date: Optional start date filter
            end_date: Optional end date filter
            top_n: Number of top items to return
        
        Returns:
            Dictionary with dashboard data:
            - summary: Overall sales summary
            - top_products: Top N products by revenue
            - top_customers: Top N customers by revenue
        """
        return {
            'summary': SalesReports.sales_summary(start_date, end_date),
            'top_products': SalesReports.sales_by_product(start_date, end_date, top_n),
            'top_customers': SalesReports.sales_by_customer(start_date, end_date, top_n)
        }
    
    @staticmethod
    def get_purchase_dashboard(
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        top_n: int = 10
    ) -> Dict[str, Any]:
        """
        Get comprehensive purchase dashboard data.
        
        PLACEHOLDER: Will be fully implemented when purchase order system is complete.
        
        Args:
            start_date: Optional start date filter
            end_date: Optional end date filter
            top_n: Number of top items to return
        
        Returns:
            Dictionary with dashboard data
        """
        return {
            'summary': PurchaseReports.purchase_summary(start_date, end_date),
            'top_products': PurchaseReports.purchases_by_product(start_date, end_date, top_n),
            'top_vendors': PurchaseReports.purchases_by_vendor(start_date, end_date, top_n)
        }
