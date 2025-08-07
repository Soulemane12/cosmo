"use client";

import React, { useState } from 'react';
import { useAuth } from '@/data/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [location, setLocation] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [userType, setUserType] = useState<'user' | 'provider'>('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);
  const { registerNewUser, registerNewProvider, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setRequiresEmailConfirmation(false);

    // Validation
    if (!name || !email || !password || !confirmPassword || !location || (userType === 'provider' && !specialty)) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      let result;
      if (userType === 'user') {
        result = await registerNewUser(name, email, password, location);
      } else {
        result = await registerNewProvider(name, email, password, location, specialty);
      }

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        if (result.requiresEmailConfirmation) {
          setRequiresEmailConfirmation(true);
          setSuccess(true);
          setError('');
        } else {
          setError(result.error || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      setError('An error occurred during registration');
    }
  };

  return (
    <div className="bg-gray-800 shadow-md rounded-lg p-8 max-w-md w-full">
      <h2 className="text-2xl font-bold text-white mb-6 text-center logo-text">
        Sign Up for cosmologo
      </h2>
      
      {error && (
        <div className="bg-red-900 border border-red-800 text-red-200 px-4 py-3 rounded mb-4 relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-900 border border-green-800 text-green-200 px-4 py-3 rounded mb-4 relative" role="alert">
          <span className="block sm:inline">
            {requiresEmailConfirmation 
              ? 'Account created successfully! Please check your email to confirm your account before signing in.'
              : 'Registration successful! Redirecting to login...'
            }
          </span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account Type Selection */}
        <div className="flex justify-center space-x-4 mb-4">
          <button
            type="button"
            className={`px-4 py-2 rounded-md ${
              userType === 'user' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-700 text-white'
            }`}
            onClick={() => setUserType('user')}
          >
            Client Account
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-md ${
              userType === 'provider' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-white'
            }`}
            onClick={() => setUserType('provider')}
          >
            Provider Account
          </button>
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
            {userType === 'provider' ? 'Full Name / Practice Name' : 'Full Name'}
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
            required
          />
        </div>
        
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
            required
          />
        </div>
        
        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
            required
            minLength={8}
          />
          <p className="text-xs text-gray-400 mt-1">Must be at least 8 characters long</p>
        </div>
        
        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
            required
          />
        </div>
        
        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">
            Location
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
            placeholder="e.g. Los Angeles, CA"
            required
          />
        </div>
        
        {/* Provider-specific fields */}
        {userType === 'provider' && (
          <div>
            <label htmlFor="specialty" className="block text-sm font-medium text-gray-300 mb-1">
              Specialty
            </label>
            <input
              id="specialty"
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
              placeholder="e.g. Facial Procedures, Body Contouring"
              required
            />
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading || success}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${userType === 'user' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6`}
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-green-400 hover:text-green-300">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
} 