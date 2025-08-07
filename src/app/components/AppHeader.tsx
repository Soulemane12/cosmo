"use client";

import Link from 'next/link';
import React, { useState } from 'react';
import { useAuth } from '@/data/AuthContext';
import NotificationBell from './NotificationBell';

interface AppHeaderProps {
  currentPath: string;
}

export default function AppHeader({ currentPath }: AppHeaderProps) {
  const { currentUser, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    // No need to redirect since the layout will handle it
  };

  return (
    <header className="bg-gray-900 shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold logo-text">
                cosmologo
              </Link>
            </div>
            <nav className="ml-6 flex space-x-8">
              <Link 
                href="/" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentPath === '/' 
                    ? 'border-blue-500 text-white' 
                    : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-gray-200'
                }`}
              >
                Home
              </Link>
              {currentUser && (
                <>
                  {currentUser.type === 'user' && (
                    <Link 
                      href="/user" 
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        currentPath.startsWith('/user') 
                          ? 'border-green-500 text-white' 
                          : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-gray-200'
                      }`}
                    >
                      Client Dashboard
                    </Link>
                  )}
                  {currentUser.type === 'provider' && (
                    <Link 
                      href="/service_provider" 
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        currentPath.startsWith('/service_provider') 
                          ? 'border-blue-500 text-white' 
                          : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-gray-200'
                      }`}
                    >
                      Provider Dashboard
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>
          
          <div className="flex items-center">
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <NotificationBell className="text-white" />
                <div className="relative ml-3">
                  <div>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                          {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="ml-2 text-gray-700 dark:text-gray-300 text-sm font-medium">
                          {currentUser.name}
                        </span>
                        <svg
                          className="ml-1 h-5 w-5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </button>
                  </div>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <p className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b dark:border-gray-700">
                        Signed in as<br />
                        <span className="font-medium">{currentUser.email}</span>
                      </p>
                      {currentUser.type === 'user' && (
                        <Link
                          href="/user"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Dashboard
                        </Link>
                      )}
                      {currentUser.type === 'provider' && (
                        <Link
                          href="/service_provider"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className={`text-sm font-medium ${
                    currentPath === '/login'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className={`rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 ${
                    currentPath === '/signup' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  }`}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 