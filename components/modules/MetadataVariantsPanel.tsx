'use client';

import React, { useState } from 'react';
import type { MetadataPackage, MetadataVariant } from '@/types';
import { XMarkIcon, CheckCircleIcon, DocumentTextIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

interface MetadataVariantsPanelProps {
  metadataPackage: MetadataPackage;
  selectedVariantId?: number;
  onSelectVariant: (variantId: number) => void;
  onClose: () => void;
}

export default function MetadataVariantsPanel({
  metadataPackage,
  selectedVariantId,
  onSelectVariant,
  onClose,
}: MetadataVariantsPanelProps) {
  const [expandedVariantId, setExpandedVariantId] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] rounded-2xl shadow-2xl w-[90vw] max-w-5xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
          <div>
            <h2 className="text-xl font-bold text-white">Metadata Variants</h2>
            <p className="text-sm text-gray-400 mt-1">
              {metadataPackage.brand_name} • {metadataPackage.num_variants} variants • {metadataPackage.language.toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Validation Status */}
        {metadataPackage.validation_warnings && metadataPackage.validation_warnings.length > 0 && (
          <div className="px-6 py-3 bg-yellow-500/10 border-b border-yellow-500/30">
            <p className="text-xs text-yellow-400">
              ⚠️ Some variants have validation warnings. Review before selecting.
            </p>
          </div>
        )}

        {/* Variants List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {metadataPackage.variants.map((variant) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              isSelected={selectedVariantId === variant.id}
              isExpanded={expandedVariantId === variant.id}
              onToggleExpand={() => setExpandedVariantId(expandedVariantId === variant.id ? null : variant.id)}
              onSelect={() => onSelectVariant(variant.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2A2A2A] flex justify-between items-center">
          <p className="text-xs text-gray-400">
            {selectedVariantId
              ? `Selected: Variant #${selectedVariantId}`
              : 'No variant selected yet'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white rounded-lg text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VARIANT CARD COMPONENT
// ============================================================

interface VariantCardProps {
  variant: MetadataVariant;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
}

function VariantCard({ variant, isSelected, isExpanded, onToggleExpand, onSelect }: VariantCardProps) {
  const validation = validateVariantLimits(variant);

  return (
    <div
      className={`bg-[#0A0A0A] rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-green-500 shadow-lg shadow-green-500/20'
          : 'border-[#2A2A2A] hover:border-[#3A3A3A]'
      }`}
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">
                Variant #{variant.id}: {variant.variant_name}
              </h3>
              {isSelected && (
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Target: {variant.target_persona} • {variant.tone}
            </p>
            {variant.emphasis && (
              <p className="text-xs text-purple-400 mt-1">
                Emphasis: {variant.emphasis}
              </p>
            )}
          </div>
        </div>

        {/* iOS App Store Preview */}
        <div className="bg-[#1A1A1A] rounded-lg p-3 mb-3 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 mb-2">
            <DevicePhoneMobileIcon className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-semibold text-blue-400">iOS App Store</h4>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Title</span>
                <CharCount current={variant.app_store.title.length} max={30} />
              </div>
              <p className="text-sm text-white font-medium">{variant.app_store.title}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Subtitle</span>
                <CharCount current={variant.app_store.subtitle.length} max={30} />
              </div>
              <p className="text-sm text-white">{variant.app_store.subtitle}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Keywords</span>
                <CharCount current={variant.app_store.keywords.length} max={100} />
              </div>
              <p className="text-xs text-gray-300 font-mono">{variant.app_store.keywords}</p>
            </div>

            {!isExpanded && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Promotional Text</span>
                  <CharCount current={variant.app_store.promotional_text.length} max={170} />
                </div>
                <p className="text-xs text-gray-300 line-clamp-2">{variant.app_store.promotional_text}</p>
              </div>
            )}
          </div>
        </div>

        {/* Google Play Preview */}
        <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 mb-2">
            <DocumentTextIcon className="w-4 h-4 text-green-400" />
            <h4 className="text-sm font-semibold text-green-400">Google Play</h4>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Title</span>
                <CharCount current={variant.google_play.title.length} max={30} />
              </div>
              <p className="text-sm text-white font-medium">{variant.google_play.title}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Short Description</span>
                <CharCount current={variant.google_play.short_description.length} max={80} />
              </div>
              <p className="text-xs text-gray-300">{variant.google_play.short_description}</p>
            </div>

            {!isExpanded && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Full Description</span>
                  <CharCount current={variant.google_play.full_description.length} max={4000} />
                </div>
                <p className="text-xs text-gray-300 line-clamp-3">{variant.google_play.full_description}</p>
              </div>
            )}

            {variant.google_play.tags && variant.google_play.tags.length > 0 && (
              <div>
                <span className="text-xs text-gray-400">Tags</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {variant.google_play.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="mt-3 space-y-3">
            {/* Full Promotional Text */}
            <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#2A2A2A]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-blue-400">iOS Promotional Text (Full)</span>
                <CharCount current={variant.app_store.promotional_text.length} max={170} />
              </div>
              <p className="text-xs text-gray-300">{variant.app_store.promotional_text}</p>
            </div>

            {/* Full iOS Description */}
            <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#2A2A2A]">
              <span className="text-xs font-semibold text-blue-400 block mb-2">iOS Description (Full)</span>
              <p className="text-xs text-gray-300 whitespace-pre-wrap">{variant.app_store.description}</p>
            </div>

            {/* Full Google Play Description */}
            <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#2A2A2A]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-green-400">Google Play Full Description</span>
                <CharCount current={variant.google_play.full_description.length} max={4000} />
              </div>
              <p className="text-xs text-gray-300 whitespace-pre-wrap">{variant.google_play.full_description}</p>
            </div>
          </div>
        )}

        {/* Validation Messages */}
        {!validation.allValid && (
          <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
            <p className="text-xs text-red-400 font-semibold">⚠️ Validation Issues:</p>
            <ul className="text-xs text-red-300 mt-1 space-y-1">
              {validation.errors.map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="px-4 py-3 bg-[#0F0F0F] border-t border-[#2A2A2A] rounded-b-xl flex justify-between items-center">
        <button
          onClick={onToggleExpand}
          className="px-3 py-1.5 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-gray-300 rounded text-xs transition-colors"
        >
          {isExpanded ? 'Show Less' : 'View Full'}
        </button>

        <button
          onClick={onSelect}
          disabled={isSelected}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            isSelected
              ? 'bg-green-500/20 text-green-400 cursor-default'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {isSelected ? '✓ Selected' : 'SELECT'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// CHARACTER COUNT COMPONENT
// ============================================================

interface CharCountProps {
  current: number;
  max: number;
}

function CharCount({ current, max }: CharCountProps) {
  const percentage = (current / max) * 100;
  const isOverLimit = current > max;
  const isNearLimit = percentage > 90 && !isOverLimit;

  return (
    <span className={`text-xs font-mono ${
      isOverLimit ? 'text-red-400 font-bold' : isNearLimit ? 'text-yellow-400' : 'text-gray-500'
    }`}>
      {current}/{max}
      {isOverLimit && ' ⚠️'}
    </span>
  );
}

// ============================================================
// VALIDATION HELPER
// ============================================================

function validateVariantLimits(variant: MetadataVariant): { allValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // iOS App Store
  if (variant.app_store.title.length > 30) {
    errors.push(`iOS title exceeds 30 chars (${variant.app_store.title.length})`);
  }
  if (variant.app_store.subtitle.length > 30) {
    errors.push(`iOS subtitle exceeds 30 chars (${variant.app_store.subtitle.length})`);
  }
  if (variant.app_store.promotional_text.length > 170) {
    errors.push(`iOS promotional text exceeds 170 chars (${variant.app_store.promotional_text.length})`);
  }
  if (variant.app_store.keywords.length > 100) {
    errors.push(`iOS keywords exceed 100 chars (${variant.app_store.keywords.length})`);
  }

  // Google Play
  if (variant.google_play.title.length > 30) {
    errors.push(`Google Play title exceeds 30 chars (${variant.google_play.title.length})`);
  }
  if (variant.google_play.short_description.length > 80) {
    errors.push(`Google Play short description exceeds 80 chars (${variant.google_play.short_description.length})`);
  }
  if (variant.google_play.full_description.length > 4000) {
    errors.push(`Google Play full description exceeds 4000 chars (${variant.google_play.full_description.length})`);
  }

  return {
    allValid: errors.length === 0,
    errors,
  };
}
