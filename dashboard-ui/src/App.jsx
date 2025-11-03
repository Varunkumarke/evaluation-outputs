import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Menu, X, Bell, LogOut, Clock, Activity } from 'lucide-react';
import './App.css';
import FullSummaryView from './pages/FullSummaryView';
import SectionSummaryView from './pages/SectionSummaryView';
import DomainWordsView from './pages/DomainWordsView';
import TaxonomyView from './pages/TaxonomyView';
import DefinitionView from './pages/DefinitionView';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import ActivityLog from './pages/ActivityLog';
import WordStructureView from './pages/WordStructureView';
import ForgotPassword from './pages/ForgotPassword';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Create a simple logging system
const activityLog = {
  logs: [],
  
  addLog: (action, tool, details) => {
    const log = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      action,
      tool,
      details,
      user: localStorage.getItem('username') || 'Unknown'
    };
    activityLog.logs.unshift(log); // Add to beginning
    // Keep only last 50 logs
    if (activityLog.logs.length > 50) {
      activityLog.logs = activityLog.logs.slice(0, 50);
    }
    // Save to localStorage
    localStorage.setItem('activityLogs', JSON.stringify(activityLog.logs));
  },
  
  getLogs: () => {
    const savedLogs = localStorage.getItem('activityLogs');
    if (savedLogs) {
      activityLog.logs = JSON.parse(savedLogs);
    }
    return activityLog.logs;
  },
  
  getStats: () => {
    const logs = activityLog.getLogs();
    const today = new Date().toDateString();
    const todayLogs = logs.filter(log => new Date(log.timestamp).toDateString() === today);
    
    return {
      totalEdits: logs.length,
      todayEdits: todayLogs.length,
      recentTools: [...new Set(logs.slice(0, 5).map(log => log.tool))]
    };
  }
};

// Initialize logs from localStorage
activityLog.getLogs();

function App() {
  const [activityLogs, setActivityLogs] = useState(activityLog.getLogs());

  // Function to add log and update state
  const addActivityLog = (action, tool, details) => {
    activityLog.addLog(action, tool, details);
    setActivityLogs([...activityLog.getLogs()]);
  };

  // Create wrapped components with logging
  const FullSummaryViewWithLog = () => (
    <FullSummaryView onEdit={(details) => addActivityLog('edited', 'Full Summary', details)} />
  );

  const SectionSummaryViewWithLog = () => (
    <SectionSummaryView onEdit={(details) => addActivityLog('edited', 'Section Summary', details)} />
  );

  const DomainWordsViewWithLog = () => (
    <DomainWordsView onEdit={(details) => addActivityLog('edited', 'Domain Words', details)} />
  );

  const TaxonomyViewWithLog = () => (
    <TaxonomyView onEdit={(details) => addActivityLog('edited', 'Taxonomy', details)} />
  );

  const DefinitionViewWithLog = () => (
    <DefinitionView onEdit={(details) => addActivityLog('edited', 'Definition', details)} />
  );

  const WordStructureViewWithLog = () => (
    <WordStructureView onEdit={(details) => addActivityLog('edited', 'Word Structure', details)} />
  );

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard stats={activityLog.getStats()} />
          </ProtectedRoute>
        } />
        <Route path="/full-summary" element={
          <ProtectedRoute>
            <FullSummaryViewWithLog />
          </ProtectedRoute>
        } />
        <Route path="/section-summary" element={
          <ProtectedRoute>
            <SectionSummaryViewWithLog />
          </ProtectedRoute>
        } />
        <Route path="/domain-words" element={
          <ProtectedRoute>
            <DomainWordsViewWithLog />
          </ProtectedRoute>
        } />
        <Route path="/taxonomy" element={
          <ProtectedRoute>
            <TaxonomyViewWithLog />
          </ProtectedRoute>
        } />
        
        {/* DefinitionView routes */}
        <Route path="/definition" element={
          <ProtectedRoute>
            <DefinitionViewWithLog />
          </ProtectedRoute>
        } />
        
        <Route path="/definition/:chapterId/:domainId" element={
          <ProtectedRoute>
            <DefinitionViewWithLog />
          </ProtectedRoute>
        } />
        
        <Route path="/word-structure" element={
          <ProtectedRoute>
            <WordStructureViewWithLog />
          </ProtectedRoute>
        } />
        
        {/* Activity Log Page */}
        <Route path="/outputs" element={
          <ProtectedRoute>
            <ActivityLog activityLogs={activityLogs} stats={activityLog.getStats()} />
          </ProtectedRoute>
        } />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// Dashboard component - CLEANED UP (no status icons)
