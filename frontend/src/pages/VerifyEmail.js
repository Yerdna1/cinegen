import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      await api.post('/auth/verify-email', { token });
      setStatus('success');
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full text-center">
        {status === 'verifying' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verifying your email...</p>
          </div>
        )}
        {status === 'success' && (
          <div>
            <h2 className="text-2xl font-semibold text-green-600">Email Verified!</h2>
            <p className="mt-2 text-gray-600">Your email has been successfully verified.</p>
            <Link to="/dashboard" className="mt-4 inline-block text-primary-600 hover:text-primary-500">
              Go to Dashboard
            </Link>
          </div>
        )}
        {status === 'error' && (
          <div>
            <h2 className="text-2xl font-semibold text-red-600">Verification Failed</h2>
            <p className="mt-2 text-gray-600">The verification link is invalid or expired.</p>
            <Link to="/login" className="mt-4 inline-block text-primary-600 hover:text-primary-500">
              Return to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
