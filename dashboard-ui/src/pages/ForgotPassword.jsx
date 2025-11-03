import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import './Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email input, 2: Success message
  const [formData, setFormData] = useState({
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:8000/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send reset email');
      }

      const data = await response.json();
      setSuccess(data.message);
      setStep(2);
      
      // Log development token if present
      if (data.development_token) {
        console.log('Development Reset Token:', data.development_token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button 
          className="back-button auth-back-button"
          onClick={() => navigate('/login')}
        >
          <ArrowLeft size={20} />
          Back to Login
        </button>

        {step === 1 ? (
          <>
            <h2>Reset Your Password</h2>
            <p className="auth-subtitle">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
            
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="auth-button"
                disabled={loading}
              >
                {loading ? 'Sending Instructions...' : 'Send Reset Instructions'}
              </button>
            </form>

            <p className="auth-switch">
              Remember your password?{' '}
              <Link to="/login" className="auth-link">
                Back to Login
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="success-icon">
              <CheckCircle size={48} color="#10b981" />
            </div>
            <h2>Check Your Email</h2>
            <p className="auth-subtitle success-message">
              {success}
            </p>
            <p className="email-instructions">
              We've sent password reset instructions to:<br />
              <strong>{formData.email}</strong>
            </p>
            
            <div className="success-actions">
              <button 
                className="auth-button secondary"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </button>
              <p className="auth-note">
                Didn't receive the email? Check your spam folder or{' '}
                <button 
                  type="button" 
                  className="auth-link"
                  onClick={() => setStep(1)}
                >
                  try again with a different email
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;