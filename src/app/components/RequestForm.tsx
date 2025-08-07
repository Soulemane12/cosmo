import React, { useState } from 'react';
import { Service, Provider } from '@/data/store';

interface RequestFormProps {
  service: Service;
  provider: Provider;
  userId: string;
  onSubmit: (data: {
    providerId: string;
    serviceId: string;
    userId: string;
    notes: string;
    scheduledDate: string;
  }) => void;
  onCancel: () => void;
}

export default function RequestForm({ 
  service, 
  provider, 
  userId, 
  onSubmit, 
  onCancel 
}: RequestFormProps) {
  const [notes, setNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scheduledDate) {
      setError('Please select a scheduled date');
      return;
    }

    // Calculate minimum date (today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(scheduledDate);
    
    if (selectedDate < today) {
      setError('Please select a future date');
      return;
    }

    onSubmit({
      providerId: provider.id,
      serviceId: service.id,
      userId,
      notes,
      scheduledDate,
    });
  };

  // Calculate minimum date string for the date input (today)
  const getMinDate = () => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-1">{service.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">${service.price.toLocaleString()}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Provider: {provider.name}</p>
        </div>

        <div>
          <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Preferred Date
          </label>
          <input
            type="date"
            id="scheduledDate"
            min={getMinDate()}
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Any specific requirements or questions?"
          ></textarea>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Submit Request
          </button>
        </div>
      </div>
    </form>
  );
} 