import { adminAPI } from './api';

/**
 * Audit Logger Utility
 * Provides functions to automatically log administrative actions
 */

// Action types
export const ACTION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  SUSPEND: 'suspend',
  REACTIVATE: 'reactivate',
  BLOCK: 'block',
  UNBLOCK: 'unblock',
  LOGIN: 'login',
  LOGOUT: 'logout',
  VIEW: 'view',
  EXPORT: 'export',
  IMPORT: 'import'
};

// Resource types
export const RESOURCE_TYPES = {
  USER: 'user',
  VENDOR: 'vendor',
  PRODUCT: 'product',
  ORDER: 'order',
  INVOICE: 'invoice',
  PAYMENT: 'payment',
  SYSTEM: 'system',
  NOTIFICATION: 'notification',
  AUDIT_LOG: 'audit_log'
};

/**
 * Log an administrative action
 * @param {string} actionType - Type of action performed
 * @param {string} resourceType - Type of resource affected
 * @param {string|number} resourceId - ID of the resource (optional)
 * @param {string} description - Human-readable description of the action
 * @param {Object} details - Additional details about the action (optional)
 * @param {Object} metadata - Additional metadata (optional)
 */
export const logAdminAction = async (
  actionType,
  resourceType,
  resourceId = null,
  description,
  details = null,
  metadata = {}
) => {
  try {
    const logData = {
      action_type: actionType,
      resource_type: resourceType,
      resource_id: resourceId,
      description,
      details,
      metadata: {
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.href,
        ...metadata
      }
    };

    await adminAPI.createAuditLog(logData);
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw error to avoid breaking the main functionality
  }
};

/**
 * Higher-order function to wrap admin actions with automatic logging
 * @param {Function} actionFunction - The function to wrap
 * @param {string} actionType - Type of action
 * @param {string} resourceType - Type of resource
 * @param {Function} getResourceId - Function to extract resource ID from arguments
 * @param {Function} getDescription - Function to generate description from arguments
 */
export const withAuditLogging = (
  actionFunction,
  actionType,
  resourceType,
  getResourceId = () => null,
  getDescription = () => `${actionType} ${resourceType}`
) => {
  return async (...args) => {
    const resourceId = getResourceId(...args);
    const description = getDescription(...args);
    
    try {
      // Execute the original function
      const result = await actionFunction(...args);
      
      // Log successful action
      await logAdminAction(
        actionType,
        resourceType,
        resourceId,
        `${description} - Success`,
        { arguments: args, result }
      );
      
      return result;
    } catch (error) {
      // Log failed action
      await logAdminAction(
        actionType,
        resourceType,
        resourceId,
        `${description} - Failed: ${error.message}`,
        { arguments: args, error: error.message }
      );
      
      // Re-throw the error
      throw error;
    }
  };
};

/**
 * Predefined logging functions for common admin actions
 */
