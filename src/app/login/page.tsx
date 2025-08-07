import React from 'react';
import Link from 'next/link';
import LoginForm from '@/app/components/LoginForm';
import AppHeader from '@/app/components/AppHeader';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <AppHeader currentPath="/login" />
      
      <main className="flex flex-col items-center justify-center px-4 py-16">
        <div className="mb-8">
          <Link href="/" className="text-green-400 flex items-center">
            <svg 
              className="w-4 h-4 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
              />
            </svg>
            Back to Home
          </Link>
        </div>
        
        <LoginForm />
      </main>
    </div>
  );
} 