'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CameraIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useImageAnalysis, useRequestImageAnalysis } from '@/hooks/useAI';
import type { PropertyImage } from '@/types/property';

interface ImageAnalysisPanelProps {
  images: PropertyImage[];
}

const roomTypeLabels: Record<string, Record<string, string>> = {
  es: {
    salon: 'Salón',
    dormitorio: 'Dormitorio',
    cocina: 'Cocina',
    baño: 'Baño',
    exterior: 'Exterior',
    terraza: 'Terraza',
    jardin: 'Jardín',
    garaje: 'Garaje',
    oficina: 'Oficina',
    otro: 'Otro',
  },
  fr: {
    salon: 'Salon',
    dormitorio: 'Chambre',
    cocina: 'Cuisine',
    baño: 'Salle de bain',
    exterior: 'Extérieur',
    terraza: 'Terrasse',
    jardin: 'Jardin',
    garaje: 'Garage',
    oficina: 'Bureau',
    otro: 'Autre',
  },
};

export default function ImageAnalysisPanel({ images }: ImageAnalysisPanelProps) {
  const t = useTranslations('ai');
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [analysisId, setAnalysisId] = useState<string | undefined>();

  const requestMutation = useRequestImageAnalysis();
  const { data: analysis, isLoading: analysisLoading } = useImageAnalysis(analysisId);

  if (!images || images.length === 0) return null;

  const handleAnalyze = (imageId: number) => {
    setSelectedImageId(imageId);
    requestMutation.mutate(imageId, {
      onSuccess: (data) => {
        setAnalysisId(data.id);
      },
    });
  };

  const qualityColor = (score: number | null) => {
    if (!score) return 'text-gray-500';
    if (score >= 7) return 'text-green-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card
      header={
        <div className="flex items-center gap-2">
          <CameraIcon className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">{t('image_analysis_title')}</h3>
        </div>
      }
      padding="md"
    >
      {/* Image selection */}
      <p className="text-xs text-gray-500">{t('select_image_to_analyze')}</p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
        {images.map((img) => (
          <button
            key={img.id}
            type="button"
            onClick={() => handleAnalyze(img.id)}
            disabled={requestMutation.isPending && selectedImageId === img.id}
            className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
              selectedImageId === img.id
                ? 'border-indigo-600 ring-2 ring-indigo-200'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <img
              src={img.thumbnail || img.image}
              alt={img.caption || `Imagen ${img.order}`}
              className="h-full w-full object-cover"
            />
            {requestMutation.isPending && selectedImageId === img.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Spinner size="sm" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Analysis result */}
      {analysis && (
        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
          {/* Status */}
          {(analysis.status === 'pendiente' || analysis.status === 'procesando') && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Spinner size="sm" />
              <span>{t('analyzing')}</span>
            </div>
          )}

          {analysis.status === 'error' && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>{t('analysis_error')}</span>
            </div>
          )}

          {analysis.status === 'completado' && (
            <div className="space-y-3">
              {/* Room type and quality */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {roomTypeLabels['es'][analysis.room_type] || analysis.room_type}
                  </span>
                </div>
                {analysis.quality_score !== null && (
                  <div className="flex items-center gap-1">
                    <SparklesIcon className={`h-4 w-4 ${qualityColor(analysis.quality_score)}`} />
                    <span className={`text-sm font-bold ${qualityColor(analysis.quality_score)}`}>
                      {analysis.quality_score.toFixed(1)}/10
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {analysis.description && (
                <p className="text-sm text-gray-700">{analysis.description}</p>
              )}

              {/* Features */}
              {analysis.features && analysis.features.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500">{t('detected_features')}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {analysis.features.map((feature, i) => (
                      <span
                        key={i}
                        className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Initial state - no analysis requested */}
      {!analysis && !analysisLoading && !requestMutation.isPending && (
        <p className="mt-2 text-center text-xs text-gray-400">
          {t('click_image_hint')}
        </p>
      )}
    </Card>
  );
}
