'use client';

import React from 'react';
import type { Module, AppIconVariantOutputs } from '@/types';
import { DevicePhoneMobileIcon, CheckCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface AppIconVariantModuleProps {
  module: Module;
}

/**
 * AppIconVariantModule - Individual app icon variant node
 *
 * Displays a single app icon variant with all required sizes for iOS and Android.
 * Each variant appears as its own node on the canvas.
 */
export default function AppIconVariantModule({ module }: AppIconVariantModuleProps) {
  const outputs = module.outputs as AppIconVariantOutputs;
  const iconData = outputs?.iconData;

  if (!iconData) {
    return (
      <div className="space-y-3">
        <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-300">No icon data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-blue-300 font-medium">App Icon Variant</span>
        </div>
        <DevicePhoneMobileIcon className="w-4 h-4 text-blue-400" />
      </div>

      {/* Icon Preview - Always Visible */}
      <div className="relative group">
        <div className="aspect-square w-full bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] border-2 border-[#3A3A3A] rounded-2xl overflow-hidden p-4">
          <img
            src={iconData.preview_image}
            alt={`App icon for ${iconData.brand_name}`}
            className="w-full h-full object-contain rounded-xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://placehold.co/512x512/1A1A1A/888888/png?text=Icon+Error`;
            }}
          />
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center p-4">
          <img
            src={iconData.preview_image}
            alt={`App icon for ${iconData.brand_name}`}
            className="max-w-full max-h-full object-contain rounded-xl"
          />
        </div>
      </div>

      {/* Icon Details - Collapsible */}
      <details className="group/details">
        <summary className="px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg cursor-pointer hover:border-blue-500/50 transition-colors list-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-400 font-medium">📱 Icon Details & Downloads</span>
              <span className="text-xs text-gray-500">(click to expand)</span>
            </div>
            <svg className="w-4 h-4 text-gray-400 transition-transform group-open/details:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </summary>

        <div className="mt-3 space-y-3">
          {/* Brand Name */}
          <div className="px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">App Name</p>
            <p className="text-sm text-white font-semibold">{iconData.brand_name}</p>
          </div>

          {/* Style Summary */}
          <div className="px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Style</p>
            <p className="text-xs text-gray-200">{iconData.style_summary}</p>
          </div>

          {/* Background Type */}
          <div className="px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Background</p>
            <p className="text-xs text-gray-200 capitalize">{iconData.background_type}</p>
          </div>

          {/* iOS Sizes */}
          <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-blue-300 font-semibold">🍎 iOS Icons</span>
            </div>
            <div className="space-y-2">
              <a
                href={iconData.sizes.ios_1024}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-2 py-1.5 bg-[#0A0A0A]/50 rounded hover:bg-blue-500/20 transition-colors group/link"
              >
                <span className="text-xs text-gray-300">App Store (1024×1024)</span>
                <ArrowDownTrayIcon className="w-3.5 h-3.5 text-gray-500 group-hover/link:text-blue-400" />
              </a>
            </div>
          </div>

          {/* Android Sizes */}
          <div className="px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-green-300 font-semibold">🤖 Android Icons</span>
            </div>
            <div className="space-y-1.5">
              <a
                href={iconData.sizes.android_512}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-2 py-1.5 bg-[#0A0A0A]/50 rounded hover:bg-green-500/20 transition-colors group/link"
              >
                <span className="text-xs text-gray-300">Play Store (512×512)</span>
                <ArrowDownTrayIcon className="w-3.5 h-3.5 text-gray-500 group-hover/link:text-green-400" />
              </a>

              <details className="group/android">
                <summary className="px-2 py-1.5 text-xs text-gray-400 cursor-pointer hover:text-gray-300 list-none">
                  DPI Variants (5 sizes) →
                </summary>
                <div className="mt-1.5 space-y-1 pl-2">
                  <a href={iconData.sizes.android_xxxhdpi} target="_blank" className="flex items-center justify-between px-2 py-1 bg-[#0A0A0A]/50 rounded hover:bg-green-500/20 transition-colors group/link text-xs">
                    <span className="text-gray-400">xxxhdpi (192×192)</span>
                    <ArrowDownTrayIcon className="w-3 h-3 text-gray-500 group-hover/link:text-green-400" />
                  </a>
                  <a href={iconData.sizes.android_xxhdpi} target="_blank" className="flex items-center justify-between px-2 py-1 bg-[#0A0A0A]/50 rounded hover:bg-green-500/20 transition-colors group/link text-xs">
                    <span className="text-gray-400">xxhdpi (144×144)</span>
                    <ArrowDownTrayIcon className="w-3 h-3 text-gray-500 group-hover/link:text-green-400" />
                  </a>
                  <a href={iconData.sizes.android_xhdpi} target="_blank" className="flex items-center justify-between px-2 py-1 bg-[#0A0A0A]/50 rounded hover:bg-green-500/20 transition-colors group/link text-xs">
                    <span className="text-gray-400">xhdpi (96×96)</span>
                    <ArrowDownTrayIcon className="w-3 h-3 text-gray-500 group-hover/link:text-green-400" />
                  </a>
                  <a href={iconData.sizes.android_hdpi} target="_blank" className="flex items-center justify-between px-2 py-1 bg-[#0A0A0A]/50 rounded hover:bg-green-500/20 transition-colors group/link text-xs">
                    <span className="text-gray-400">hdpi (72×72)</span>
                    <ArrowDownTrayIcon className="w-3 h-3 text-gray-500 group-hover/link:text-green-400" />
                  </a>
                  <a href={iconData.sizes.android_mdpi} target="_blank" className="flex items-center justify-between px-2 py-1 bg-[#0A0A0A]/50 rounded hover:bg-green-500/20 transition-colors group/link text-xs">
                    <span className="text-gray-400">mdpi (48×48)</span>
                    <ArrowDownTrayIcon className="w-3 h-3 text-gray-500 group-hover/link:text-green-400" />
                  </a>
                </div>
              </details>
            </div>
          </div>

          {/* Favicon (if available) */}
          {iconData.sizes.favicon_32 && (
            <div className="px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-purple-300 font-semibold">🌐 Web Icon</span>
              </div>
              <a
                href={iconData.sizes.favicon_32}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-2 py-1.5 bg-[#0A0A0A]/50 rounded hover:bg-purple-500/20 transition-colors group/link"
              >
                <span className="text-xs text-gray-300">Favicon (32×32)</span>
                <ArrowDownTrayIcon className="w-3.5 h-3.5 text-gray-500 group-hover/link:text-purple-400" />
              </a>
            </div>
          )}

          {/* AI Prompt (Nested Collapsible) */}
          <details className="px-3 py-2 bg-[#0A0A0A]/50 border border-[#3A3A3A]/50 rounded-lg">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
              AI Prompt Used
            </summary>
            <pre className="text-xs text-gray-500 mt-2 whitespace-pre-wrap font-mono">
              {iconData.ai_prompt_used}
            </pre>
          </details>

          {/* Output Info */}
          <div className="px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-xs text-cyan-300 font-medium">Ready for Production</span>
            </div>
            <p className="text-xs text-cyan-200/70">
              All required icon sizes generated. Download links available above. Can be connected to downstream modules.
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}
