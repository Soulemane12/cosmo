"use client";

import React, { useState, useEffect } from 'react';
import { 
  updateServiceRequestStatus, 
  getServiceRequestsByProviderId,
  getProviderById,
  getUserById,
  ServiceRequest,
  getAllServiceRequests,
  getServiceById,
  getUnclaimedServiceRequests,
  getClaimedServiceRequests,
  claimServiceRequest,
  acceptClaimedRequest,
  declineClaimedRequest
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'marketplace' | 'accepted'>('dashboard');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [providerDetails, setProviderDetails] = useState<Provider | null>(null);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  interface ClientData extends User {
    requestCount: number;
    pendingCount: number;
  }
  
  const [clients, setClients] = useState<{[key: string]: ClientData}>({});
  const [marketplaceRequests, setMarketplaceRequests] = useState<ServiceRequest[]>([]);
  const [claimedRequests, setClaimedRequests] = useState<ServiceRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isClaiming, setIsClaiming] = useState<string | null>(null);

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
          const [providerRequests, providerDetailsData, allRequests, unclaimedRequests, claimedRequestsData] = await Promise.all([
            getServiceRequestsByProviderId(currentUser.id),
            getProviderById(currentUser.id),
            getAllServiceRequests(),
            getUnclaimedServiceRequests(),
            getClaimedServiceRequests(currentUser.id)
          ]);

          setRequests(providerRequests);
          setProviderDetails(providerDetailsData);
          setClaimedRequests(claimedRequestsData);
          
          // Build clients map
          await refreshClientsMap(providerRequests);
          
          // Get marketplace requests (requests without a specific provider)
          setMarketplaceRequests(unclaimedRequests);
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
      setActiveTab('marketplace');
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
  
  // Function to check if a claimed request is expired
  const isClaimExpired = (request: ServiceRequest) => {
    if (!request.expiresAt) return false;
    return new Date(request.expiresAt) < new Date();
  };
  
  // Handle claiming a marketplace request
  const handleClaimRequest = async (requestId: string) => {
    if (!currentUser) return;
    
    setIsClaiming(requestId);
    try {
      const success = await claimServiceRequest(requestId, currentUser.id);
      
      if (success) {
        // Refresh data
        const [unclaimedRequests, claimedRequestsData] = await Promise.all([
          getUnclaimedServiceRequests(),
          getClaimedServiceRequests(currentUser.id)
        ]);
        
        setMarketplaceRequests(unclaimedRequests);
        setClaimedRequests(claimedRequestsData);
        
        alert('You have successfully claimed this request! You have 5 minutes to accept or decline.');
        setActiveTab('marketplace');
      } else {
        alert('This request was already claimed by another provider. Please try another request.');
      }
    } catch (error) {
      console.error('Error claiming request:', error);
      alert('Failed to claim request. Please try again.');
    } finally {
      setIsClaiming(null);
    }
  };

  // Handle accepting a claimed request
  const handleAcceptClaimedRequest = async (requestId: string) => {
    if (!currentUser) return;
    
    try {
      const success = await acceptClaimedRequest(requestId, currentUser.id);
      
      if (success) {
        // Refresh data
        const [providerRequests, unclaimedRequests, claimedRequestsData] = await Promise.all([
          getServiceRequestsByProviderId(currentUser.id),
          getUnclaimedServiceRequests(),
          getClaimedServiceRequests(currentUser.id)
        ]);
        
        setRequests(providerRequests);
        setMarketplaceRequests(unclaimedRequests);
        setClaimedRequests(claimedRequestsData);
        
        // Update clients map
        await refreshClientsMap(providerRequests);
        
        alert('Service request accepted successfully!');
      } else {
        alert('Failed to accept request. It may have expired or been claimed by another provider.');
      }
    } catch (error) {
      console.error('Error accepting claimed request:', error);
      alert('Failed to accept request. Please try again.');
    }
  };

  // Handle declining a claimed request
  const handleDeclineClaimedRequest = async (requestId: string) => {
    if (!currentUser) return;
    
    try {
      const success = await declineClaimedRequest(requestId, currentUser.id);
      
      if (success) {
        // Refresh data
        const [unclaimedRequests, claimedRequestsData] = await Promise.all([
          getUnclaimedServiceRequests(),
          getClaimedServiceRequests(currentUser.id)
        ]);
        
        setMarketplaceRequests(unclaimedRequests);
        setClaimedRequests(claimedRequestsData);
        
        alert('Service request declined. It is now available for other providers.');
      } else {
        alert('Failed to decline request. Please try again.');
      }
    } catch (error) {
      console.error('Error declining claimed request:', error);
      alert('Failed to decline request. Please try again.');
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
                Available Requests
                {getMatchingMarketplaceRequests().length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-purple-600 rounded-full">
                    {getMatchingMarketplaceRequests().length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('accepted')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'accepted'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Accepted Requests
                {acceptedRequests.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-green-600 rounded-full">
                    {acceptedRequests.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Tab content */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Available Requests
                  </h3>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {getMatchingMarketplaceRequests().length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ready to claim
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    My Claims
                  </h3>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {claimedRequests.length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pending response
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Active Clients
                  </h3>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {uniqueClientsCount}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total clients
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveTab('marketplace')}
                    className="p-4 border border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                  >
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">Browse Available Requests</h4>
                    <p className="text-sm text-purple-600 dark:text-purple-300 mt-1">
                      Find new service requests to claim
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab('accepted')}
                    className="p-4 border border-green-200 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  >
                    <h4 className="font-medium text-green-900 dark:text-green-100">View Accepted Requests</h4>
                    <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                      See your accepted jobs
                    </p>
                  </button>
                  <button
                    onClick={() => setIsAddServiceModalOpen(true)}
                    className="p-4 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Add Service</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                      Publish a service you offer
                    </p>
                  </button>
                </div>
              </div>

              {/* Your Services (inline preview) */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Services</h3>
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
                  <p className="text-gray-500 dark:text-gray-400">No services listed yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {providerDetails.services.slice(0, 6).map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        isProviderView={true}
                        showAction={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Marketplace tab */}
          {activeTab === 'marketplace' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Available Service Requests
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Browse service requests that match your specialty. Claim requests to connect with new clients. First come, first served!
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
                    No service requests available at the moment.
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
                        <span className="px-2 py-1 text-xs rounded font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Available
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
                          disabled={isClaiming === request.id}
                          className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded transition font-medium text-sm"
                        >
                          {isClaiming === request.id ? 'Claiming...' : 'Claim This Request'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* My claimed (inline) */}
              <div className="mt-10">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">My Claimed (pending response)</h3>
                {claimedRequests.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No claimed requests.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {claimedRequests.map(request => {
                      const isExpired = isClaimExpired(request);
                      const timeLeft = request.expiresAt ? Math.max(0, Math.floor((new Date(request.expiresAt).getTime() - new Date().getTime()) / 1000 / 60)) : 0;
                      return (
                        <div key={request.id} className="border rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800 p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">Claimed Request</h4>
                              <p className="text-xs text-gray-500">ID: {request.id}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded font-medium ${isExpired ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'}`}>
                              {isExpired ? 'Expired' : `${timeLeft}m left`}
                            </span>
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button onClick={() => handleAcceptClaimedRequest(request.id)} disabled={isExpired} className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded text-sm">Accept</button>
                            <button onClick={() => handleDeclineClaimedRequest(request.id)} disabled={isExpired} className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded text-sm">Decline</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'accepted' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Accepted Requests
              </h2>
              
              {acceptedRequests.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  You don't have any accepted requests yet.
                </p>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {acceptedRequests.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        isProvider={true}
                      />
                    ))}
                  </div>
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