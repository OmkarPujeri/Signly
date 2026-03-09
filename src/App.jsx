import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import DictionaryPage from './pages/DictionaryPage';
import WebcamPage from './pages/WebcamPage';
import QuizPage from './pages/QuizPage';

const CameraCleanup = () => {
  const location = useLocation();

  useEffect(() => {
    // On every route change, stop any lingering camera streams
    return () => {
      navigator.mediaDevices.enumerateDevices()
        .then(() => {
          // Stop all video tracks globally
          const videos = document.querySelectorAll('video');
          videos.forEach(video => {
            if (video.srcObject) {
              const stream = video.srcObject;
              const tracks = stream.getTracks();
              tracks.forEach(t => {
                t.stop();
              });
              video.srcObject = null;
            }
          });
        })
        .catch(() => {});
    };
  }, [location.pathname]);

  return null;
};

function App() {
  return (
    <Router>
      <CameraCleanup />
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-200 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dictionary" element={<DictionaryPage />} />
            <Route path="/webcam" element={<WebcamPage />} />
            <Route path="/quiz" element={<QuizPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
