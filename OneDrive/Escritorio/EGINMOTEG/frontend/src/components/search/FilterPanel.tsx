'use client';

import { useState } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const NON_PROPERTY_SLUGS = ['negocio', 'agencia-inmobiliaria', 'hotel'];

export interface FilterValues {
  price_min: string;
  price_max: string;
  category: string;
  bedrooms: string;
  bathrooms: string;
  area_min: string;
  area_max: string;
  currency: string;
}

export interface FilterPanelProps {
  categories?: { id: number; name: string; slug: string }[];
  initialValues?: Partial<FilterValues>;
  onApply: (filters: FilterValues) => void;
  onClear: () => void;
  className?: string;
}

const defaultFilters: FilterValues = {
  price_min: '',
  price_max: '',
  category: '',
  bedrooms: '',
  bathrooms: '',
  area_min: '',
  area_max: '',
  currency: 'XAF',
};

export default function FilterPanel({
  categories = [],
  initialValues,
  onApply,
  onClear,
  className,
}: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterValues>({
    ...defaultFilters,
    ...initialValues,
  });

  const updateFilter = (key: keyof FilterValues, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleClear = () => {
    setFilters({ ...defaultFilters });
    onClear();
  };

  const isNonPropertyCategory = NON_PROPERTY_SLUGS.includes(filters.category);

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-5',
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <FunnelIcon className="h-4 w-4" />
          Filtros
        </h3>
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <XMarkIcon className="h-3 w-3" />
          Limpiar
        </button>
      </div>

      <div className="space-y-4">
        {/* Currency */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Moneda
          </label>
          <select
            value={filters.currency}
            onChange={(e) => updateFilter('currency', e.target.value)}
            className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="XAF">XAF (Franco CFA)</option>
            <option value="EUR">EUR (Euro)</option>
            <option value="USD">USD (Dolar)</option>
          </select>
        </div>

        {/* Price range */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Rango de precio
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.price_min}
              onChange={(e) =>
                updateFilter('price_min', (e.target as HTMLInputElement).value)
              }
            />
            <span className="text-gray-400">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={filters.price_max}
              onChange={(e) =>
                updateFilter('price_max', (e.target as HTMLInputElement).value)
              }
            />
          </div>
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Categoria
            </label>
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Bedrooms - hidden for non-property categories */}
        {!isNonPropertyCategory && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Habitaciones
            </label>
            <select
              value={filters.bedrooms}
              onChange={(e) => updateFilter('bedrooms', e.target.value)}
              className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Cualquiera</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>
          </div>
        )}

        {/* Bathrooms - hidden for non-property categories */}
        {!isNonPropertyCategory && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Banos
            </label>
            <select
              value={filters.bathrooms}
              onChange={(e) => updateFilter('bathrooms', e.target.value)}
              className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Cualquiera</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>
        )}

        {/* Area range */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Superficie (m&sup2;)
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.area_min}
              onChange={(e) =>
                updateFilter('area_min', (e.target as HTMLInputElement).value)
              }
            />
            <span className="text-gray-400">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={filters.area_max}
              onChange={(e) =>
                updateFilter('area_max', (e.target as HTMLInputElement).value)
              }
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleApply} size="sm" className="flex-1">
            Aplicar filtros
          </Button>
          <Button onClick={handleClear} variant="outline" size="sm" className="flex-1">
            Limpiar
          </Button>
        </div>
      </div>
    </div>
  );
}
