import { motion } from 'framer-motion';
import { useState } from 'react';

export default function SignCard({ sign }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div 
      layout
      onClick={() => setIsExpanded(!isExpanded)}
      className="bg-beige-200 rounded-2xl p-4 border border-beige-300 cursor-pointer hover:shadow-lg transition-all relative overflow-visible"
    >
      <div className="aspect-[4/3] relative rounded-xl overflow-hidden bg-dark-card mb-4 flex items-center justify-center p-[12px]">
        {!imgError && sign.src ? (
          <img 
            src={sign.src} 
            alt={`ASL sign for ${sign.word}: ${sign.description}`} 
            className="w-full h-full object-contain"
            onError={(e) => {
              setImgError(true);
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`${imgError || !sign.src ? 'flex' : 'hidden'} w-full h-full items-center justify-center text-white bg-dark-card`}>
          <span className="text-6xl font-bold">{sign.word}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-black text-dark-text">{sign.word}</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-dark-muted px-2 py-1 bg-beige-300/50 rounded-full">{sign.category}</span>
        </div>
        <p className="text-sm text-accent-green font-bold line-clamp-1">
          {sign.handShape}
        </p>
        <p className="text-dark-muted text-sm line-clamp-2">
          {sign.description}
        </p>
        
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="pt-4 mt-4 border-t border-beige-300 space-y-3"
          >
            <div className="bg-beige-100/50 p-3 rounded-xl">
              <p className="text-sm text-dark-text font-bold mb-1 italic">Pro Tip:</p>
              <p className="text-sm text-dark-muted leading-relaxed">{sign.tip}</p>
            </div>
            {sign.exampleSentence && (
              <p className="text-sm italic text-dark-muted border-l-4 border-accent-green pl-3 py-1 bg-accent-green/5">
                "{sign.exampleSentence}"
              </p>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
