import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, RotateCw, X } from 'lucide-react';

interface TopSearchBarProps {
  onSearch: (query: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const TopSearchBar: React.FC<TopSearchBarProps> = ({
  onSearch,
  onRefresh,
  isRefreshing,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="flex items-center space-x-3 py-4 px-6 border-b border-slate-100 bg-white">
      {/* Pill Search Input */}
      <div className="relative flex-1 max-w-xl">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="w-full bg-[#F4F6F8] text-slate-800 text-sm placeholder:text-slate-400 rounded-full pl-10 pr-9 py-2 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Icon Button */}
      <button
        title="Filter"
        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4" />
      </button>

      {/* Refresh Icon Button */}
      <button
        onClick={onRefresh}
        title="Refresh emails"
        disabled={isRefreshing}
        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
      >
        <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-slate-700' : ''}`} />
      </button>
    </div>
  );
};
