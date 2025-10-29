import React from 'react';
import { ArrowLeft, Edit, Trash2, Plus, Clock, Activity, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ActivityLog.css';

const ActivityLog = ({ activityLogs, stats }) => {
  const navigate = useNavigate();

  const exportLogs = () => {
    const dataStr = JSON.stringify(activityLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-log-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'edited': return <Edit size={16} />;
      case 'deleted': return <Trash2 size={16} />;
      case 'created': return <Plus size={16} />;
      default: return <Edit size={16} />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'edited': return '#3b82f6';
      case 'deleted': return '#ef4444';
      case 'created': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="activity-log-container">
      {/* Header */}
      <div className="view-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <div className="header-content">
          <h1>Activity Log & Outputs</h1>
          <p>Track all edits and activities across all tools</p>
        </div>
        <button className="export-btn" onClick={exportLogs}>
          <Download size={16} />
          Export Logs
        </button>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-item">
          <div className="stat-icon total">
            <Activity size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalEdits}</span>
            <span className="stat-label">Total Activities</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon today">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.todayEdits}</span>
            <span className="stat-label">Today's Activities</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon tools">
            <Edit size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.recentTools.length}</span>
            <span className="stat-label">Active Tools</span>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="activity-log-content">
        <div className="log-header">
          <h2>Recent Activities</h2>
          <span className="log-count">{activityLogs.length} activities recorded</span>
        </div>

        {activityLogs.length === 0 ? (
          <div className="no-activities">
            <Clock size={64} />
            <h3>No Activities Recorded</h3>
            <p>Start using the tools to see activity history here</p>
          </div>
        ) : (
          <div className="log-timeline">
            {activityLogs.map((log) => (
              <div key={log.id} className="log-entry">
                <div 
                  className="log-badge"
                  style={{ backgroundColor: getActionColor(log.action) }}
                >
                  {getActionIcon(log.action)}
                </div>
                <div className="log-details">
                  <div className="log-message">
                    <span className="user-name">{log.user}</span>
                    <span className="action-text">{log.action}</span>
                    <span className="tool-name">{log.tool}</span>
                    {log.details && (
                      <span className="log-description">: {log.details}</span>
                    )}
                  </div>
                  <div className="log-time">{log.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;