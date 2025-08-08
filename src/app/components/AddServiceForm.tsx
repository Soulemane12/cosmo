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
  const [selectedOption, setSelectedOption] = useState('');
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');
  
  const categoryOptions = [
    'Surgical',
    'Injectables',
    'Non-surgical',
    'Skin Treatments',
    'Hair Restoration',
    'Body Contouring',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!selectedOption) {
      setError('Please select a service/procedure');
      return;
    }
    if (selectedOption === 'Other (custom)' && !customName) {
      setError('Please enter a custom service name');
      return;
    }
    if (!description || !price) {
      setError('Please fill in description and price');
      return;
    }
    
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      setError('Please enter a valid price');
      return;
    }
    
    try {
      const finalName = selectedOption !== 'Other (custom)' ? selectedOption : customName.trim();

      // Derive category from the option selection
      const derivedCategory = Object.keys(serviceOptionsByCategory).find((cat) =>
        (serviceOptionsByCategory[cat] || []).includes(selectedOption)
      ) || 'Other';

      const newService = await createNewService({
        name: finalName,
        description,
        price: priceValue,
        category: derivedCategory,
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

  const injectableOptions = useMemo(
    () => [
      'Botox (OnabotulinumtoxinA)',
      'Dysport (AbobotulinumtoxinA)',
      'Xeomin (IncobotulinumtoxinA)',
      'Daxxify (DaxibotulinumtoxinA)',
      'Juvederm (Hyaluronic Acid Filler)',
      'Restylane (Hyaluronic Acid Filler)',
      'Sculptra (Poly-L-Lactic Acid)',
      'Radiesse (Calcium Hydroxylapatite)',
      'Kybella (Deoxycholic Acid)',
      'PRF/PRP Undereye',
      'Other (custom)'
    ],
    []
  );

  const nonSurgicalOptions = useMemo(
    () => [
      'Laser Hair Removal',
      'Chemical Peel',
      'Microdermabrasion',
      'Microneedling',
      'RF Microneedling',
      'IPL Photofacial',
      'HydraFacial',
      'Dermaplaning',
      'RF Skin Tightening',
      'LED Light Therapy',
      'Other (custom)'
    ],
    []
  );

  const skinTreatmentOptions = useMemo(
    () => [
      'Acne Treatment Program',
      'Pigmentation Treatment Program',
      'Rosacea Management',
      'Fractional CO2 Laser Resurfacing',
      'Erbium Laser Resurfacing',
      'Photodynamic Therapy (PDT)',
      'Scar Treatment Package',
      'Other (custom)'
    ],
    []
  );

  const hairRestorationOptions = useMemo(
    () => [
      'PRP/PRF Scalp',
      'Low-Level Laser Therapy (LLLT)',
      'Medical Therapy Program',
      'FUE Hair Transplant Evaluation',
      'Other (custom)'
    ],
    []
  );

  const bodyContouringOptions = useMemo(
    () => [
      'CoolSculpting (Cryolipolysis)',
      'Emsculpt (HIFEM)',
      'truSculpt',
      'SculpSure',
      'Evolve Trim/Tite/Tone',
      'Radiofrequency Body Tightening',
      'Other (custom)'
    ],
    []
  );

  const serviceOptionsByCategory: Record<string, string[]> = useMemo(
    () => ({
      'Surgical': surgicalProcedures,
      'Injectables': injectableOptions,
      'Non-surgical': nonSurgicalOptions,
      'Skin Treatments': skinTreatmentOptions,
      'Hair Restoration': hairRestorationOptions,
      'Body Contouring': bodyContouringOptions,
      'Other': ['Other (custom)']
    }),
    [
      surgicalProcedures,
      injectableOptions,
      nonSurgicalOptions,
      skinTreatmentOptions,
      hairRestorationOptions,
      bodyContouringOptions
    ]
  );

  const handleOptionChange = (value: string) => {
    setSelectedOption(value);
    if (value && value !== 'Other (custom)') {
      setName(value);
      setCustomName('');
      // derive category
      const derivedCategory = Object.keys(serviceOptionsByCategory).find((cat) =>
        (serviceOptionsByCategory[cat] || []).includes(value)
      ) || '';
      setCategory(derivedCategory);
    } else if (value === 'Other (custom)') {
      setCategory('Other');
    } else {
      setCategory('');
      setCustomName('');
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
        </div>

        <div>
          <label htmlFor="serviceOption" className="block text-sm font-medium text-gray-300 mb-1">
            Service / Procedure
          </label>
          <select
            id="serviceOption"
            value={selectedOption}
            onChange={(e) => handleOptionChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
            required
          >
            <option value="">Select a service/procedure</option>
            {categoryOptions.map((cat) => (
              <optgroup key={cat} label={cat}>
                {(serviceOptionsByCategory[cat] || []).map((opt) => (
                  <option key={`${cat}::${opt}`} value={opt}>
                    {opt}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {selectedOption === 'Other (custom)' && (
            <div className="mt-3">
              <label htmlFor="customName" className="block text-sm font-medium text-gray-300 mb-1">
                Custom Service Name
              </label>
              <input
                id="customName"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
                placeholder="Enter custom service name"
                required
              />
            </div>
          )}
          <p className="mt-1 text-xs text-gray-400">
            This will auto-fill the service name and category based on your selection.
          </p>
        </div>
        
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