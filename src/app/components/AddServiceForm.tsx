"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { createNewService, getServiceCatalog, ServiceCatalogItem } from '@/data/store';

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
  const [catalog, setCatalog] = useState<ServiceCatalogItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  
  // Load service catalog from DB
  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoadingCatalog(true);
      const items = await getServiceCatalog();
      if (mounted) {
        setCatalog(items);
        setIsLoadingCatalog(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of catalog) set.add(item.category);
    return [ ...Array.from(set), 'Other' ];
  }, [catalog]);

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
    // Description and price will be derived from catalog
    
    try {
      const finalName = selectedOption !== 'Other (custom)' ? selectedOption : customName.trim();

      // Derive category from the option selection using catalog
      const match = catalog.find(it => it.name === selectedOption);
      const derivedCategory = match?.category || 'Other';

      const selected = catalog.find(it => it.name === finalName);
      const priceValue = selected?.default_price ?? 0;
      const descValue = selected?.description ?? '';
      const newService = await createNewService({
        name: finalName,
        description: descValue,
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

  const serviceOptionsByCategory: Record<string, string[]> = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const item of catalog) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item.name);
    }
    map['Other'] = ['Other (custom)'];
    return map;
  }, [catalog]);

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
      const selected = catalog.find(it => it.name === value);
      setDescription(selected?.description ?? '');
      setPrice(selected?.default_price != null ? String(selected.default_price) : '');
    } else if (value === 'Other (custom)') {
      setCategory('Other');
      setDescription('');
      setPrice('');
    } else {
      setCategory('');
      setCustomName('');
      setDescription('');
      setPrice('');
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
        
        {selectedOption && selectedOption !== 'Other (custom)' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <p className="text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-md p-3 whitespace-pre-line">
              {description || '—'}
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedOption && selectedOption !== 'Other (custom)' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Price (USD)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  value={price}
                  readOnly
                  className="w-full pl-7 px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-gray-300"
                />
              </div>
            </div>
          )}
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
            <option value="" disabled={isLoadingCatalog}>
              {isLoadingCatalog ? 'Loading options…' : 'Select a service/procedure'}
            </option>
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