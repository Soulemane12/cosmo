"use client";

import React, { useState, useEffect } from 'react';
import { 
  updateServiceRequestStatus, 
  getServiceRequestsByProviderId,
  getProviderById,
  getUserById,
  ServiceRequest,
  getAllServiceRequests,
  getServiceById
} from '@/data/store';
import { useAuth } from '@/data/AuthContext';
import { useRouter } from 'next/navigation';
import AppHeader from '../components/AppHeader';
import RequestCard from '../components/RequestCard';
import ServiceCard from '../components/ServiceCard';
import Modal from '../components/Modal';
import AddServiceForm from '../components/AddServiceForm';
import { Provider, User } from '@/data/store';

export default function ServiceProviderDashboard() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'requests' | 'marketplace'>('dashboard');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [providerDetails, setProviderDetails] = useState<Provider | null>(null);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  interface ClientData extends User {
    requestCount: number;
    pendingCount: number;
  }
  
  const [clients, setClients] = useState<{[key: string]: ClientData}>({});
  const [marketplaceRequests, setMarketplaceRequests] = useState<ServiceRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && (!currentUser || currentUser.type !== 'provider')) {
      router.push('/login');
      return;
    }

    if (currentUser) {
      const loadData = async () => {
        setIsLoadingData(true);
        try {
          // Load all data in parallel
          const [providerRequests, providerDetailsData, allRequests] = await Promise.all([
            getServiceRequestsByProviderId(currentUser.id),
            getProviderById(currentUser.id),
            getAllServiceRequests()
          ]);

          setRequests(providerRequests);
          setProviderDetails(providerDetailsData);
          
          // Build clients map
          await refreshClientsMap(providerRequests);
          
          // Get marketplace requests (requests without a specific provider)
          const pendingRequests = allRequests.filter(req => req.providerId === 'pending');
          setMarketplaceRequests(pendingRequests);
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setIsLoadingData(false);
        }
      };

      loadData();
    }
  }, [currentUser, isLoading, router]);

  // Handle accepting a request
  const handleAcceptRequest = async (id: string) => {
    if (!currentUser) return;
    
    try {
      await updateServiceRequestStatus(id, 'accepted');
      const updatedRequests = await getServiceRequestsByProviderId(currentUser.id);
      setRequests(updatedRequests);
      
      // Update clients map
      await refreshClientsMap(updatedRequests);
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request. Please try again.');
    }
  };

  // Handle declining a request
  const handleDeclineRequest = async (id: string) => {
    if (!currentUser) return;
    
    try {
      await updateServiceRequestStatus(id, 'declined');
      const updatedRequests = await getServiceRequestsByProviderId(currentUser.id);
      setRequests(updatedRequests);
      
      // Update clients map
      await refreshClientsMap(updatedRequests);
    } catch (error) {
      console.error('Error declining request:', error);
      alert('Failed to decline request. Please try again.');
    }
  };

  // Refresh clients map based on updated requests
  const refreshClientsMap = async (updatedRequests: ServiceRequest[]) => {
    const clients: {[key: string]: ClientData} = {};
    
    for (const request of updatedRequests) {
      if (!clients[request.userId]) {
        const user = await getUserById(request.userId);
        if (user) {
          clients[request.userId] = {
            ...user,
            requestCount: 1,
            pendingCount: request.status === 'pending' ? 1 : 0
          };
        }
      } else {
        clients[request.userId].requestCount += 1;
        if (request.status === 'pending') {
          clients[request.userId].pendingCount += 1;
        }
      }
    }
    
    setClients(clients);
  };

  // Handle service added
  const handleServiceAdded = async () => {
    if (!currentUser) return;
    
    try {
      // Refresh provider details to get updated services
      const updatedProvider = await getProviderById(currentUser.id);
      setProviderDetails(updatedProvider);
      setIsAddServiceModalOpen(false);
      setActiveTab('services');
    } catch (error) {
      console.error('Error refreshing provider details:', error);
    }
  };

  // Filter requests by status
  const pendingRequests = requests.filter(req => req.status === 'pending');
  const acceptedRequests = requests.filter(req => req.status === 'accepted');
  const declinedRequests = requests.filter(req => req.status === 'declined');

  // Count unique clients
  const uniqueClientsCount = Object.keys(clients).length;

  // Filter to show only services that match provider's specialty
  const getMatchingMarketplaceRequests = (): ServiceRequest[] => {
    if (!providerDetails) return [];
    
    return marketplaceRequests.filter(request => {
      // For now, we'll show all marketplace requests since we don't have service category matching
      // In a real implementation, you'd want to fetch the service details and match by category
      return true;
    });
  };
  
  // Handle claiming a marketplace request
  const handleClaimRequest = async (requestId: string) => {
    if (!currentUser || !providerDetails) return;
    
    try {
      const request = marketplaceRequests.find(req => req.id === requestId);
      if (!request) return;
      
      // Update the request with this provider's ID and set status to accepted
      await updateServiceRequestStatus(requestId, 'accepted', currentUser.id);
      
      // Refresh requests
      const providerRequests = await getServiceRequestsByProviderId(currentUser.id);
      setRequests(providerRequests);
      
      // Remove from marketplace requests
      setMarketplaceRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Update clients map
      await refreshClientsMap(providerRequests);
      
      alert('You have successfully claimed this service request.');
    } catch (error) {
      console.error('Error claiming request:', error);
      alert('Failed to claim request. Please try again.');
    }
  };

  if (isLoading || !currentUser || !providerDetails || isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppHeader currentPath="/service_provider" />
        <div className="max-w-7xl mx-auto py-12 px-4 text-center">
          <div className="animate-pulse h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded mx-auto mb-4"></div>
          <div className="animate-pulse h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader currentPath="/service_provider" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header section */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome, {providerDetails?.name}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  Manage your services and client requests
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="flex flex-wrap -mb-px">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'dashboard'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'marketplace'
                    ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Marketplace
                {getMatchingMarketplaceRequests().length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-purple-600 rounded-full">
                    {getMatchingMarketplaceRequests().length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'services'
                    ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                My Services
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'requests'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Service Requests
                {pendingRequests.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-yellow-500 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Tab content */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Dashboard content - no changes */}
            </div>
          )}
          
          {/* Marketplace tab */}
          {activeTab === 'marketplace' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Service Marketplace
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Browse service requests that match your specialty. Claim requests to connect with new clients.
              </p>
              
              {getMatchingMarketplaceRequests().length === 0 ? (
                <div className="text-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <svg 
                    className="w-12 h-12 mx-auto text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                  <p className="mt-4 text-gray-500 dark:text-gray-400">
                    No matching service requests available at the moment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {getMatchingMarketplaceRequests().map(request => (
                    <div key={request.id} className="border rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">Service Request</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Request ID: {request.id}
                          </p>
                          <p className="text-sm text-purple-600 dark:text-purple-400">
                            Service ID: {request.serviceId}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs rounded font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          Unclaimed
                        </span>
                      </div>
                      
                      <div className="text-sm mb-3">
                        <p className="text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Requested:</span> {new Date(request.requestDate).toLocaleDateString()}
                        </p>
                        {request.scheduledDate && (
                          <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Preferred Date:</span> {new Date(request.scheduledDate).toLocaleDateString()}
                          </p>
                        )}
                        {request.notes && (
                          <p className="text-gray-600 dark:text-gray-300 mt-2">
                            <span className="font-medium">Notes:</span> {request.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="mt-3">
                        <button
                          onClick={() => handleClaimRequest(request.id)}
                          className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded transition font-medium text-sm"
                        >
                          Claim This Request
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Service Requests
              </h2>
              
              {requests.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  You don't have any service requests yet.
                </p>
              ) : (
                <div className="space-y-8">
                  {/* Pending Requests */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300 flex items-center">
                      Pending Requests
                      {pendingRequests.length > 0 && (
                        <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-yellow-900 dark:text-yellow-300">
                          {pendingRequests.length}
                        </span>
                      )}
                    </h3>
                    
                    {pendingRequests.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">
                        No pending requests.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pendingRequests.map((request) => (
                          <RequestCard
                            key={request.id}
                            request={request}
                            isProvider={true}
                            onAccept={handleAcceptRequest}
                            onDecline={handleDeclineRequest}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Accepted Requests */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300 flex items-center">
                      Accepted Requests
                      {acceptedRequests.length > 0 && (
                        <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                          {acceptedRequests.length}
                        </span>
                      )}
                    </h3>
                    
                    {acceptedRequests.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">
                        No accepted requests.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {acceptedRequests.map((request) => (
                          <RequestCard
                            key={request.id}
                            request={request}
                            isProvider={true}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Declined Requests */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300 flex items-center">
                      Declined Requests
                      {declinedRequests.length > 0 && (
                        <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                          {declinedRequests.length}
                        </span>
                      )}
                    </h3>
                    
                    {declinedRequests.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">
                        No declined requests.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {declinedRequests.map((request) => (
                          <RequestCard
                            key={request.id}
                            request={request}
                            isProvider={true}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'services' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  My Services
                </h2>
                <button
                  onClick={() => setIsAddServiceModalOpen(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Service
                </button>
              </div>
              
              {providerDetails.services.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                  <div className="text-gray-500 dark:text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">No services listed</h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">Start by adding your first service</p>
                  <button
                    onClick={() => setIsAddServiceModalOpen(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Add Your First Service
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {providerDetails.services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      isProviderView={true}
                      showAction={true}
                      actionLabel="Edit Service"
                      onSelect={() => {
                        // Service editing functionality would go here
                        alert('Edit service functionality will be implemented soon');
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add Service Modal */}
      <Modal
        isOpen={isAddServiceModalOpen}
        onClose={() => setIsAddServiceModalOpen(false)}
        title="Add New Service"
      >
        <AddServiceForm
          providerId={currentUser.id}
          onServiceAdded={handleServiceAdded}
          onCancel={() => setIsAddServiceModalOpen(false)}
        />
      </Modal>
    </div>
  );
} 