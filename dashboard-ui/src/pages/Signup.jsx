import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext'; // ✅ ADD THIS IMPORT
import './Auth.css';

const Signup = () => {
  const navigate = useNavigate();
  const { success, error } = useToast(); // ✅ ADD THIS LINE
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    domain: ''  // ADD DOMAIN FIELD
  });
  const [loading, setLoading] = useState(false);
  const [componentError, setComponentError] = useState(''); // ✅ RENAMED to avoid conflict

  // Domain options
  const domainOptions = [
    { value: '', label: 'Select your domain', disabled: true },
    { value: 'education', label: 'Education' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'technology', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'retail', label: 'Retail' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'research', label: 'Research' },
    { value: 'government', label: 'Government' },
    { value: 'other', label: 'Other' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setComponentError('');

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setComponentError('Passwords do not match');
      error('Passwords do not match'); // ✅ TOAST FOR VALIDATION ERROR
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setComponentError('Password must be at least 6 characters long');
      error('Password must be at least 6 characters long'); // ✅ TOAST FOR VALIDATION ERROR
      setLoading(false);
      return;
    }

    if (!formData.domain) {
      setComponentError('Please select a domain');
      error('Please select a domain'); // ✅ TOAST FOR VALIDATION ERROR
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          domain: formData.domain  // ADD DOMAIN FIELD
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Signup failed');
      }

      success('Account created successfully! Please sign in.'); // ✅ TOAST FOR SUCCESS
      navigate('/login');
    } catch (err) {
      setComponentError(err.message);
      error(err.message); // ✅ TOAST FOR API ERROR
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Sign up for a new account</p>
        
        {componentError && ( // ✅ UPDATED VARIABLE NAME
          <div className="auth-error">
            {componentError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Choose a username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          {/* ADD DOMAIN FIELD */}
          <div className="form-group">
            <label htmlFor="domain">Domain</label>
            <select
              id="domain"
              name="domain"
              value={formData.domain}
              onChange={handleChange}
              required
              className="domain-select"
            >
              {domainOptions.map((option, index) => (
                <option 
                  key={index} 
                  value={option.value} 
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Create a password (min. 6 characters)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <span onClick={() => navigate('/login')} className="auth-link">
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;