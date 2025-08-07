import React from 'react';
import Link from 'next/link';
import SignupForm from '@/app/components/SignupForm';
import AppHeader from '@/app/components/AppHeader';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <AppHeader currentPath="/signup" />
      
      <main className="flex flex-col items-center justify-center px-4 py-16">
        <div className="mb-8">
          <Link href="/" className="text-blue-400 flex items-center">
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
        
        <SignupForm />
      </main>
    </div>
  );
} 