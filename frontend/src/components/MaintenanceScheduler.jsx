import React, { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import FormInput from './FormInput';
import Button from './Button';
import Toggle from './Toggle';
import Modal from './Modal';
import Badge from './Badge';
import settingsService from '../services/settingsService';

/**
 * Maintenance Scheduler Component
 * Allows admins to schedule maintenance windows in advance
 */
const MaintenanceScheduler = () => {
  const { addNotification } = useNotification();
  
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledMaintenances, setScheduledMaintenances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    scheduledStart: '',
    scheduledEnd: '',
    reason: '',
    notifyUsers: true,
    allowAdminAccess: true
  });

  // Load scheduled maintenances on mount
  useEffect(() => {
    loadScheduledMaintenances();
  }, []);

  /**
   * Load scheduled maintenances
   */
  const loadScheduledMaintenances = async () => {
    try {
      // This would call an API endpoint to get scheduled maintenances
      // For now, we'll use mock data
      setScheduledMaintenances([]);
    } catch (error) {
      console.error('Failed to load scheduled maintenances:', error);
    }
  };

  /**
   * Handle schedule form input changes
   */
  const handleScheduleInputChange = (name, value) => {
    setScheduleData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Validate schedule data
   */
  const validateScheduleData = () => {
    const errors = [];

    if (!scheduleData.scheduledStart) {
      errors.push('Start time is required');
    }

    if (!scheduleData.scheduledEnd) {
      errors.push('End time is required');
    }

    if (scheduleData.scheduledStart && scheduleData.scheduledEnd) {
      const start = new Date(scheduleData.scheduledStart);
      const end = new Date(scheduleData.scheduledEnd);
      const now = new Date();

      if (start < now) {
        errors.push('Start time must be in the future');
      }

      if (end <= start) {
        errors.push('End time must be after start time');
      }

      const duration = (end - start) / (1000 * 60); // Duration in minutes
      if (duration < 5) {
        errors.push('Maintenance window must be at least 5 minutes');
      }
    }

    if (!scheduleData.reason || scheduleData.reason.trim().length === 0) {
      errors.push('Reason is required');
    }

    return errors;
  };

  /**
   * Schedule maintenance
   */
  const handleScheduleMaintenance = async () => {
    const errors = validateScheduleData();
    
    if (errors.length > 0) {
      errors.forEach(error => addNotification(error, 'error'));
      return;
    }

    try {
      setLoading(true);
      await settingsService.scheduleMaintenanceMode(scheduleData);
      
      addNotification('Maintenance scheduled successfully', 'success');
      setShowScheduleModal(false);
      
      // Reset form
      setScheduleData({
        scheduledStart: '',
        scheduledEnd: '',
        reason: '',
        notifyUsers: true,
        allowAdminAccess: true
      });
      
      // Reload scheduled maintenances
      await loadScheduledMaintenances();
    } catch (error) {
      console.error('Failed to schedule maintenance:', error);
      addNotification('Failed to schedule maintenance', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel scheduled maintenance
   */
  const handleCancelSchedule = async (scheduleId) => {
    try {
      await settingsService.cancelScheduledMaintenance(scheduleId);
      addNotification('Scheduled maintenance cancelled', 'success');
      await loadScheduledMaintenances();
    } catch (error) {
      console.error('Failed to cancel scheduled maintenance:', error);
      addNotification('Failed to cancel scheduled maintenance', 'error');
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Calculate duration
   */
  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMinutes = (endDate - startDate) / (1000 * 60);
    
    if (durationMinutes < 60) {
      return `${Math.round(durationMinutes)} minutes`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = Math.round(durationMinutes % 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Scheduled Maintenance</h2>
          <p className="text-sm text-gray-600">Schedule maintenance windows in advance</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowScheduleModal(true)}
          fullWidth={false}
        >
          Schedule Maintenance
        </Button>
      </div>

      {/* Scheduled Maintenances List */}
      {scheduledMaintenances.length > 0 ? (
        <div className="space-y-3">
          {scheduledMaintenances.map((schedule) => (
            <div
              key={schedule.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="warning">Scheduled</Badge>
                    <span className="text-sm text-gray-600">
                      {calculateDuration(schedule.scheduledStart, schedule.scheduledEnd)}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {schedule.reason}
                  </p>
                  
                  <div className="text-sm text-gray-600">
                    <p>Start: {formatDate(schedule.scheduledStart)}</p>
                    <p>End: {formatDate(schedule.scheduledEnd)}</p>
                  </div>
                  
                  {schedule.notifyUsers && (
                    <p className="text-xs text-blue-600 mt-2">
                      Users will be notified
                    </p>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => handleCancelSchedule(schedule.id)}
                  fullWidth={false}
                  className="ml-4"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No scheduled maintenance windows</p>
          <p className="text-sm mt-1">Click "Schedule Maintenance" to create one</p>
        </div>
      )}

      {/* Schedule Maintenance Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Maintenance"
        size="medium"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Schedule a maintenance window in advance. Users will be notified before the maintenance begins.
          </p>
          
          <FormInput
            label="Start Time"
            name="scheduledStart"
            type="datetime-local"
            value={scheduleData.scheduledStart}
            onChange={(e) => handleScheduleInputChange('scheduledStart', e.target.value)}
            required
          />
          
          <FormInput
            label="End Time"
            name="scheduledEnd"
            type="datetime-local"
            value={scheduleData.scheduledEnd}
            onChange={(e) => handleScheduleInputChange('scheduledEnd', e.target.value)}
            required
          />
          
          <FormInput
            label="Reason for Maintenance"
            name="reason"
            value={scheduleData.reason}
            onChange={(e) => handleScheduleInputChange('reason', e.target.value)}
            placeholder="e.g., System updates, Database maintenance"
            required
          />
          
          <Toggle
            id="scheduleNotifyUsers"
            checked={scheduleData.notifyUsers}
            onChange={(value) => handleScheduleInputChange('notifyUsers', value)}
            label="Notify Users"
            description="Send notification to all users about the scheduled maintenance"
          />
          
          <Toggle
            id="scheduleAllowAdminAccess"
            checked={scheduleData.allowAdminAccess}
            onChange={(value) => handleScheduleInputChange('allowAdminAccess', value)}
            label="Allow Admin Access"
            description="Allow administrators to access the system during maintenance"
          />
          
          {scheduleData.scheduledStart && scheduleData.scheduledEnd && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Duration:</strong> {calculateDuration(scheduleData.scheduledStart, scheduleData.scheduledEnd)}
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowScheduleModal(false)}
            disabled={loading}
            fullWidth={false}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleScheduleMaintenance}
            disabled={loading}
            fullWidth={false}
          >
            {loading ? 'Scheduling...' : 'Schedule Maintenance'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default MaintenanceScheduler;