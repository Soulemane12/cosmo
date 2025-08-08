"use client";

import React from 'react';
import { Service } from '@/data/store';

interface ServiceCardProps {
  service: Service;
  onSelect?: () => void;
  onAddToCart?: () => void;
  actionLabel?: string;
  showAction?: boolean;
  showAddToCart?: boolean;
  isProviderView?: boolean;
  providerName?: string;
}

export default function ServiceCard({ 
  service, 
  onSelect, 
  onAddToCart,
  actionLabel = "Request Service", 
  showAction = true,
  showAddToCart = false,
  isProviderView = false,
  providerName
}: ServiceCardProps) {
  return (
    <div className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isProviderView ? 'bg-gray-800 border-green-800' : 'bg-gray-800 border-blue-800'}`}>
      <div className="p-5">
        <div className="flex justify-between">
          <h3 className="font-semibold text-lg mb-2 text-white">{service.name}</h3>
          {isProviderView && (
            <span className="inline-flex items-center rounded-md bg-green-900 px-2 py-1 text-xs font-medium text-green-200">
              Your Service
            </span>
          )}
        </div>
        <p className="text-sm text-gray-300 mb-2">{service.description}</p>
        {providerName && (
          <p className="text-xs text-gray-400 mb-2">Offered by {providerName}</p>
        )}
        <div className="flex justify-between items-center">
          <p className="font-medium text-gray-100">
            ${service.price.toLocaleString()}
          </p>
          <span className="inline-block px-2 py-1 text-xs rounded bg-gray-700 text-gray-200">
            {service.category}
          </span>
        </div>
        
        <div className={showAction && showAddToCart ? "grid grid-cols-2 gap-2 mt-4" : "mt-4"}>
          {showAction && (
            <button
              onClick={onSelect}
              className={`${showAddToCart ? 'w-full' : 'w-full'} py-2 px-4 ${isProviderView ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md transition font-medium text-sm`}
            >
              {isProviderView ? "Edit Service" : actionLabel}
            </button>
          )}
          
          {showAddToCart && (
            <button
              onClick={onAddToCart}
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition font-medium text-sm flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 