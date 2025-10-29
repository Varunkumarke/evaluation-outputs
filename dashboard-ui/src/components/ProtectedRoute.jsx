import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const sessionToken = localStorage.getItem('session_token');
      
      if (!sessionToken) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/verify-session?session_token=${sessionToken}`);
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('session_token');
          localStorage.removeItem('username');
          setIsAuthenticated(false);
        }
      } catch (error) {
        localStorage.removeItem('session_token');
        localStorage.removeItem('username');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;