#!/usr/bin/env python3
"""
Admin System Database Query Optimization Script
Implements database optimizations for admin operations
"""

import os
import sys
import django
from django.core.management.base import BaseCommand
from django.db import connection

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

def create_admin_indexes():
    """Create database indexes for admin operations"""
    
    print("🗄️  Creating Admin System Database Indexes")
    print("==========================================\n")
    
    with connection.cursor() as cursor:
        # Index optimizations for admin operations
        indexes = [
            {
                'name': 'idx_accounts_user_status',
                'table': 'accounts_user',
                'columns': ['status'],
                'description': 'Optimize user filtering by status'
            },
            {
                'name': 'idx_accounts_user_role',
                'table': 'accounts_user',
                'columns': ['role'],
                'description': 'Optimize admin role filtering'
            },
            {
                'name': 'idx_accounts_user_created_at',
                'table': 'accounts_user',
                'columns': ['created_at'],
                'description': 'Optimize user registration date queries'
            },
            {
                'name': 'idx_accounts_user_last_login',
                'table': 'accounts_user',
                'columns': ['last_login'],
                'description': 'Optimize user activity queries'
            },
            {
                'name': 'idx_products_order_created_at',
                'table': 'products_order',
                'columns': ['created_at'],
                'description': 'Optimize order date range queries'
            },
            {
                'name': 'idx_products_order_status',
                'table': 'products_order',
                'columns': ['status'],
                'description': 'Optimize order status filtering'
            },
            {
                'name': 'idx_products_order_payment_status',
                'table': 'products_order',
                'columns': ['payment_status'],
                'description': 'Optimize payment status queries'
            },
            {
                'name': 'idx_products_order_user_status',
                'table': 'products_order',
                'columns': ['user_id', 'status'],
                'description': 'Optimize user order queries'
            },
            {
                'name': 'idx_products_order_payment_created',
                'table': 'products_order',
                'columns': ['payment_status', 'created_at'],
                'description': 'Optimize revenue calculations'
            },
            {
                'name': 'idx_products_product_vendor_status',
                'table': 'products_product',
                'columns': ['vendor_id', 'status'],
                'description': 'Optimize vendor product queries'
            },
            {
                'name': 'idx_products_product_moderation',
                'table': 'products_product',
                'columns': ['moderation_status'],
                'description': 'Optimize product moderation queries'
            },
            {
                'name': 'idx_products_product_created_at',
                'table': 'products_product',
                'columns': ['created_at'],
                'description': 'Optimize product submission date queries'
            },
            {
                'name': 'idx_products_vendor_status',
                'table': 'products_vendor',
                'columns': ['status'],
                'description': 'Optimize vendor status filtering'
            },
            {
                'name': 'idx_products_vendor_created_at',
                'table': 'products_vendor',
                'columns': ['created_at'],
                'description': 'Optimize vendor application date queries'
            },
            {
                'name': 'idx_products_invoice_status',
                'table': 'products_invoice',
                'columns': ['status'],
                'description': 'Optimize invoice status queries'
            },
            {
                'name': 'idx_products_invoice_created_at',
                'table': 'products_invoice',
                'columns': ['created_at'],
                'description': 'Optimize invoice date queries'
            }
        ]
        
        created_count = 0
        skipped_count = 0
        
        for index in indexes:
            try:
                # Check if index already exists
                cursor.execute("""
                    SELECT COUNT(*) FROM pg_indexes 
                    WHERE indexname = %s
                """, [index['name']])
                
                if cursor.fetchone()[0] > 0:
                    print(f"   ⏭️  Skipping {index['name']} (already exists)")
                    skipped_count += 1
                    continue
                
                # Create the index
                columns_str = ', '.join(index['columns'])
                sql = f"CREATE INDEX CONCURRENTLY {index['name']} ON {index['table']} ({columns_str})"
                
                print(f"   🔨 Creating {index['name']}...")
                print(f"      Table: {index['table']}")
                print(f"      Columns: {columns_str}")
                print(f"      Purpose: {index['description']}")
                
                cursor.execute(sql)
                created_count += 1
                print(f"   ✅ Created successfully\n")
                
            except Exception as e:
                print(f"   ❌ Failed to create {index['name']}: {str(e)}\n")
        
        print(f"📊 Index Creation Summary:")
        print(f"   Created: {created_count}")
        print(f"   Skipped: {skipped_count}")
        print(f"   Total: {len(indexes)}\n")

