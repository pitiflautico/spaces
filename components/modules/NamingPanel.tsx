'use client';

import React, { useState } from 'react';
import type { NamingPackage, ChosenName } from '@/types';
import { XMarkIcon, DocumentTextIcon, CodeBracketIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

interface NamingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  namingPackage: NamingPackage;
  chosenName?: ChosenName;
  namingLog?: string;
}

type Tab = 'summary' | 'json' | 'logs';

export default function NamingPanel({ isOpen, onClose, namingPackage, chosenName, namingLog }: NamingPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('summary');

  if (!isOpen) return null;

  const handleCopyJSON = () => {
    const jsonData = {
      namingPackage,
      chosenName
    };
    navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
    alert('JSON copied to clipboard!');
  };

  const handleDownloadJSON = () => {
    const jsonData = {
      namingPackage,
      chosenName
    };
    const dataStr = JSON.stringify(jsonData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `naming-package-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLog = () => {
    if (namingLog) {
      navigator.clipboard.writeText(namingLog);
      alert('Log copied to clipboard!');
    }
  };

  const handleDownloadLog = () => {
    if (namingLog) {
      const dataBlob = new Blob([namingLog], { type: 'text/plain' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `naming-log-${Date.now()}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Naming Panel</h2>
              <p className="text-xs text-gray-400">Complete naming package details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] flex items-center justify-center transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-[#2A2A2A]">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'summary'
                ? 'bg-[#2A2A2A] text-white border-b-2 border-orange-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📝 Summary
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'json'
                ? 'bg-[#2A2A2A] text-white border-b-2 border-orange-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🔧 JSON
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'logs'
                ? 'bg-[#2A2A2A] text-white border-b-2 border-orange-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📋 Logs
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* TAB 1: SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Final Name (if chosen) */}
              {chosenName && (
                <div className="px-6 py-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg text-green-400 font-semibold">✓ Final Name Selected</span>
                  </div>
                  <p className="text-3xl text-white font-bold">{chosenName.final_name}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Selected: {new Date(chosenName.chosen_at).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Recommended Name */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span>⭐</span>
                  Recommended Name
                </h3>
                <div className="px-6 py-4 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-xl">
                  <p className="text-2xl text-white font-bold">{namingPackage.recommended_name}</p>
                  <p className="text-lg text-gray-300 mt-2 italic">"{namingPackage.slogan}"</p>
                </div>
              </div>

              {/* Alternatives */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Alternative Names</h3>
                <div className="grid grid-cols-2 gap-3">
                  {namingPackage.alternatives.map((alt, i) => (
                    <div key={i} className="px-4 py-3 bg-[#0A0A0A]/80 border border-[#3A3A3A] rounded-lg">
                      <p className="text-lg text-white font-medium">{alt}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Style & Tone */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase">Style</h3>
                  <div className="px-4 py-3 bg-[#0A0A0A]/80 border border-[#3A3A3A] rounded-lg">
                    <p className="text-white">{namingPackage.style}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase">Tone</h3>
                  <div className="px-4 py-3 bg-[#0A0A0A]/80 border border-[#3A3A3A] rounded-lg">
                    <p className="text-white">{namingPackage.tone}</p>
                  </div>
                </div>
              </div>

              {/* Creative Rationale */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Creative Rationale</h3>
                <div className="px-6 py-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
                  <p className="text-gray-200 leading-relaxed">{namingPackage.creative_rationale}</p>
                </div>
              </div>

              {/* BRANDING IDENTITY - NEW SECTION */}
              {namingPackage.branding && (
                <div className="space-y-4 pt-6 border-t-2 border-pink-500/30">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>🎨</span>
                    Complete Branding Identity
                  </h2>

                  {/* Visual Style */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-pink-400">Visual Style</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="px-4 py-3 bg-[#0A0A0A]/80 border border-pink-500/30 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Design Style</p>
                        <p className="text-white font-medium">{namingPackage.branding.design_style}</p>
                      </div>
                      <div className="px-4 py-3 bg-[#0A0A0A]/80 border border-pink-500/30 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Shape Style</p>
                        <p className="text-white font-medium">{namingPackage.branding.shape_style}</p>
                      </div>
                      <div className="px-4 py-3 bg-[#0A0A0A]/80 border border-pink-500/30 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Icon Style</p>
                        <p className="text-white font-medium">{namingPackage.branding.icon_style}</p>
                      </div>
                    </div>
                  </div>

                  {/* Color Palette */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-pink-400">Color Palette</h3>
                    <div className="px-4 py-4 bg-[#0A0A0A]/80 border border-pink-500/30 rounded-lg">
                      <div className="flex gap-3 mb-4">
                        {namingPackage.branding.color_palette.map((color, i) => (
                          <div key={i} className="flex-1">
                            <div
                              className="w-full h-20 rounded-lg border-2 border-white/20 shadow-lg"
                              style={{ backgroundColor: color }}
                            />
                            <p className="text-xs text-gray-300 mt-2 text-center font-mono">{color}</p>
                            {namingPackage.branding.color_meanings?.[i] && (
                              <p className="text-xs text-gray-400 mt-1 text-center italic">
                                {namingPackage.branding.color_meanings[i]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Typography */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-pink-400">Typography</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="px-4 py-3 bg-[#0A0A0A]/80 border border-pink-500/30 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Primary Font</p>
                        <p className="text-white font-medium text-lg">{namingPackage.branding.primary_font_family}</p>
                      </div>
                      <div className="px-4 py-3 bg-[#0A0A0A]/80 border border-pink-500/30 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Secondary Font</p>
                        <p className="text-white font-medium text-lg">{namingPackage.branding.secondary_font_family}</p>
                      </div>
                    </div>
                    <div className="px-4 py-3 bg-[#0A0A0A]/80 border border-pink-500/30 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Font Style</p>
                      <p className="text-white">{namingPackage.branding.font_style}</p>
                    </div>
                  </div>

                  {/* Brand Personality */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-pink-400">Brand Personality</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="px-4 py-3 bg-[#0A0A0A]/80 border border-pink-500/30 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Brand Tone</p>
                        <p className="text-white font-medium">{namingPackage.branding.brand_tone}</p>
                      </div>
                      <div className="px-4 py-3 bg-[#0A0A0A]/80 border border-pink-500/30 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Target Emotion</p>
                        <p className="text-white font-medium">{namingPackage.branding.target_emotion}</p>
                      </div>
                    </div>
                    <div className="px-4 py-3 bg-[#0A0A0A]/80 border border-pink-500/30 rounded-lg">
                      <p className="text-xs text-gray-400 mb-2">Brand Values</p>
                      <div className="flex flex-wrap gap-2">
                        {namingPackage.branding.brand_values.map((value, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-pink-500/20 text-pink-300 text-sm rounded-full border border-pink-500/30 font-medium"
                          >
                            {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Branding Concept & Visual Direction */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-pink-400">Concept & Direction</h3>
                    <div className="px-6 py-4 bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-xl">
                      <p className="text-xs text-gray-400 mb-2">Branding Concept</p>
                      <p className="text-gray-200 leading-relaxed mb-4">{namingPackage.branding.branding_concept}</p>
                      <p className="text-xs text-gray-400 mb-2">Visual Direction</p>
                      <p className="text-gray-200 leading-relaxed">{namingPackage.branding.visual_direction}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Naming Keywords */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Naming Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {namingPackage.naming_keywords.map((keyword, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full border border-blue-500/30 font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Short Descriptions */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Short Descriptions</h3>
                <div className="space-y-2">
                  {namingPackage.short_descriptions.map((desc, i) => (
                    <div key={i} className="px-4 py-3 bg-[#0A0A0A]/80 border border-[#3A3A3A] rounded-lg">
                      <p className="text-gray-200">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Domain Suggestions */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Domain Suggestions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {namingPackage.domain_suggestions.map((domain, i) => (
                    <div key={i} className="px-4 py-3 bg-[#0A0A0A]/80 border border-[#3A3A3A] rounded-lg font-mono">
                      <p className="text-green-400">{domain}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JSON */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Structured JSON Output</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyJSON}
                    className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs text-blue-400 transition-colors flex items-center gap-2"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    onClick={handleDownloadJSON}
                    className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-xs text-green-400 transition-colors"
                  >
                    💾 Download
                  </button>
                </div>
              </div>
              <div className="bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                  {JSON.stringify({ namingPackage, chosenName }, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Naming Log</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLog}
                    className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs text-blue-400 transition-colors flex items-center gap-2"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    onClick={handleDownloadLog}
                    className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-xs text-green-400 transition-colors"
                  >
                    💾 Download
                  </button>
                </div>
              </div>
              <div className="bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg p-4">
                <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                  {namingLog || 'No log available'}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#2A2A2A]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
