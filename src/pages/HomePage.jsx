import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HandMetal, BookOpen, Brain, Camera } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-beige-100 flex flex-col items-center justify-center px-4 py-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl"
      >
        <div className="inline-flex items-center gap-2 bg-accent-green/10 text-accent-green px-4 py-2 rounded-full font-black text-sm uppercase tracking-widest mb-8 border border-accent-green/20">
          <HandMetal size={16} />
          <span>Master ASL with AI</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black text-dark-text mb-8 tracking-tighter leading-tight">
          Learn to sign <br />
          <span className="text-accent-green italic">naturally.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-dark-muted mb-12 max-w-2xl mx-auto leading-relaxed">
          Interactive American Sign Language learning. Our AI listens to your hands and provides real-time feedback directly in your browser.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link
            to="/webcam"
            className="w-full sm:w-auto px-10 py-5 bg-dark-card hover:bg-black text-white rounded-2xl font-black text-xl transition-all hover:scale-105 shadow-xl flex items-center justify-center gap-3"
          >
            <Camera size={24} />
            Start Practicing
          </Link>
          <Link
            to="/quiz"
            className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-beige-300 text-dark-text hover:border-accent-green rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 shadow-lg"
          >
            <Brain size={24} />
            Take a Quiz
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {[
            { icon: <Camera />, title: "AI Tracking", desc: "Real-time hand gesture recognition using your webcam." },
            { icon: <BookOpen />, title: "Dictionary", desc: "Complete A-Z alphabet and common phrases with local references." },
            { icon: <Brain />, title: "Visual Quizzes", desc: "Test your knowledge with multiple modes and point systems." }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-beige-200 p-6 rounded-2xl border border-beige-300"
            >
              <div className="text-accent-green mb-4">{feature.icon}</div>
              <h3 className="text-xl font-black text-dark-text mb-2">{feature.title}</h3>
              <p className="text-dark-muted leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
