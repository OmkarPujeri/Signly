import { create } from 'zustand';

export const useDictionaryStore = create((set) => ({
  searchQuery: '',
  categoryFilter: 'all',
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
}));
