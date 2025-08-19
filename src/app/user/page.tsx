"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/data/AuthContext';
import { 
  getServiceRequestsByUserId, 
  getServiceById, 
  getProviderById,
  ServiceRequest,
  Service,
  Provider,
  deleteServiceRequest
} from '@/data/store';
import RequestCard from '../components/RequestCard';
import EditRequestModal from '../components/EditRequestModal';

export default function UserDashboard() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [services, setServices] = useState<Map<string, Service>>(new Map());
  const [providers, setProviders] = useState<Map<string, Provider>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadRequests();
    }
  }, [currentUser]);

  const loadRequests = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const userRequests = await getServiceRequestsByUserId(currentUser.id);
      setRequests(userRequests);
      
      // Load related services and providers
      const serviceIds = [...new Set(userRequests.map(r => r.serviceId))];
      const providerIds = [...new Set(userRequests.map(r => r.providerId).filter(Boolean))];
      
      const [servicesData, providersData] = await Promise.all([
        Promise.all(serviceIds.map(id => getServiceById(id))),
        Promise.all(providerIds.map(id => getProviderById(id)))
      ]);
      
      const servicesMap = new Map();
      const providersMap = new Map();
      
      servicesData.forEach(service => {
        if (service) servicesMap.set(service.id, service);
      });
      
      providersData.forEach(provider => {
        if (provider) providersMap.set(provider.id, provider);
      });
      
      setServices(servicesMap);
      setProviders(providersMap);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRequest = (request: ServiceRequest) => {
    setEditingRequest(request);
    setIsEditModalOpen(true);
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    
    console.log('User attempting to delete request:', requestId);
    const success = await deleteServiceRequest(requestId);
    
    if (success) {
      console.log('Request deleted successfully, updating UI');
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } else {
      console.error('Failed to delete request:', requestId);
      alert('Failed to delete request. Please check the console for more details.');
    }
  };

  const handleSaveEdit = (updatedRequest: ServiceRequest) => {
    setRequests(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r));
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <p>Please log in to view your dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome, {currentUser.name}!
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage your service requests and track their progress.
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your requests...</p>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Your Service Requests
              </h2>
              
              {requests.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  You haven't made any service requests yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {requests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      showPendingProvider={request.providerId === 'pending'}
                      onEdit={handleEditRequest}
                      onDelete={handleDeleteRequest}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <EditRequestModal
        request={editingRequest}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRequest(null);
        }}
        onSave={handleSaveEdit}
      />
    </div>
  );
} 