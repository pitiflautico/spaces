'use client';

import React from 'react';
import type { Module, LogoVariantOutputs } from '@/types';
import { PhotoIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface LogoVariantModuleProps {
  module: Module;
}

/**
 * LogoVariantModule - Individual logo variant node
 *
 * This component displays a single logo variant that was generated
 * by the Logo Generator module. Each variant appears as its own node
 * on the canvas with:
 * - Visual preview of the logo
 * - Metadata (style, colors, prompt)
 * - Output port with logo URL + flow context data
 */
export default function LogoVariantModule({ module }: LogoVariantModuleProps) {
  const outputs = module.outputs as LogoVariantOutputs;
  const logoData = outputs?.logoData;

  if (!logoData) {
    return (
      <div className="space-y-3">
        <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-300">No logo data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4 text-pink-400" />
          <span className="text-xs text-pink-300 font-medium">Generated Logo Variant</span>
        </div>
        <PhotoIcon className="w-4 h-4 text-pink-400" />
      </div>

      {/* Logo Preview */}
      <div className="relative group">
        <div className="aspect-square w-full bg-[#0A0A0A] border-2 border-[#3A3A3A] rounded-lg overflow-hidden">
          <img
            src={logoData.image_url}
            alt={`Logo for ${logoData.brand_name}`}
            className="w-full h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://placehold.co/512x512/1A1A1A/888888/png?text=Logo+Error`;
            }}
          />
        </div>

        {/* Hover overlay with full image */}
        <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center p-2">
          <img
            src={logoData.image_url}
            alt={`Logo for ${logoData.brand_name}`}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>

      {/* Brand Name */}
      <div className="px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg">
        <p className="text-xs text-gray-400 mb-1">Brand Name</p>
        <p className="text-sm text-white font-semibold">{logoData.brand_name}</p>
      </div>

      {/* Style Summary */}
      <div className="px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg">
        <p className="text-xs text-gray-400 mb-1">Style</p>
        <p className="text-xs text-gray-200">{logoData.style_summary}</p>
      </div>

      {/* Colors Used */}
      {logoData.colors_used && logoData.colors_used.length > 0 && (
        <div className="px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg">
          <p className="text-xs text-gray-400 mb-2">Colors</p>
          <div className="flex gap-2 flex-wrap">
            {logoData.colors_used.map((color, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded border border-[#3A3A3A]"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-300 font-mono">{color}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Prompt (Collapsible) */}
      <details className="px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg">
        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
          AI Prompt Used
        </summary>
        <pre className="text-xs text-gray-500 mt-2 whitespace-pre-wrap font-mono">
          {logoData.ai_prompt_used}
        </pre>
      </details>

      {/* Output Info */}
      <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <span className="text-xs text-blue-300 font-medium">Ready to Connect</span>
        </div>
        <p className="text-xs text-blue-200/70">
          This logo variant can be connected to downstream modules. Output includes image URL and flow context data.
        </p>
      </div>
    </div>
  );
}
