import React, { useState, useEffect } from 'react';
import { 
  ServiceRequest, 
  getServiceById, 
  getUserById, 
  getProviderById,
  Service,
  Provider,
  User
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
  const [service, setService] = useState<Service | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [serviceData, providerData, userData] = await Promise.all([
          getServiceById(request.serviceId),
          request.providerId && request.providerId !== 'pending' ? getProviderById(request.providerId) : Promise.resolve(null),
          getUserById(request.userId)
        ]);

        setService(serviceData);
        setProvider(providerData);
        setUser(userData);
      } catch (error) {
        console.error('Error loading request data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [request.serviceId, request.providerId, request.userId]);

  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  // Show card even if service details haven't loaded yet for providers.
  if (!isProvider) {
    if (!service || (!provider && !showPendingProvider)) {
      return null;
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'claimed':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'claimed':
        return 'Claimed';
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'declined':
        return 'Declined';
      case 'completed':
        return 'Completed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Check if claim is expired
  const isClaimExpired = request.status === 'claimed' && request.expiresAt && new Date(request.expiresAt) < new Date();
  const timeLeft = request.expiresAt && request.status === 'claimed' 
    ? Math.max(0, Math.floor((new Date(request.expiresAt).getTime() - new Date().getTime()) / 1000 / 60))
    : 0;

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-800 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{service?.name || 'Service'}</h3>
          {isProvider ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">Requested by: {user?.name || 'Client'}</p>
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
        <div className="text-right">
          <span className={`px-2 py-1 text-xs rounded font-medium ${getStatusBadgeColor(request.status)}`}>
            {getStatusText(request.status)}
          </span>
          {request.status === 'claimed' && (
            <div className="mt-1">
              <span className={`text-xs ${
                isClaimExpired 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-orange-600 dark:text-orange-400'
              }`}>
                {isClaimExpired ? 'Expired' : `${timeLeft}m left`}
              </span>
            </div>
          )}
        </div>
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