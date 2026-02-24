'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  PhotoIcon,
  XMarkIcon,
  PlusIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useProperties';
import api from '@/lib/api';
import type { FieldSchemaEntry } from '@/types/property';

const NON_PROPERTY_SLUGS = ['negocio', 'agencia-inmobiliaria', 'hotel'];

// ----- Zod schema -----
const propertySchema = z.object({
  // Basic info
  title: z.string().min(5, 'El titulo debe tener al menos 5 caracteres'),
  description: z.string().min(20, 'La descripcion debe tener al menos 20 caracteres'),
  category: z.string().min(1, 'Selecciona una categoria'),

  // Location
  city: z.string().min(1, 'Selecciona una ciudad'),
  address: z.string().min(3, 'La direccion es obligatoria'),
  neighborhood: z.string().optional(),

  // Characteristics
  area_m2: z.coerce.number().min(0).optional(),
  bedrooms: z.coerce.number().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  floors: z.coerce.number().min(0).optional(),
  year_built: z.coerce.number().min(1900).max(2030).optional(),

  // Listing info
  operation_type: z.enum(['venta', 'alquiler', 'alquiler_vacacional'], {
    required_error: 'Selecciona el tipo de operacion',
  }),
  price: z.coerce.number().min(1, 'El precio debe ser mayor a 0'),
  currency: z.enum(['XAF', 'EUR', 'USD']),
  deposit_amount: z.coerce.number().min(0).optional(),
  is_featured: z.boolean().optional(),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

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

export default function NewPropertyPage() {
  const t = useTranslations('properties');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extraAttributes, setExtraAttributes] = useState<Record<string, any>>({});

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login`);
    }
  }, [authLoading, isAuthenticated, locale, router]);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      city: '',
      address: '',
      neighborhood: '',
      area_m2: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      floors: undefined,
      year_built: undefined,
      operation_type: 'venta',
      price: undefined,
      currency: 'XAF',
      deposit_amount: undefined,
      is_featured: false,
    },
  });

  const selectedCategorySlug = watch('category');

  const selectedCategory = useMemo(
    () => categories?.find((c) => c.slug === selectedCategorySlug),
    [categories, selectedCategorySlug]
  );

  const fieldsSchema: Record<string, FieldSchemaEntry> = useMemo(
    () => (selectedCategory?.fields_schema as Record<string, FieldSchemaEntry>) || {},
    [selectedCategory]
  );

  const isTraditionalProperty = !NON_PROPERTY_SLUGS.includes(selectedCategorySlug || '');

  // Reset extra attributes when category changes
  useEffect(() => {
    setExtraAttributes({});
  }, [selectedCategorySlug]);

  const updateExtraAttribute = (key: string, value: any) => {
    setExtraAttributes((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMultiselect = (key: string, option: string) => {
    setExtraAttributes((prev) => {
      const current: string[] = prev[key] || [];
      const next = current.includes(option)
        ? current.filter((v: string) => v !== option)
        : [...current, option];
      return { ...prev, [key]: next };
    });
  };

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      // Limit to 10 images total
      const remaining = 10 - imageFiles.length;
      const newFiles = files.slice(0, remaining);

      setImageFiles((prev) => [...prev, ...newFiles]);

      // Generate previews
      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });

      // Reset input
      e.target.value = '';
    },
    [imageFiles.length]
  );

  const handleRemoveImage = useCallback((index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const onSubmit = async (data: PropertyFormValues) => {
    setIsSubmitting(true);
    try {
      // Step 1: Create the property
      const propertyPayload: Record<string, any> = {
        title: data.title,
        description: data.description,
        category_slug: data.category,
        city: data.city,
        address: data.address,
        neighborhood: data.neighborhood || '',
        area_m2: data.area_m2 ?? null,
        bedrooms: data.bedrooms ?? null,
        bathrooms: data.bathrooms ?? null,
        floors: data.floors ?? null,
        year_built: data.year_built ?? null,
        extra_attributes: extraAttributes,
      };

      const { data: property } = await api.post('/properties/', propertyPayload);

      // Step 2: Upload images if any
      if (imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const formData = new FormData();
          formData.append('image', imageFiles[i]);
          formData.append('order', String(i));
          formData.append('is_primary', String(i === 0));
          await api.post(`/properties/${property.id}/images/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }

      // Step 3: Create the listing
      const listingPayload: Record<string, any> = {
        property: property.id,
        operation_type: data.operation_type,
        price: data.price,
        currency: data.currency,
        deposit_amount: data.deposit_amount ?? null,
        deposit_currency: data.deposit_amount ? data.currency : null,
        is_featured: data.is_featured ?? false,
      };

      const { data: listing } = await api.post('/listings/', listingPayload);

      toast.success('Propiedad creada exitosamente');
      router.push(`/${locale}/properties/${listing.id}`);
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        'Error al crear la propiedad';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking auth
  if (authLoading || categoriesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  // Don't render if not authenticated (redirect is happening)
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {tCommon('back')}
          </button>
          <h1 className="text-xl font-bold text-gray-900">{t('add_property')}</h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8"
      >
        {/* Section: Basic info */}
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Informacion basica
          </h2>
          <div className="mt-4 space-y-4">
            <Input
              label="Titulo *"
              placeholder="Ej: Apartamento moderno en Malabo"
              error={errors.title?.message}
              {...register('title')}
            />

            <Input
              multiline
              label="Descripcion *"
              placeholder="Describe tu propiedad en detalle..."
              error={errors.description?.message}
              {...register('description')}
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Categoria *
              </label>
              <select
                className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('category')}
              >
                <option value="">Seleccionar categoria</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.category.message}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Section: Location */}
        <section className="mt-6 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('location')}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Ciudad *
              </label>
              <select
                className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('city')}
              >
                <option value="">Seleccionar ciudad</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.city.message}
                </p>
              )}
            </div>

            <Input
              label="Direccion *"
              placeholder="Ej: Calle de Argelia, 15"
              error={errors.address?.message}
              {...register('address')}
            />

            <Input
              label="Barrio"
              placeholder="Ej: Caracolas"
              error={errors.neighborhood?.message}
              {...register('neighborhood')}
            />
          </div>
        </section>

        {/* Section: Characteristics (only for traditional properties) */}
        {isTraditionalProperty && (
          <section className="mt-6 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Caracteristicas
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              <Input
                type="number"
                label="Superficie (m2)"
                placeholder="0"
                error={errors.area_m2?.message}
                {...register('area_m2')}
              />

              <Input
                type="number"
                label={t('rooms')}
                placeholder="0"
                error={errors.bedrooms?.message}
                {...register('bedrooms')}
              />

              <Input
                type="number"
                label={t('bathrooms')}
                placeholder="0"
                error={errors.bathrooms?.message}
                {...register('bathrooms')}
              />

              <Input
                type="number"
                label="Pisos"
                placeholder="0"
                error={errors.floors?.message}
                {...register('floors')}
              />

              <Input
                type="number"
                label="Ano construido"
                placeholder="2020"
                error={errors.year_built?.message}
                {...register('year_built')}
              />
            </div>
          </section>
        )}

        {/* Section: Dynamic fields from category fields_schema */}
        {Object.keys(fieldsSchema).length > 0 && (
          <section className="mt-6 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Detalles de {selectedCategory?.name}
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.entries(fieldsSchema).map(([key, field]) => {
                if (field.type === 'select') {
                  return (
                    <div key={key}>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        {field.label} {field.required && '*'}
                      </label>
                      <select
                        value={extraAttributes[key] || ''}
                        onChange={(e) => updateExtraAttribute(key, e.target.value)}
                        className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar...</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (field.type === 'multiselect') {
                  const selected: string[] = extraAttributes[key] || [];
                  return (
                    <div key={key} className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        {field.label} {field.required && '*'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {field.options?.map((opt) => {
                          const isActive = selected.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => toggleMultiselect(key, opt)}
                              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                                isActive
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                              }`}
                            >
                              {opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // text, number, email, url
                return (
                  <div key={key}>
                    <Input
                      type={field.type === 'url' ? 'text' : field.type}
                      label={`${field.label}${field.required ? ' *' : ''}`}
                      placeholder={field.label}
                      value={extraAttributes[key] || ''}
                      onChange={(e) =>
                        updateExtraAttribute(key, (e.target as HTMLInputElement).value)
                      }
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section: Listing info */}
        <section className="mt-6 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Informacion del anuncio
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tipo de operacion *
              </label>
              <select
                className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('operation_type')}
              >
                <option value="venta">Venta</option>
                <option value="alquiler">Alquiler</option>
                <option value="alquiler_vacacional">Alquiler vacacional</option>
              </select>
              {errors.operation_type && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.operation_type.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Moneda *
              </label>
              <select
                className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('currency')}
              >
                <option value="XAF">XAF (Franco CFA)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="USD">USD (Dolar)</option>
              </select>
            </div>

            <Input
              type="number"
              label="Precio *"
              placeholder="0"
              error={errors.price?.message}
              {...register('price')}
            />

            <Input
              type="number"
              label="Deposito"
              placeholder="0"
              helperText="Dejar en 0 si no aplica"
              error={errors.deposit_amount?.message}
              {...register('deposit_amount')}
            />

            {/* Featured toggle */}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    {...register('is_featured')}
                  />
                  <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 transition-colors"></div>
                  <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5"></div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Destacar anuncio
                  </span>
                  <p className="text-xs text-gray-500">
                    Los anuncios destacados aparecen primero en los resultados de busqueda
                  </p>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* Section: Images */}
        <section className="mt-6 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('images')}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Sube hasta 10 imagenes. La primera sera la imagen principal.
          </p>

          <div className="mt-4">
            {/* Image previews grid */}
            {imagePreviews.length > 0 && (
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {imagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200"
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {index === 0 && (
                      <span className="absolute left-1 top-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        Principal
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute right-1 top-1 rounded-full bg-red-500 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            {imageFiles.length < 10 && (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 transition-colors hover:border-blue-400 hover:bg-blue-50">
                <PhotoIcon className="h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-600">
                  {t('upload_images')}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  PNG, JPG, WEBP hasta 5MB cada una
                </p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </label>
            )}
          </div>
        </section>

        {/* Submit */}
        <div className="mt-8 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            type="submit"
            size="lg"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            {t('add_property')}
          </Button>
        </div>
      </form>
    </div>
  );
}
