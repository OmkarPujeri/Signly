import { create } from 'zustand';

export const useQuizStore = create((set) => ({
  score: 0,
  points: 0,
  streak: 0,
  totalAnswered: 0,
  isComplete: false,
  mode: null, // 'visual' | 'camera'
  usedQuestions: [],

  setMode: (mode) => set({ 
    mode, 
    isComplete: false, 
    score: 0, 
    points: 0, 
    streak: 0, 
    totalAnswered: 0, 
    usedQuestions: [] 
  }),
  
  addUsedQuestion: (id) => set((state) => ({
    usedQuestions: [...state.usedQuestions, id]
  })),

  answerQuestion: (isCorrect, pointsEarned = 0) => set((state) => {
    const newStreak = isCorrect ? state.streak + 1 : 0;
    return {
      score: isCorrect ? state.score + 1 : state.score,
      points: state.points + pointsEarned,
      streak: newStreak,
      totalAnswered: state.totalAnswered + 1
    };
  }),
  
  resetQuiz: () => set({ 
    score: 0, 
    points: 0,
    streak: 0, 
    totalAnswered: 0, 
    isComplete: false,
    mode: null,
    usedQuestions: []
  }),

  completeQuiz: () => set({ isComplete: true })
}));
