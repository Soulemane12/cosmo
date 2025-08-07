"use client";

import React, { useMemo, useState } from 'react';
import { createNewService } from '@/data/store';

interface AddServiceFormProps {
  providerId: string;
  onServiceAdded: () => void;
  onCancel: () => void;
}

export default function AddServiceForm({ providerId, onServiceAdded, onCancel }: AddServiceFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [error, setError] = useState('');
  
  const categoryOptions = [
    "Non-surgical",
    "Surgical",
    "Injectables",
    "Skin Treatments",
    "Hair Restoration",
    "Body Contouring",
    "Other"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!name || !description || !price || !category) {
      setError('Please fill in all fields');
      return;
    }
    if (category === 'Surgical' && !selectedProcedure) {
      setError('Please select a surgical procedure');
      return;
    }
    
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      setError('Please enter a valid price');
      return;
    }
    
    try {
      const newService = await createNewService({
        name,
        description,
        price: priceValue,
        category,
        provider_id: providerId
      }, providerId);
      
      if (newService) {
        onServiceAdded();
      } else {
        setError('Failed to add service. Please try again.');
      }
    } catch (err) {
      setError('Failed to add service. Please try again.');
    }
  };

  const surgicalProcedures = useMemo(
    () => [
      // Facial procedures
      'Rhinoplasty (Nose Surgery)',
      'Septoplasty (Deviated Septum Repair)',
      'Blepharoplasty (Eyelid Surgery)',
      'Brow Lift (Forehead Lift)',
      'Facelift (Rhytidectomy)',
      'Neck Lift (Platysmaplasty)',
      'Otoplasty (Ear Reshaping)',
      'Chin Augmentation (Genioplasty)',
      'Cheek Augmentation (Malar Implant)',
      'Lip Lift',
      'Facial Fat Transfer',
      'Facial Feminization Surgery (FFS)',

      // Breast procedures
      'Breast Augmentation (Implants/Fat Transfer)',
      'Breast Lift (Mastopexy)',
      'Breast Reduction',
      'Breast Implant Removal/Exchange',
      'Breast Revision',
      'Gynecomastia Surgery (Male Breast Reduction)',

      // Body contouring
      'Liposuction',
      'High-Definition Liposuction (HD Lipo)',
      'Tummy Tuck (Abdominoplasty)',
      'Mini Tummy Tuck',
      '360 Body Lift',
      'Lower Body Lift',
      'Arm Lift (Brachioplasty)',
      'Thigh Lift',
      'Brazilian Butt Lift (BBL)',
      'Buttock Implants',
      'Mommy Makeover',

      // Intimate procedures
      'Labiaplasty',
      'Vaginoplasty',
      'Monsplasty',

      // Reconstructive & other
      'Scar Revision Surgery',
      'Mohs Reconstruction',
      'Skin Cancer Reconstruction',
      'Hand Surgery',
      'Implant-Based Reconstruction',

      // Gender-affirming
      'Top Surgery (FTM/FTN Chest Masculinization)',
      'Breast Augmentation for Transfeminine Patients',

      // Nasal airways & function
      'Functional Rhinoplasty',

      // Additive common requests
      'Earlobe Repair',
      'Buccal Fat Removal',
      'Submental Liposuction (Neck Lipo)',

      'Other (custom)'
    ],
    []
  );

  const handleProcedureChange = (value: string) => {
    setSelectedProcedure(value);
    if (value && value !== 'Other (custom)') {
      setName(value);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4 text-white">Add New Service</h2>
      
      {error && (
        <div className="bg-red-900 border border-red-800 text-red-200 px-4 py-3 rounded mb-4 relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
            Service Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
            placeholder="e.g., Botox, Rhinoplasty"
            required
          />
          {category === 'Surgical' && (
            <p className="mt-1 text-xs text-gray-400">
              Tip: Selecting a procedure below will auto-fill this name.
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
            rows={3}
            placeholder="Brief description of the service and what it involves"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">
              Price (USD)
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 sm:text-sm">$</span>
              </div>
              <input
                id="price"
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full pl-7 px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => {
                const value = e.target.value;
                setCategory(value);
                if (value !== 'Surgical') {
                  setSelectedProcedure('');
                }
              }}
              className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
              required
            >
              <option value="">Select a category</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {category === 'Surgical' && (
          <div>
            <label htmlFor="procedure" className="block text-sm font-medium text-gray-300 mb-1">
              Surgical Procedure
            </label>
            <select
              id="procedure"
              value={selectedProcedure}
              onChange={(e) => handleProcedureChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
              required
            >
              <option value="">Select a surgical procedure</option>
              {surgicalProcedures.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Service
          </button>
        </div>
      </form>
    </div>
  );
} 