def analyze_query_performance():
    """Analyze current query performance"""
    
    print("📈 Query Performance Analysis")
    print("============================\n")
    
    with connection.cursor() as cursor:
        # Enable query statistics if not already enabled
        try:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS pg_stat_statements")
            print("✅ Query statistics extension enabled\n")
        except Exception as e:
            print(f"⚠️  Could not enable pg_stat_statements: {str(e)}\n")
        
        # Analyze slow queries
        slow_queries = [
            {
                'name': 'User Count by Status',
                'query': """
                    EXPLAIN ANALYZE 
                    SELECT status, COUNT(*) 
                    FROM accounts_user 
                    GROUP BY status
                """,
                'optimization': 'Index on status column'
            },
            {
                'name': 'Recent Orders',
                'query': """
                    EXPLAIN ANALYZE 
                    SELECT COUNT(*) 
                    FROM products_order 
                    WHERE created_at > NOW() - INTERVAL '30 days'
                """,
                'optimization': 'Index on created_at column'
            },
            {
                'name': 'Revenue Calculation',
                'query': """
                    EXPLAIN ANALYZE 
                    SELECT SUM(total) 
                    FROM products_order 
                    WHERE payment_status = 'completed'
                """,
                'optimization': 'Composite index on (payment_status, total)'
            },
            {
                'name': 'Vendor Products',
                'query': """
                    EXPLAIN ANALYZE 
                    SELECT COUNT(*) 
                    FROM products_product 
                    WHERE vendor_id = 1 AND status = 'active'
                """,
                'optimization': 'Composite index on (vendor_id, status)'
            }
        ]
        
        for query_info in slow_queries:
            try:
                print(f"🔍 Analyzing: {query_info['name']}")
                cursor.execute(query_info['query'])
                results = cursor.fetchall()
                
                # Extract execution time from EXPLAIN ANALYZE
                execution_time = "N/A"
                for row in results:
                    if 'Execution Time:' in str(row[0]):
                        execution_time = str(row[0]).split('Execution Time:')[1].strip()
                        break
                
                print(f"   Execution Time: {execution_time}")
                print(f"   Recommended: {query_info['optimization']}\n")
                
            except Exception as e:
                print(f"   ❌ Analysis failed: {str(e)}\n")

def create_materialized_views():
    """Create materialized views for frequently accessed aggregated data"""
    
    print("📊 Creating Materialized Views")
    print("==============================\n")
    
    with connection.cursor() as cursor:
        materialized_views = [
            {
                'name': 'admin_dashboard_metrics',
                'query': """
                    CREATE MATERIALIZED VIEW admin_dashboard_metrics AS
                    SELECT 
                        (SELECT COUNT(*) FROM accounts_user) as total_users,
                        (SELECT COUNT(*) FROM accounts_user WHERE status = 'active') as active_users,
                        (SELECT COUNT(*) FROM products_vendor) as total_vendors,
                        (SELECT COUNT(*) FROM products_vendor WHERE status = 'approved') as approved_vendors,
                        (SELECT COUNT(*) FROM products_order) as total_orders,
                        (SELECT SUM(total) FROM products_order WHERE payment_status = 'completed') as total_revenue,
                        (SELECT COUNT(*) FROM products_order WHERE payment_status = 'failed') as failed_payments,
                        NOW() as last_updated
                """,
                'description': 'Dashboard metrics for admin overview'
            },
            {
                'name': 'user_order_summary',
                'query': """
                    CREATE MATERIALIZED VIEW user_order_summary AS
                    SELECT 
                        u.id as user_id,
                        u.email,
                        u.name,
                        COUNT(o.id) as order_count,
                        COALESCE(SUM(CASE WHEN o.payment_status = 'completed' THEN o.total ELSE 0 END), 0) as total_spent,
                        MAX(o.created_at) as last_order_date
                    FROM accounts_user u
                    LEFT JOIN products_order o ON u.id = o.user_id
                    GROUP BY u.id, u.email, u.name
                """,
                'description': 'User order statistics for admin user management'
            },
            {
                'name': 'vendor_performance_summary',
                'query': """
                    CREATE MATERIALIZED VIEW vendor_performance_summary AS
                    SELECT 
                        v.id as vendor_id,
                        v.name,
                        v.email,
                        COUNT(DISTINCT p.id) as product_count,
                        COUNT(DISTINCT o.id) as order_count,
                        COALESCE(SUM(CASE WHEN o.payment_status = 'completed' THEN o.total ELSE 0 END), 0) as total_earnings,
                        AVG(CASE WHEN o.payment_status = 'completed' THEN o.total ELSE NULL END) as avg_order_value
                    FROM products_vendor v
                    LEFT JOIN products_product p ON v.id = p.vendor_id
                    LEFT JOIN products_order o ON p.id = ANY(
                        SELECT jsonb_array_elements_text(o.items::jsonb)::int
                    )
                    WHERE v.status = 'approved'
                    GROUP BY v.id, v.name, v.email
                """,
                'description': 'Vendor performance metrics for admin vendor management'
            }
        ]
        
        created_count = 0
        
        for view in materialized_views:
            try:
                # Drop existing view if it exists
                cursor.execute(f"DROP MATERIALIZED VIEW IF EXISTS {view['name']}")
                
                print(f"🔨 Creating materialized view: {view['name']}")
                print(f"   Purpose: {view['description']}")
                
                cursor.execute(view['query'])
                
                # Create index on materialized view
                cursor.execute(f"CREATE UNIQUE INDEX ON {view['name']} (last_updated)" if 'last_updated' in view['query'] else f"CREATE INDEX ON {view['name']} (user_id)" if 'user_id' in view['query'] else f"CREATE INDEX ON {view['name']} (vendor_id)")
                
                created_count += 1
                print(f"   ✅ Created successfully\n")
                
            except Exception as e:
                print(f"   ❌ Failed to create {view['name']}: {str(e)}\n")
        
        print(f"📊 Materialized Views Summary:")
        print(f"   Created: {created_count}")
        print(f"   Total: {len(materialized_views)}\n")

