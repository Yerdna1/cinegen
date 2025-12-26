import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-primary-600">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900">Page Not Found</h2>
        <p className="mt-2 text-gray-600">The page you are looking for does not exist.</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
