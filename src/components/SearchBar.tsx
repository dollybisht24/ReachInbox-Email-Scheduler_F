import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(value.trim());
    }, 300);

    return () => clearTimeout(handler);
  }, [value, onSearch]);

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search by recipient, subject, or content..."
          className="w-full pl-9 pr-24 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-slate-400 text-slate-900 shadow-2xs"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-16 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-50 text-[10px] font-semibold text-amber-800 border border-amber-200/60 pointer-events-none">
          <Sparkles className="w-2.5 h-2.5 text-amber-600" />
          <span>Elasticsearch</span>
        </div>
      </div>
    </div>
  );
};