def create_refresh_functions():
    """Create functions to refresh materialized views"""
    
    print("🔄 Creating Refresh Functions")
    print("=============================\n")
    
    with connection.cursor() as cursor:
        try:
            # Function to refresh dashboard metrics
            cursor.execute("""
                CREATE OR REPLACE FUNCTION refresh_admin_dashboard_metrics()
                RETURNS void AS $$
                BEGIN
                    REFRESH MATERIALIZED VIEW admin_dashboard_metrics;
                END;
                $$ LANGUAGE plpgsql;
            """)
            
            # Function to refresh user summaries
            cursor.execute("""
                CREATE OR REPLACE FUNCTION refresh_user_order_summary()
                RETURNS void AS $$
                BEGIN
                    REFRESH MATERIALIZED VIEW user_order_summary;
                END;
                $$ LANGUAGE plpgsql;
            """)
            
            # Function to refresh vendor summaries
            cursor.execute("""
                CREATE OR REPLACE FUNCTION refresh_vendor_performance_summary()
                RETURNS void AS $$
                BEGIN
                    REFRESH MATERIALIZED VIEW vendor_performance_summary;
                END;
                $$ LANGUAGE plpgsql;
            """)
            
            print("✅ Refresh functions created successfully\n")
            
        except Exception as e:
            print(f"❌ Failed to create refresh functions: {str(e)}\n")

def optimize_admin_queries():
    """Main function to run all optimizations"""
    
    print("🚀 Admin System Database Optimization")
    print("=====================================\n")
    
    try:
        # Step 1: Create indexes
        create_admin_indexes()
        
        # Step 2: Analyze query performance
        analyze_query_performance()
        
        # Step 3: Create materialized views
        create_materialized_views()
        
        # Step 4: Create refresh functions
        create_refresh_functions()
        
        print("🎉 Database optimization completed successfully!")
        print("\n📋 Next Steps:")
        print("   1. Set up cron job to refresh materialized views every 15 minutes")
        print("   2. Monitor query performance with pg_stat_statements")
        print("   3. Consider partitioning for very large tables")
        print("   4. Implement connection pooling for high concurrency")
        
        print("\n🔄 Materialized View Refresh Commands:")
        print("   SELECT refresh_admin_dashboard_metrics();")
        print("   SELECT refresh_user_order_summary();")
        print("   SELECT refresh_vendor_performance_summary();")
        
    except Exception as e:
        print(f"❌ Optimization failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    optimize_admin_queries()