'use client';

import { useState } from 'react';
import { updateServiceCatalog } from '@/data/store';

export default function AdminPage() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdateCatalog = async () => {
    if (!confirm('This will replace all existing services with only the three specified services. Continue?')) {
      return;
    }

    setIsUpdating(true);
    setMessage('');

    try {
      const success = await updateServiceCatalog();
      if (success) {
        setMessage('Service catalog updated successfully! Only Filler, IV Therapy, and Neurotoxin are now available.');
      } else {
        setMessage('Failed to update service catalog. Please try again.');
      }
    } catch (error) {
      setMessage('An error occurred while updating the service catalog.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Admin Panel
          </h1>

          <div className="space-y-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Service Catalog Management
              </h2>
              
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  This will update the service catalog to only include these three services:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                  <li><strong>Filler</strong> - $900 per syringe (Appointment duration: 30-40mins)</li>
                  <li><strong>IV Therapy</strong> - $350 (Appointment duration: 30-40 mins) - Immunity Boost and Inner Beauty</li>
                  <li><strong>Neurotoxin</strong> - $20 a unit (Appointment duration: varies by treatment area)</li>
                </ul>
              </div>

              <button
                onClick={handleUpdateCatalog}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isUpdating ? 'Updating...' : 'Update Service Catalog'}
              </button>
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('successfully') 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
