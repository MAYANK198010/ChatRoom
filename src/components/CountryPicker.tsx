import React, { useState } from 'react';
import { Search, Check, X } from 'lucide-react';

export interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { name: 'Nigeria', code: 'NG', dialCode: '+234', flag: '🇳🇬' },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'Spain', code: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { name: 'Italy', code: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { name: 'Mexico', code: 'MX', dialCode: '+52', flag: '🇲🇽' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31', flag: '🇳🇱' },
  { name: 'Pakistan', code: 'PK', dialCode: '+92', flag: '🇵🇰' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩' }
];

interface CountryPickerProps {
  selectedCountry?: Country;
  selectedDialCode?: string;
  onSelect: (country: Country) => void;
  onClose: () => void;
}

export const CountryPicker: React.FC<CountryPickerProps> = ({
  selectedCountry,
  selectedDialCode,
  onSelect,
  onClose
}) => {
  const [search, setSearch] = useState('');

  const currentCode = selectedCountry?.dialCode || selectedDialCode || '+1';

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dialCode.includes(search) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in select-none text-[#1c1e21] font-sans">
      <div className="bg-white border border-[#e4e6eb] w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-[#e4e6eb] flex items-center justify-between">
          <h3 className="text-lg font-bold">Select Region</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3.5 border-b border-[#e4e6eb] bg-[#fafafa]">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search country or dial code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-white text-[#1c1e21] pl-10 pr-4 py-2 rounded-xl text-xs border border-gray-200 focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-2 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No country found matching "{search}"
            </div>
          ) : (
            filtered.map((c) => {
              const isSelected = c.dialCode === currentCode;
              return (
                <button
                  key={c.code}
                  onClick={() => {
                    onSelect(c);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition text-left cursor-pointer ${
                    isSelected ? 'bg-blue-50 text-[#0084ff]' : 'hover:bg-[#f0f2f5] text-[#1c1e21]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl select-none">{c.flag}</span>
                    <div>
                      <div className="text-xs font-bold">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">{c.code}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-[#0084ff]">{c.dialCode}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#0084ff]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
