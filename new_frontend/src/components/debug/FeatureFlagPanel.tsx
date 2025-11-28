/**
 * Feature Flag Debug Panel
 * Development tool for toggling feature flags
 *
 * Only visible in development mode
 * Access via keyboard shortcut: Ctrl + Shift + F
 */

import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Download, Upload, Copy, Check } from 'lucide-react';
import {
  getFeatureFlags,
  setFeatureFlag,
  resetFeatureFlags,
  exportFeatureFlags,
  importFeatureFlags,
  type FeatureFlags,
} from '../../config/featureFlags';

export const FeatureFlagPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [flags, setFlags] = useState<FeatureFlags>(getFeatureFlags());
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  // Keyboard shortcut: Ctrl + Shift + F
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Listen for flag changes
  useEffect(() => {
    const handleChange = (event: Event) => {
      const customEvent = event as CustomEvent<FeatureFlags>;
      setFlags(customEvent.detail);
    };

    window.addEventListener('featureFlagsChanged', handleChange);
    return () => {
      window.removeEventListener('featureFlagsChanged', handleChange);
    };
  }, []);

  const handleToggle = (flag: keyof FeatureFlags) => {
    const newValue = !flags[flag];
    setFeatureFlag(flag, newValue);
  };

  const handleReset = () => {
    if (confirm('Reset all feature flags to defaults?')) {
      resetFeatureFlags();
      setFlags(getFeatureFlags());
    }
  };

  const handleExport = () => {
    const json = exportFeatureFlags();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feature-flags.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          try {
            importFeatureFlags(content);
            setFlags(getFeatureFlags());
          } catch (error) {
            alert('Failed to import feature flags: Invalid JSON');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportFeatureFlags());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Filter flags based on search term
  const filteredFlags = Object.entries(flags).filter(([key]) =>
    key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group flags by category
  const groupedFlags = {
    'Page-Level Features': filteredFlags.filter(([key]) => key.startsWith('ENHANCED_')),
    'Chat Features': filteredFlags.filter(([key]) => key.startsWith('CHAT_')),
    'Diet Care Features': filteredFlags.filter(([key]) => key.startsWith('DIET_')),
    'MyPage Features': filteredFlags.filter(([key]) => key.startsWith('MYPAGE_')),
    'Community Features': filteredFlags.filter(([key]) => key.startsWith('COMMUNITY_')),
    'Trends Features': filteredFlags.filter(([key]) => key.startsWith('TRENDS_')),
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-96 max-h-[700px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary p-4 flex items-center justify-between">
        <h3 className="text-white font-bold flex items-center gap-2">
          <span className="text-xl">🚩</span>
          Feature Flags
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-normal">DEV</span>
        </h3>
        <div className="flex gap-1">
          <button
            onClick={handleCopyToClipboard}
            className="text-white/80 hover:text-white p-1.5 hover:bg-white/20 rounded transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
          <button
            onClick={handleExport}
            className="text-white/80 hover:text-white p-1.5 hover:bg-white/20 rounded transition-colors"
            title="Export flags"
          >
            <Download size={18} />
          </button>
          <button
            onClick={handleImport}
            className="text-white/80 hover:text-white p-1.5 hover:bg-white/20 rounded transition-colors"
            title="Import flags"
          >
            <Upload size={18} />
          </button>
          <button
            onClick={handleReset}
            className="text-white/80 hover:text-white p-1.5 hover:bg-white/20 rounded transition-colors"
            title="Reset all flags"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white p-1.5 hover:bg-white/20 rounded transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search flags..."
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Flags List */}
      <div className="p-4 max-h-[450px] overflow-y-auto">
        {Object.entries(groupedFlags).map(([category, flags]) => {
          if (flags.length === 0) return null;

          return (
            <div key={category} className="mb-4 last:mb-0">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {category}
              </h4>
              <div className="space-y-1">
                {flags.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-2 px-3 rounded-lg
                      hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                  >
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        {formatFlagName(key)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {key}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggle(key as keyof FeatureFlags)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        value ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      aria-label={`Toggle ${key}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filteredFlags.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No flags found matching "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="bg-gray-50 dark:bg-gray-900 p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>
              <strong className="text-primary">
                {Object.values(flags).filter(Boolean).length}
              </strong>{' '}
              / {Object.keys(flags).length} enabled
            </span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">
              Ctrl
            </kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">
              Shift
            </kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">
              F
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Format flag name for display (convert SNAKE_CASE to Title Case)
 */
function formatFlagName(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}
