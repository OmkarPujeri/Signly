import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signs } from '../data/signs';
import { useQuizStore } from '../store/useQuizStore';
import { useNavigate } from 'react-router-dom';
import { Brain, Camera, ArrowRight, Timer, CheckCircle2, XCircle, X, Info } from 'lucide-react';
import useMediaPipe from '../hooks/useMediaPipe';
import { useGestureClassifier } from '../hooks/useGestureClassifier';
import WebcamFeed from '../components/WebcamFeed';

export default function QuizPage() {
  const navigate = useNavigate();
  const { 
    mode, 
    setMode, answerQuestion, resetQuiz, usedQuestions, addUsedQuestion
  } = useQuizStore();

  const [score, setScore] = useState(0);
  const [isMatch, setIsMatch] = useState(false);
  const [currentSign, setCurrentSign] = useState(null);
  const [options, setOptions] = useState([]);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [toast, setToast] = useState(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [answerLocked, setAnswerLocked] = useState(false);
  
  const [quizComplete, setQuizComplete] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);

  const [detectedLetter, setDetectedLetter] = useState(null);
  const [confidence, setConfidence] = useState(0);

  const detectionHistoryRef = useRef([]);
  const currentSignRef = useRef(null);

  const { classify } = useGestureClassifier();

  const isCameraMode = mode === 'camera' && quizStarted;

  // Sync ref with state to avoid stale closures
  useEffect(() => {
    currentSignRef.current = currentSign
  }, [currentSign])

  // Camera hooks
  const { videoRef, canvasRef, isLoading, error } = useMediaPipe({
    enabled: mode === 'camera' && quizStarted,
    onResult: (landmarks) => {
      if (mode !== 'camera') return;
      if (!landmarks) {
        setDetectedLetter(null);
        setConfidence(0);
        return;
      }
      const result = classify(landmarks);
      
      const safeLetter = result?.letter ?? null;
      const safeConf = isNaN(result?.confidence) ? 0 : result.confidence;
      
      setDetectedLetter(safeLetter);
      setConfidence(Math.round(safeConf * 100));

      const target = currentSignRef.current?.word?.toUpperCase();

      const checkDetection = (safeLetter, safeConf) => {
        if (!safeLetter || !target) return
        if (answerLocked) return
        if (mode !== 'camera') return
        if (!cameraReady) return

        detectionHistoryRef.current.push(safeLetter)
        if (detectionHistoryRef.current.length > 5)
          detectionHistoryRef.current.shift()

        const last3 = detectionHistoryRef.current.slice(-3)
        const allSame = last3.length === 3 && 
          last3.every(l => l === safeLetter)

        if (allSame && 
            safeLetter === target && 
            safeConf >= 0.55) {
          handleCorrectAnswer()
        }
      }

      checkDetection(safeLetter, safeConf)
    },
    onReady: () => {
      setCameraReady(true);
    }
  });

  const handleCorrectAnswer = () => {
    if (answerLocked) return
    setAnswerLocked(true)

    // Points based on time remaining
    let points = 10  // base points
    if (timeLeft > 10) points = 20      // answered quickly
    else if (timeLeft > 5) points = 15  // answered medium speed
    else points = 10                     // answered slowly

    setScore(prev => prev + points)
    setCorrectCount(prev => (prev || 0) + 1)
    
    setIsMatch(true)  // ← show tick only on correct answer

    setTimeout(() => {
      setIsMatch(false)  // ← hide tick before moving to next question
      nextQuestion()
    }, 1000)
  }

  const nextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    
    // Check if quiz is complete BEFORE setting next question
    if (nextIndex >= 10) {
      setQuizComplete(true);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }
    
    // Reset for next question
    setAnswerLocked(false)
    setIsMatch(false)  // ← always clear on question change
    setCurrentQuestionIndex(nextIndex);
    setHasAnswered(false);
    setSelectedAnswer(null);
    setTimeLeft(10);
    detectionHistoryRef.current = []
    startNextQuestion();
  };

  const handleTimeUp = () => {
    if (answerLocked) return
    setAnswerLocked(true)
    setIsMatch(false)          // ← clear green tick immediately
    setDetectedLetter(null)    // ← clear detected letter
    setConfidence(0)           // ← clear confidence
    detectionHistoryRef.current = []  // ← clear history
    setToast({ type: 'error', msg: "Time's up!" });
    answerQuestion(false, 0);
    setTimeout(() => {
      nextQuestion()
    }, 1500)
  };

  useEffect(() => {
    if (mode && !currentSign && quizStarted) {
      startNextQuestion();
    }
  }, [mode, quizStarted]);

  // Shared Timer Logic
  useEffect(() => {
    if (!quizStarted || quizComplete) return
    if (mode === 'camera' && !cameraReady) return
    if (timeLeft <= 0) { handleTimeUp(); return }
    
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [timeLeft, quizStarted, quizComplete, mode, cameraReady])

  // Reset detectionHistoryRef when question changes
  useEffect(() => {
    detectionHistoryRef.current = [];
  }, [currentQuestionIndex]);

  // Cleanup camera when complete
  useEffect(() => {
    if (quizComplete) {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [quizComplete]);

  const startNextQuestion = () => {
    const alphabetSigns = signs.filter(s => s.category === 'alphabet');
    const remaining = alphabetSigns.filter(s => !usedQuestions.includes(s.id));
    
    if (remaining.length === 0) {
      setQuizComplete(true);
      return;
    }

    const nextSign = remaining[Math.floor(Math.random() * remaining.length)];
    
    setCurrentSign(nextSign);
    addUsedQuestion(nextSign.id);
    setOptions(generateOptions(nextSign));
    setHasAnswered(false);
    setSelectedAnswer(null);
    setAnswerLocked(false);
    setTimeLeft(10);
    setToast(null);
  };

  function generateOptions(correctSign) {
    const opts = [correctSign.word];
    const alphabetSigns = signs.filter(s => s.category === 'alphabet');
    while(opts.length < 4) {
      const random = alphabetSigns[Math.floor(Math.random() * alphabetSigns.length)].word;
      if(!opts.includes(random)) opts.push(random);
    }
    return opts.sort(() => Math.random() - 0.5);
  }

  const handleSelect = (option) => {
    if (hasAnswered || answerLocked) return;
    
    const isExactMatch = option?.toString().toUpperCase() === currentSign?.word?.toString().toUpperCase();
    const isOCConfusion = (option === 'O' && currentSign?.word === 'C') || (option === 'C' && currentSign?.word === 'O');
    
    let pointsEarned = 0;
    let isCorrect = isExactMatch;

    if (isExactMatch) {
      setCorrectCount(prev => prev + 1);
      if (mode === 'visual') {
        if (timeLeft > 7) pointsEarned = 20;
        else if (timeLeft > 4) pointsEarned = 15;
        else pointsEarned = 10;
      } else {
        pointsEarned = 15;
      }
      setScore(prev => prev + pointsEarned);
      setToast({ type: 'success', msg: `Correct! +${pointsEarned}pts` });
    } else if (isOCConfusion) {
      isCorrect = true; // Still advance
      pointsEarned = 7; // ~50% credit
      setScore(prev => prev + pointsEarned);
      setToast({ type: 'info', msg: "Close! O and C are similar — try closing your hand more for O" });
    } else {
      setHasAnswered(true);
      setAnswerLocked(true);
      setSelectedAnswer(option);
      setToast({ type: 'error', msg: "Wrong!" });
      answerQuestion(false, 0);
      setTimeout(nextQuestion, 2000);
      return;
    }

    setHasAnswered(true);
    setAnswerLocked(true);
    setSelectedAnswer(option);
    answerQuestion(isCorrect, pointsEarned);
    setTimeout(nextQuestion, 2000);
  };

  const handleQuit = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setShowEndConfirm(false);
    resetQuiz();
    setQuizStarted(false);
    setQuizComplete(false);
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
  };

  if (quizComplete) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-lg p-12 text-center max-w-md w-full">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-black mb-2">Quiz Complete!</h2>
          <p className="text-gray-500 mb-6">Here's how you did</p>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-[#F5F0E8] rounded-2xl p-4">
              <p className="text-3xl font-black text-green-500">{score}</p>
              <p className="text-xs text-gray-400 mt-1">POINTS</p>
            </div>
            <div className="bg-[#F5F0E8] rounded-2xl p-4">
              <p className="text-3xl font-black">{correctCount}/10</p>
              <p className="text-xs text-gray-400 mt-1">CORRECT</p>
            </div>
            <div className="bg-[#F5F0E8] rounded-2xl p-4">
              <p className="text-3xl font-black">
                {Math.round((correctCount / 10) * 100)}%
              </p>
              <p className="text-xs text-gray-400 mt-1">ACCURACY</p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setQuizComplete(false);
                setCurrentQuestionIndex(0);
                resetQuiz();
                setCorrectCount(0);
                setAnswerLocked(false);
                setHasAnswered(false);
                setTimeLeft(10);
                setQuizStarted(false);
              }}
              className="px-6 py-3 rounded-xl bg-green-500 text-white font-semibold"
            >
              Play Again
            </button>
            <button
              onClick={() => navigate('/dictionary')}
              className="px-6 py-3 rounded-xl border border-gray-300 font-semibold"
            >
              Back to Dictionary
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!mode || !quizStarted) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#F5F0E8] flex items-center justify-center p-6">
        <div className="max-w-[1200px] w-full text-center">
          <h1 className="text-5xl font-black text-dark-text mb-4 tracking-tighter">Choose your <span className="text-accent-green">challenge.</span></h1>
          <p className="text-dark-muted mb-12 text-xl font-bold">Test your sign language skills.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <button onClick={() => { setMode('visual'); setQuizStarted(true); }} className="group bg-white p-10 rounded-3xl border-4 border-beige-300 hover:border-accent-green transition-all shadow-xl text-left">
              <div className="bg-beige-200 p-4 rounded-2xl w-fit mb-6 text-accent-green group-hover:scale-110 transition-transform"><Brain size={48} /></div>
              <h2 className="text-3xl font-black text-dark-text mb-2">Visual Quiz</h2>
              <p className="text-dark-muted font-bold">Identify signs from images.</p>
              <div className="mt-8 flex items-center gap-2 text-accent-green font-black uppercase tracking-widest text-sm"><span>Start Now</span><ArrowRight size={16} /></div>
            </button>
            <button onClick={() => { setMode('camera'); setQuizStarted(true); }} className="group bg-white p-10 rounded-3xl border-4 border-beige-300 hover:border-accent-green transition-all shadow-xl text-left">
              <div className="bg-beige-200 p-4 rounded-2xl w-fit mb-6 text-accent-green group-hover:scale-110 transition-transform"><Camera size={48} /></div>
              <h2 className="text-3xl font-black text-dark-text mb-2">Sign It!</h2>
              <p className="text-dark-muted font-bold">Perform signs for the AI.</p>
              <div className="mt-8 flex items-center gap-2 text-accent-green font-black uppercase tracking-widest text-sm"><span>Connect Camera</span><ArrowRight size={16} /></div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isTimerActive = mode === 'visual' || (mode === 'camera' && cameraReady);
  const timerColor = !isTimerActive ? 'bg-beige-300' : (timeLeft > 7 ? 'bg-accent-green' : timeLeft > 4 ? 'bg-yellow-500' : 'bg-red-500');
  const timerWidth = (timeLeft / 10) * 100;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F5F0E8] flex flex-col overflow-hidden">
      <div className="max-w-[1200px] w-full mx-auto px-6 flex-1 flex flex-col pt-4">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4CFC4]">
          {/* Left: Quiz title and question number */}
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black tracking-tight">
              {mode === 'camera' ? 'CAMERA MODE' : 'VISUAL QUIZ'}
            </h2>
            <span className="bg-[#F5F0E8] border border-[#D4CFC4] rounded-full px-3 py-1 text-sm font-bold">
              Q{currentQuestionIndex + 1}/10
            </span>
          </div>

          {/* Right: Score + End Quiz — properly spaced */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-2">
              <span className="text-sm">🎯</span>
              <span className="font-bold text-sm">{score} PTS</span>
            </div>
            <button
              onClick={() => setShowEndConfirm(true)}
              className="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-2 text-sm font-semibold hover:border-red-400 hover:text-red-500 transition-all"
            >
              ✕ End Quiz
            </button>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="w-full bg-beige-300 h-7 rounded-lg mb-6 shrink-0 overflow-hidden shadow-inner border-2 border-white relative">
          <motion.div initial={{ width: '100%' }} animate={{ width: isTimerActive ? `${timerWidth}%` : '100%' }}
            transition={{ duration: isTimerActive ? 1 : 0, ease: 'linear' }} className={`h-full ${timerColor} rounded-md`}
          />
          {!isTimerActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-dark-muted animate-pulse">Waiting for camera...</span>
            </div>
          )}
        </div>

        {/* Quiz Content */}
        <div className="flex-1 flex flex-col items-center justify-center pb-8 overflow-y-auto">
          {mode === 'visual' ? (
            <div className="w-full max-w-2xl flex flex-col items-center">
              <div className="w-[260px] h-[260px] bg-dark-card rounded-3xl p-4 mb-8 shadow-2xl border-8 border-white flex items-center justify-center shrink-0">
                <img src={currentSign?.src} alt="sign" className="w-full h-full object-contain"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                <div className="hidden w-full h-full items-center justify-center text-white text-8xl font-black opacity-20">{currentSign?.word}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full">
                {options.map((opt) => (
                  <button key={opt} onClick={() => handleSelect(opt)} disabled={hasAnswered}
                    className={`py-3 px-6 text-xl font-black rounded-2xl border-4 transition-all ${
                      hasAnswered ? (opt === currentSign?.word ? 'border-accent-green bg-accent-green/10 text-accent-green' : opt === selectedAnswer ? 'border-red-500 bg-red-500/10 text-red-500' : 'opacity-40 border-beige-200 bg-white') : 'border-beige-300 bg-white hover:border-accent-green text-dark-text'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch w-full max-w-[1200px]">
              {/* Left: Target */}
              <div className="bg-white p-6 rounded-[32px] border-4 border-beige-300 shadow-xl flex flex-col items-center justify-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-dark-muted mb-4">TARGET SIGN</span>
                <div className="w-[240px] h-[240px] bg-dark-card rounded-3xl p-4 flex items-center justify-center mb-6 border-4 border-beige-100 shadow-inner overflow-hidden">
                  <img src={currentSign?.src} alt="target" className="w-full h-full object-contain"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                  <div className="hidden w-full h-full items-center justify-center text-white text-8xl font-black">{currentSign?.word}</div>
                </div>
                <h3 className="text-6xl font-black text-dark-text mb-2 leading-none">{currentSign?.word}</h3>
                <p className="text-sm font-bold text-accent-green uppercase tracking-widest text-center">{currentSign?.handShape}</p>
              </div>

              {/* Right: Camera */}
              <div className="flex flex-col gap-4 items-stretch">
                <div className="relative rounded-[32px] overflow-hidden border-8 border-white shadow-2xl bg-black flex-1 min-h-[300px]">
                  <WebcamFeed ref={{ videoRef, canvasRef }} isLoading={isLoading} error={error} />
                  
                  {/* Feedback Overlay */}
                  <AnimatePresence>
                    {(hasAnswered || answerLocked) && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className={`absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm`}
                      >
                        {isMatch ? (
                          <div className="bg-white p-6 rounded-full shadow-2xl border-8 border-accent-green"><CheckCircle2 size={60} className="text-accent-green" /></div>
                        ) : (
                          <div className="bg-white p-6 rounded-full shadow-2xl border-8 border-red-500"><XCircle size={60} className="text-red-500" /></div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-dark-card p-4 rounded-[24px] border-4 border-beige-300 shadow-xl shrink-0 h-[100px] flex items-center">
                  <div className="flex items-center justify-center gap-6 w-full px-4">
                    <span className="text-6xl font-black text-white">{detectedLetter || "-"}</span>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="flex justify-between items-center"><span className="text-white/40 font-black text-[9px] uppercase tracking-widest">Confidence</span><span className="text-white font-black text-xs">{isNaN(confidence) ? 0 : confidence}%</span></div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <motion.div animate={{ width: `${isNaN(confidence) ? 0 : confidence}%` }} className={`h-full ${confidence >= 60 ? 'bg-accent-green' : 'bg-white/20'}`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quit Confirmation Modal */}
      <AnimatePresence>
        {showEndConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEndConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white p-8 rounded-[32px] border-4 border-beige-300 shadow-2xl max-w-md w-full text-center"
            >
              <h3 className="text-2xl font-black text-dark-text mb-2">End quiz?</h3>
              <p className="text-dark-muted font-bold mb-8">Are you sure you want to quit? Your current progress will be lost.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowEndConfirm(false)} className="flex-1 py-4 bg-accent-green text-white font-black rounded-2xl shadow-lg hover:scale-105 transition-all">Continue Quiz</button>
                <button onClick={handleQuit} className="flex-1 py-4 bg-white border-4 border-red-500 text-red-500 font-black rounded-2xl hover:bg-red-50 transition-all">End Quiz</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            className={`fixed bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl border-4 z-[150] flex items-center gap-3 font-black text-lg bg-white ${
              toast.type === 'success' ? 'border-accent-green text-accent-green' : toast.type === 'info' ? 'border-blue-500 text-blue-500' : 'border-red-500 text-red-500'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 /> : toast.type === 'info' ? <Info /> : <XCircle />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
