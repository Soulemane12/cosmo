import React from 'react';
import { 
  ServiceRequest, 
  getServiceById, 
  getUserById, 
  getProviderById 
} from '@/data/store';

interface RequestCardProps {
  request: ServiceRequest;
  isProvider?: boolean;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  showPendingProvider?: boolean;
}

export default function RequestCard({ 
  request, 
  isProvider = false,
  onAccept,
  onDecline,
  showPendingProvider = false
}: RequestCardProps) {
  const service = getServiceById(request.serviceId);
  const provider = getProviderById(request.providerId);
  const user = getUserById(request.userId);

  if (!service || (!isProvider && !provider && !showPendingProvider) || (isProvider && !user)) {
    return null;
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-800 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{service.name}</h3>
          {isProvider ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">Requested by: {user?.name}</p>
          ) : (
            showPendingProvider ? (
              <p className="text-sm text-purple-600 dark:text-purple-400">
                <span className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Finding providers...
                </span>
              </p>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">Provider: {provider?.name}</p>
            )
          )}
        </div>
        <span className={`px-2 py-1 text-xs rounded font-medium ${getStatusBadgeColor(request.status)}`}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>
      
      <div className="text-sm mb-3">
        <p className="text-gray-600 dark:text-gray-300">
          <span className="font-medium">Requested:</span> {new Date(request.requestDate).toLocaleDateString()}
        </p>
        {request.scheduledDate && (
          <p className="text-gray-600 dark:text-gray-300">
            <span className="font-medium">Scheduled:</span> {new Date(request.scheduledDate).toLocaleDateString()}
          </p>
        )}
        {request.notes && (
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            <span className="font-medium">Notes:</span> {request.notes}
          </p>
        )}
      </div>
      
      {isProvider && request.status === 'pending' && (
        <div className="flex space-x-2">
          <button 
            onClick={() => onAccept && onAccept(request.id)}
            className="flex-1 py-2 px-3 bg-green-500 hover:bg-green-600 text-white rounded transition text-sm"
          >
            Accept
          </button>
          <button 
            onClick={() => onDecline && onDecline(request.id)}
            className="flex-1 py-2 px-3 bg-red-500 hover:bg-red-600 text-white rounded transition text-sm"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
} 