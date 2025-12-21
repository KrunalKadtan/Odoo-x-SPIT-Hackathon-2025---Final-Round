import React from 'react';
import AuditLogViewer from '../../components/AuditLogViewer';

/**
 * AuditLogs - Admin page for viewing audit logs
 * Provides comprehensive audit trail of all administrative actions
 */
const AuditLogs = () => {
  return (
    <div className="p-6">
      <AuditLogViewer />
    </div>
  );
};

export default AuditLogs;