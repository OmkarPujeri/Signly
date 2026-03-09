import { NavLink } from 'react-router-dom';
import { HandMetal, BookOpen, Brain, Camera } from 'lucide-react';

export default function Navbar() {
  const links = [
    { to: '/', label: 'Home', icon: <HandMetal size={20} /> },
    { to: '/dictionary', label: 'Dictionary', icon: <BookOpen size={20} /> },
    { to: '/quiz', label: 'Quiz', icon: <Brain size={20} /> },
    { to: '/webcam', label: 'Webcam', icon: <Camera size={20} /> },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-beige-50/80 backdrop-blur-md border-b border-beige-300 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="bg-accent-green p-1.5 rounded-lg shadow-sm">
              <HandMetal className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-dark-text">Signly</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => 
                  `flex items-center gap-2 text-sm font-bold transition-all px-3 py-2 rounded-xl hover:bg-beige-200 ${
                    isActive ? 'text-accent-green bg-beige-200 shadow-inner' : 'text-dark-muted'
                  }`
                }
              >
                {link.icon}
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
