import React from 'react';
import { Provider } from '@/data/store';

interface ProviderCardProps {
  provider: Provider;
  onSelect?: () => void;
  actionLabel?: string;
  showAction?: boolean;
}

export default function ProviderCard({ 
  provider, 
  onSelect, 
  actionLabel = "View Services", 
  showAction = true 
}: ProviderCardProps) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
      <div className="p-5">
        <h3 className="font-semibold text-lg mb-1">{provider.name}</h3>
        <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
          {provider.specialty}
        </p>
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            <svg 
              className="w-4 h-4 text-yellow-400 fill-current" 
              viewBox="0 0 24 24"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            <span className="ml-1 text-sm font-medium">{provider.rating}</span>
          </div>
          <span className="mx-2 text-gray-500">•</span>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {provider.location}
          </p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {provider.services.length} {provider.services.length === 1 ? 'service' : 'services'} available
        </p>
        
        {showAction && (
          <button
            onClick={onSelect}
            className="mt-4 w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition font-medium text-sm"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
} 