'use client';

import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SearchFormValues {
  query: string;
  city: string;
  operation_type: string;
}

export interface SearchBarProps {
  className?: string;
  defaultValues?: Partial<SearchFormValues>;
}

const cities = [
  'Malabo',
  'Bata',
  'Ebebiyin',
  'Aconibe',
  'Anisoc',
  'Luba',
  'Evinayong',
  'Mongomo',
  'Riaba',
];

const operationTypes = [
  { value: '', label: 'Todos' },
  { value: 'venta', label: 'Venta' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'alquiler_vacacional', label: 'Vacacional' },
];

export default function SearchBar({ className, defaultValues }: SearchBarProps) {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const { register, handleSubmit } = useForm<SearchFormValues>({
    defaultValues: {
      query: '',
      city: '',
      operation_type: '',
      ...defaultValues,
    },
  });

  const onSubmit = (data: SearchFormValues) => {
    const params = new URLSearchParams();
    if (data.query) params.set('q', data.query);
    if (data.city) params.set('city', data.city);
    if (data.operation_type) params.set('operation_type', data.operation_type);

    router.push(`/${locale}/properties?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn(
        'flex flex-col gap-3 rounded-lg bg-white p-4 shadow-md sm:flex-row sm:items-end',
        className
      )}
    >
      {/* Text search */}
      <div className="flex-1">
        <label
          htmlFor="search-query"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {locale === 'es' ? 'Buscar' : 'Rechercher'}
        </label>
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="search-query"
            type="text"
            placeholder={
              locale === 'es'
                ? 'Buscar por titulo, direccion...'
                : 'Rechercher par titre, adresse...'
            }
            className="block w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register('query')}
          />
        </div>
      </div>

      {/* City select */}
      <div className="w-full sm:w-40">
        <label
          htmlFor="search-city"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {locale === 'es' ? 'Ciudad' : 'Ville'}
        </label>
        <select
          id="search-city"
          className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...register('city')}
        >
          <option value="">
            {locale === 'es' ? 'Todas' : 'Toutes'}
          </option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* Operation type select */}
      <div className="w-full sm:w-40">
        <label
          htmlFor="search-operation"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {locale === 'es' ? 'Tipo' : 'Type'}
        </label>
        <select
          id="search-operation"
          className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...register('operation_type')}
        >
          {operationTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Search button */}
      <Button type="submit" size="md" className="w-full sm:w-auto">
        <MagnifyingGlassIcon className="mr-1.5 h-4 w-4" />
        {locale === 'es' ? 'Buscar' : 'Rechercher'}
      </Button>
    </form>
  );
}
