"use client";

import React, { useState, useEffect } from 'react';
import { 
  Service, 
  Provider, 
  createServiceRequest, 
  getServiceRequestsByUserId,
  getUserById,
  getCartByUserId,
  addToCart,
  clearCart,
  getAllServices,
  getAllProviders
} from '@/data/store';
import { useAuth } from '@/data/AuthContext';
import { useRouter } from 'next/navigation';
import AppHeader from '../components/AppHeader';
// Provider browsing removed; clients browse services only
import ServiceCard from '../components/ServiceCard';
import Modal from '../components/Modal';
import RequestCard from '../components/RequestCard';
import CartDisplay from '../components/CartDisplay';

export default function UserDashboard() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  // Provider selection removed
  // Request flow removed: clients must add to cart and checkout
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'requests' | 'cart'>('services');
  const [requests, setRequests] = useState<Array<any>>([]);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [cart, setCart] = useState<any>({ items: [] });
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isGenericRequestModalOpen, setIsGenericRequestModalOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    // Check if user is authenticated and is a client
    if (!isLoading && (!currentUser || currentUser.type !== 'user')) {
      router.push('/login');
      return;
    }

    if (currentUser) {
      const loadData = async () => {
        setIsLoadingData(true);
        try {
          // Load all data in parallel
          const [userRequests, userDetailsData, userCart, servicesData, providersData] = await Promise.all([
            getServiceRequestsByUserId(currentUser.id),
            getUserById(currentUser.id),
            getCartByUserId(currentUser.id),
            getAllServices(),
            getAllProviders()
          ]);

          setRequests(userRequests);
          setUserDetails(userDetailsData);
          setCart(userCart || { items: [] });
          setAllServices(servicesData);
          setProviders(providersData);
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setIsLoadingData(false);
        }
      };

      loadData();
    }
  }, [currentUser, isLoading, router]);

  // Direct request flow removed

  // Viewing provider services removed

  // Selecting service opens request flow removed

  // Handle adding a service to cart
  const handleAddToCart = async (service: Service) => {
    if (!currentUser) return;
    
    try {
      await addToCart(currentUser.id, service.id, service.provider_id);
      const updatedCart = await getCartByUserId(currentUser.id);
      setCart(updatedCart || { items: [] });
      
      // Show confirmation
      alert(`${service.name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  // Handle cart checkout
  const handleCheckout = () => {
    if (!currentUser || cart.items.length === 0) return;
    
    setIsCheckoutModalOpen(true);
  };

  // Handle completing checkout
  const handleCompleteCheckout = async () => {
    if (!currentUser) return;
    
    try {
      // Convert cart items to service requests
      for (const item of cart.items) {
        await createServiceRequest({
          providerId: item.providerId,
          serviceId: item.serviceId,
          userId: currentUser.id,
          notes: "Ordered through cart checkout",
          requestDate: new Date().toISOString().split('T')[0],
          status: 'pending'
        });
      }
      
      // Clear the cart
      await clearCart(currentUser.id);
      const updatedCart = await getCartByUserId(currentUser.id);
      setCart(updatedCart || { items: [] });
      
      // Update requests
      const updatedRequests = await getServiceRequestsByUserId(currentUser.id);
      setRequests(updatedRequests);
      
      // Close modal and show confirmation
      setIsCheckoutModalOpen(false);
      alert('Thank you for your order! You can track your requests in the "My Requests" tab.');
      setActiveTab('requests');
    } catch (error) {
      console.error('Error completing checkout:', error);
      alert('Failed to complete checkout. Please try again.');
    }
  };

  // Handle refreshing cart
  const handleRefreshCart = async () => {
    if (!currentUser) return;
    try {
      const updatedCart = await getCartByUserId(currentUser.id);
      setCart(updatedCart || { items: [] });
    } catch (error) {
      console.error('Error refreshing cart:', error);
    }
  };

  // Generic marketplace request flow removed

  if (isLoading || !currentUser || !userDetails || isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppHeader currentPath="/user" />
        <div className="max-w-7xl mx-auto py-12 px-4 text-center">
          <div className="animate-pulse h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded mx-auto mb-4"></div>
          <div className="animate-pulse h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader currentPath="/user" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome, {userDetails.name}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  Find and book cosmetic services
                </p>
              </div>
              
              {cart.items.length > 0 && (
                <button
                  onClick={() => setActiveTab('cart')}
                  className="flex items-center mt-2 sm:mt-0 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 px-4 py-2 rounded-lg transition"
                >
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="ml-2 text-indigo-800 dark:text-indigo-200 font-medium">{cart.items.length} item{cart.items.length !== 1 ? 's' : ''} in cart</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="flex flex-wrap -mb-px">
              <button
                onClick={() => setActiveTab('services')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'services'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Services
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'requests'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                My Requests
              </button>
              <button
                onClick={() => setActiveTab('cart')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'cart'
                    ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Shopping Cart
                {cart.items.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                    {cart.items.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Tab content */}
          {activeTab === 'services' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Services</h2>
              {allServices.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No services available at the moment.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allServices.map((service) => {
                    const provider = providers.find(p => p.id === service.provider_id);
                    return (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        onAddToCart={() => handleAddToCart(service)}
                        showAddToCart={true}
                        showAction={false}
                        providerName={provider?.name}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                My Service Requests
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
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'cart' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                My Shopping Cart
              </h2>
              <CartDisplay 
                items={cart.items} 
                userId={currentUser.id}
                onUpdateCart={handleRefreshCart}
                onCheckout={handleCheckout}
              />
            </div>
          )}
        </div>
      </main>

      {/* Request Service Modal removed: clients must checkout from cart */}

      {/* Generic Service Request Modal removed to enforce provider-specific services only */}

      {/* Checkout Confirmation Modal */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        title="Complete Your Order"
      >
        <div className="p-4">
          <p className="mb-4">
            You're about to submit requests for all {cart.items.length} services in your cart. Would you like to proceed?
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsCheckoutModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleCompleteCheckout}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Confirm Order
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 