export const auditLogger = {
  // User management actions
  userBlocked: (userId, userName) => 
    logAdminAction(
      ACTION_TYPES.BLOCK,
      RESOURCE_TYPES.USER,
      userId,
      `Blocked user: ${userName}`,
      { user_id: userId, user_name: userName }
    ),

  userUnblocked: (userId, userName) => 
    logAdminAction(
      ACTION_TYPES.UNBLOCK,
      RESOURCE_TYPES.USER,
      userId,
      `Unblocked user: ${userName}`,
      { user_id: userId, user_name: userName }
    ),

  userDeleted: (userId, userName) => 
    logAdminAction(
      ACTION_TYPES.DELETE,
      RESOURCE_TYPES.USER,
      userId,
      `Deleted user: ${userName}`,
      { user_id: userId, user_name: userName }
    ),

  // Vendor management actions
  vendorApproved: (vendorId, vendorName) => 
    logAdminAction(
      ACTION_TYPES.APPROVE,
      RESOURCE_TYPES.VENDOR,
      vendorId,
      `Approved vendor: ${vendorName}`,
      { vendor_id: vendorId, vendor_name: vendorName }
    ),

  vendorRejected: (vendorId, vendorName, reason) => 
    logAdminAction(
      ACTION_TYPES.REJECT,
      RESOURCE_TYPES.VENDOR,
      vendorId,
      `Rejected vendor: ${vendorName}`,
      { vendor_id: vendorId, vendor_name: vendorName, reason }
    ),

  vendorSuspended: (vendorId, vendorName, reason) => 
    logAdminAction(
      ACTION_TYPES.SUSPEND,
      RESOURCE_TYPES.VENDOR,
      vendorId,
      `Suspended vendor: ${vendorName}`,
      { vendor_id: vendorId, vendor_name: vendorName, reason }
    ),

  vendorReactivated: (vendorId, vendorName) => 
    logAdminAction(
      ACTION_TYPES.REACTIVATE,
      RESOURCE_TYPES.VENDOR,
      vendorId,
      `Reactivated vendor: ${vendorName}`,
      { vendor_id: vendorId, vendor_name: vendorName }
    ),

  // Product management actions
  productApproved: (productId, productName, vendorName) => 
    logAdminAction(
      ACTION_TYPES.APPROVE,
      RESOURCE_TYPES.PRODUCT,
      productId,
      `Approved product: ${productName} by ${vendorName}`,
      { product_id: productId, product_name: productName, vendor_name: vendorName }
    ),

  productRejected: (productId, productName, vendorName, reason) => 
    logAdminAction(
      ACTION_TYPES.REJECT,
      RESOURCE_TYPES.PRODUCT,
      productId,
      `Rejected product: ${productName} by ${vendorName}`,
      { product_id: productId, product_name: productName, vendor_name: vendorName, reason }
    ),

  productDeleted: (productId, productName, vendorName) => 
    logAdminAction(
      ACTION_TYPES.DELETE,
      RESOURCE_TYPES.PRODUCT,
      productId,
      `Deleted product: ${productName} by ${vendorName}`,
      { product_id: productId, product_name: productName, vendor_name: vendorName }
    ),

  // Order management actions
  orderViewed: (orderId, customerName) => 
    logAdminAction(
      ACTION_TYPES.VIEW,
      RESOURCE_TYPES.ORDER,
      orderId,
      `Viewed order: ${orderId} for customer ${customerName}`,
      { order_id: orderId, customer_name: customerName }
    ),

  orderUpdated: (orderId, customerName, changes) => 
    logAdminAction(
      ACTION_TYPES.UPDATE,
      RESOURCE_TYPES.ORDER,
      orderId,
      `Updated order: ${orderId} for customer ${customerName}`,
      { order_id: orderId, customer_name: customerName, changes }
    ),

  refundProcessed: (orderId, amount, reason) => 
    logAdminAction(
      ACTION_TYPES.UPDATE,
      RESOURCE_TYPES.PAYMENT,
      orderId,
      `Processed refund for order: ${orderId} - Amount: $${amount}`,
      { order_id: orderId, refund_amount: amount, reason }
    ),

  // System actions
  systemSettingsUpdated: (settingName, oldValue, newValue) => 
    logAdminAction(
      ACTION_TYPES.UPDATE,
      RESOURCE_TYPES.SYSTEM,
      null,
      `Updated system setting: ${settingName}`,
      { setting_name: settingName, old_value: oldValue, new_value: newValue }
    ),

  maintenanceModeToggled: (enabled) => 
    logAdminAction(
      ACTION_TYPES.UPDATE,
      RESOURCE_TYPES.SYSTEM,
      null,
      `${enabled ? 'Enabled' : 'Disabled'} maintenance mode`,
      { maintenance_mode: enabled }
    ),

  dataExported: (exportType, recordCount, filters) => 
    logAdminAction(
      ACTION_TYPES.EXPORT,
      RESOURCE_TYPES.SYSTEM,
      null,
      `Exported ${exportType} data - ${recordCount} records`,
      { export_type: exportType, record_count: recordCount, filters }
    ),

  // Authentication actions
  adminLogin: (adminEmail) => 
    logAdminAction(
      ACTION_TYPES.LOGIN,
      RESOURCE_TYPES.SYSTEM,
      null,
      `Admin login: ${adminEmail}`,
      { admin_email: adminEmail }
    ),

  adminLogout: (adminEmail) => 
    logAdminAction(
      ACTION_TYPES.LOGOUT,
      RESOURCE_TYPES.SYSTEM,
      null,
      `Admin logout: ${adminEmail}`,
      { admin_email: adminEmail }
    ),

  // Notification actions
  notificationSent: (notificationType, recipientCount, message) => 
    logAdminAction(
      ACTION_TYPES.CREATE,
      RESOURCE_TYPES.NOTIFICATION,
      null,
      `Sent ${notificationType} notification to ${recipientCount} recipients`,
      { notification_type: notificationType, recipient_count: recipientCount, message }
    ),

  // Bulk actions
  bulkAction: (actionType, resourceType, resourceIds, description) => 
    logAdminAction(
      actionType,
      resourceType,
      null,
      `Bulk ${actionType}: ${description}`,
      { resource_ids: resourceIds, affected_count: resourceIds.length }
    )
};

/**
 * Create wrapped versions of admin API functions with automatic logging
 */
export const createLoggedAdminAPI = (originalAPI) => {
  return {
    ...originalAPI,

    // User management with logging
    blockUser: withAuditLogging(
      originalAPI.blockUser,
      ACTION_TYPES.BLOCK,
      RESOURCE_TYPES.USER,
      (userId) => userId,
      (userId) => `Block user ${userId}`
    ),

    unblockUser: withAuditLogging(
      originalAPI.unblockUser,
      ACTION_TYPES.UNBLOCK,
      RESOURCE_TYPES.USER,
      (userId) => userId,
      (userId) => `Unblock user ${userId}`
    ),

    // Vendor management with logging
    approveVendor: withAuditLogging(
      originalAPI.approveVendor,
      ACTION_TYPES.APPROVE,
      RESOURCE_TYPES.VENDOR,
      (vendorId) => vendorId,
      (vendorId) => `Approve vendor ${vendorId}`
    ),

    rejectVendor: withAuditLogging(
      originalAPI.rejectVendor,
      ACTION_TYPES.REJECT,
      RESOURCE_TYPES.VENDOR,
      (vendorId) => vendorId,
      (vendorId) => `Reject vendor ${vendorId}`
    ),

    suspendVendor: withAuditLogging(
      originalAPI.suspendVendor,
      ACTION_TYPES.SUSPEND,
      RESOURCE_TYPES.VENDOR,
      (vendorId) => vendorId,
      (vendorId) => `Suspend vendor ${vendorId}`
    ),

    reactivateVendor: withAuditLogging(
      originalAPI.reactivateVendor,
      ACTION_TYPES.REACTIVATE,
      RESOURCE_TYPES.VENDOR,
      (vendorId) => vendorId,
      (vendorId) => `Reactivate vendor ${vendorId}`
    )
  };
};

export default auditLogger;