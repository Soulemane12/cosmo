"use client";

import React from 'react';
import { 
  CartItem, 
  getServiceById, 
  getProviderById, 
  removeFromCart,
  updateCartItemQuantity 
} from '@/data/store';

interface CartDisplayProps {
  items: CartItem[];
  userId: string;
  onUpdateCart: () => void;
  onCheckout: () => void;
}

export default function CartDisplay({ items, userId, onUpdateCart, onCheckout }: CartDisplayProps) {
  const calculateTotal = (): number => {
    return items.reduce((total, item) => {
      const service = getServiceById(item.serviceId);
      return total + (service ? service.price * item.quantity : 0);
    }, 0);
  };

  const handleRemoveItem = (itemId: string) => {
    removeFromCart(userId, itemId);
    onUpdateCart();
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    updateCartItemQuantity(userId, itemId, quantity);
    onUpdateCart();
  };

  if (items.length === 0) {
    return (
      <div className="bg-gray-800 shadow rounded-lg p-6 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white">Your cart is empty</h3>
        <p className="mt-2 text-gray-400">Browse services and add them to your cart</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-medium text-white mb-4">Your Cart</h3>
        <div className="divide-y divide-gray-700">
          {items.map((item) => {
            const service = getServiceById(item.serviceId);
            const provider = getProviderById(item.providerId);
            
            if (!service || !provider) return null;
            
            return (
              <div key={item.id} className="py-4 flex justify-between">
                <div className="flex-1">
                  <h4 className="text-base font-medium text-white">{service.name}</h4>
                  <p className="text-sm text-gray-400">Provider: {provider.name}</p>
                  <p className="text-sm text-gray-400">${service.price} per session</p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-600 rounded-md">
                    <button 
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="px-2 py-1 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="px-2 py-1 text-white">{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="px-2 py-1 text-gray-300 hover:bg-gray-700"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="text-right min-w-[80px]">
                    <p className="font-medium text-white">${(service.price * item.quantity).toLocaleString()}</p>
                  </div>
                  
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="bg-gray-900 px-6 py-4">
        <div className="flex justify-between mb-4">
          <span className="font-medium text-white">Total</span>
          <span className="font-medium text-white">${calculateTotal().toLocaleString()}</span>
        </div>
        
        <button
          onClick={onCheckout}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
} 