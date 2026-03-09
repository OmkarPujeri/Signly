import { Search } from 'lucide-react';
import { useDictionaryStore } from '../store/useDictionaryStore';

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useDictionaryStore();

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
        <Search className="h-6 w-6 text-dark-muted" />
      </div>
      <input
        type="text"
        className="block w-full pl-14 pr-6 py-5 border-2 border-beige-300 rounded-3xl leading-5 bg-white text-dark-text placeholder-dark-muted focus:outline-none focus:ring-4 focus:ring-accent-green/10 focus:border-accent-green text-lg font-bold transition-all shadow-lg"
        placeholder="Search signs by word or letter..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
}