function Dashboard({ stats }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    const sessionToken = localStorage.getItem('session_token');
    
    if (sessionToken) {
      try {
        await fetch('http://localhost:8000/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session_token: sessionToken })
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    localStorage.removeItem('session_token');
    localStorage.removeItem('username');
    window.location.href = '/login';
  };

  const tools = [
    {
      id: "full-summary",
      name: "Full Summary outputs",
      description: "View and edit complete chapter summaries",
      output: "View",
      path: "/full-summary"
    },
    {
      id: "section-summary",
      name: "Section Summary outputs", 
      description: "View and edit individual section summaries",
      output: "View",
      path: "/section-summary"
    },
    {
      id: "domain-words",
      name: "Domain Word outputs",
      description: "View and edit domain-specific vocabulary words", 
      output: "View",
      path: "/domain-words"
    },
    {
      id: "taxonomy",
      name: "Taxonomy outputs",
      description: "Extract and manage important keywords",
      output: "View",
      path: "/taxonomy"
    },
    {
      id: "word-structure",
      name: "Word structure outputs",
      description: "Analyze word structures and patterns",
      output: "View",
      path: "/word-structure"
    },
    {
      id: "definition",
      name: "Definition outputs",
      description: "View detailed definitions, translations",
      output: "View",
      path: "/definition"
    }
  ];

  const username = localStorage.getItem('username');

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <button className="menu-button" onClick={toggleSidebar}>
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="header-title">Evaluate Outputs</h1>
        </div>
        <div className="header-right">
          <span className="username">Welcome, {username}</span>
          <button className="icon-button">
            <Bell size={20} />
          </button>
          <button className="icon-button" onClick={handleLogout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="main-container">
        {/* Sidebar */}
        <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
          <nav className="sidebar-nav">
            <div className="sidebar-header">
              <h3>Navigation</h3>
            </div>
            <ul>
              <li><a href="/" className="active">Dashboard</a></li>
              <li><a href="/outputs">Outputs & Activity</a></li>
              <li><a href="#assembly">Assembly</a></li>
              <li><a href="#settings">Settings</a></li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Quick Stats Section */}
          <div className="quick-stats-section">
            <div className="stats-cards">
              <div className="stats-card total-edits">
                <div className="stats-icon">
                  <Activity size={24} />
                </div>
                <div className="stats-content">
                  <span className="stats-label">Total Edits</span>
                  <span className="stats-count">{stats.totalEdits}</span>
                </div>
              </div>
              <div className="stats-card today-activity">
                <div className="stats-icon">
                  <Clock size={24} />
                </div>
                <div className="stats-content">
                  <span className="stats-label">Today's Edits</span>
                  <span className="stats-count">{stats.todayEdits}</span>
                </div>
              </div>
              <div className="stats-card view-activity">
                <div className="stats-content">
                  <span className="stats-label">Activity Log</span>
                  <a href="/outputs" className="view-activity-btn">
                    View Full Activity
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="tools-grid">
            {tools.map((tool, index) => (
              <div key={index} className="tool-card">
                <div className="tool-header">
                  <h2 className="tool-title">{tool.name}</h2>
                </div>
                <div className="tool-description">
                  {tool.description}
                </div>
                
                <div className="output-section">
                  <h3 className="output-title">Outputs</h3>
                  <a href={tool.path} className="view-button">
                    {tool.output}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;