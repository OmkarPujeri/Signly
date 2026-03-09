import { motion } from 'framer-motion';
import SearchBar from '../components/SearchBar';
import SignCard from '../components/SignCard';
import { signs } from '../data/signs';
import { useDictionaryStore } from '../store/useDictionaryStore';
import { BookOpen } from 'lucide-react';

export default function DictionaryPage() {
  const { searchQuery } = useDictionaryStore();

  const alphabetSigns = signs.filter((sign) => {
    const matchesSearch = sign.word.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && sign.category === 'alphabet';
  });

  return (
    <div className="min-h-screen bg-beige-100">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="flex flex-col items-center mb-16 space-y-8">
          <div className="inline-flex items-center gap-2 bg-dark-card text-white px-4 py-2 rounded-full font-black text-sm uppercase tracking-widest border border-white/10 shadow-lg">
            <BookOpen size={16} className="text-accent-green" />
            <span>Alphabet Dictionary</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-dark-text tracking-tighter text-center">
            Master the <span className="text-accent-green">alphabet.</span>
          </h1>
          
          <div className="w-full max-w-2xl">
            <SearchBar />
          </div>
        </div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 }
            }
          }}
        >
          {alphabetSigns.map((sign) => (
            <motion.div
              key={sign.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <SignCard sign={sign} />
            </motion.div>
          ))}
          {alphabetSigns.length === 0 && (
            <div className="col-span-full text-center py-24 bg-beige-200 rounded-3xl border-2 border-dashed border-beige-300">
              <p className="text-xl font-bold text-dark-muted">No letters found matching your search.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
