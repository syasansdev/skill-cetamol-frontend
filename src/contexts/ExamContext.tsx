import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import api from '../services/api';
import { Exam, Question, ExamResult } from '../types';
import { useToast } from './ToastContext';

interface ExamContextType {
  activeExam: Exam | null;
  currentQuestionIndex: number;
  answers: Record<string, string | string[]>;
  markedForReview: string[];
  timeRemaining: number; // in seconds
  isSaving: boolean;
  isExamActive: boolean;
  isFullscreen: boolean;
  startExam: (exam: Exam) => void;
  saveAnswer: (questionId: string, answer: string | string[]) => void;
  toggleMarkForReview: (questionId: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  submitExam: (timeTaken: number) => Promise<ExamResult>;
  cancelExam: () => void;
  toggleFullscreen: () => void;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const useExam = (): ExamContextType => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
};

interface ExamProviderProps {
  children: ReactNode;
}

export const ExamProvider: React.FC<ExamProviderProps> = ({ children }) => {
  const [activeExam, setActiveExam] = useState<Exam | null>(() => {
    try {
      const saved = sessionStorage.getItem('skill_active_exam_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.activeExam || null;
      }
    } catch (e) {}
    return null;
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('skill_active_exam_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return typeof parsed.currentQuestionIndex === 'number' ? parsed.currentQuestionIndex : 0;
      }
    } catch (e) {}
    return 0;
  });

  const [answers, setAnswers] = useState<Record<string, string | string[]>>(() => {
    try {
      const saved = sessionStorage.getItem('skill_active_exam_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.answers || {};
      }
    } catch (e) {}
    return {};
  });

  const [markedForReview, setMarkedForReview] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem('skill_active_exam_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.markedForReview || [];
      }
    } catch (e) {}
    return [];
  });

  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('skill_active_exam_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.timeRemaining === 'number' && parsed.timeRemaining > 0) {
          return parsed.timeRemaining;
        }
      }
    } catch (e) {}
    return 0;
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [isExamActive, setIsExamActive] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem('skill_active_exam_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return !!parsed.isExamActive && !!parsed.activeExam;
      }
    } catch (e) {}
    return false;
  });

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const timerRef = useRef<any>(null);
  const autoSaveTimerRef = useRef<any>(null);
  const { showToast } = useToast();

  const answersRef = useRef<any>(answers);
  const timeRemainingRef = useRef<number>(timeRemaining);

  // Sync state refs on changes
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
    if (activeExam && isExamActive && timeRemaining > 0) {
      try {
        const stored = sessionStorage.getItem('skill_active_exam_session');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.timeRemaining = timeRemaining;
          sessionStorage.setItem('skill_active_exam_session', JSON.stringify(parsed));
        }
      } catch (e) {}
    }
  }, [timeRemaining, activeExam, isExamActive]);

  // Fullscreen state listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Timer countdown hook
  useEffect(() => {
    if (isExamActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            // Handle automatic submit when timer hits 0
            showToast('Time is up! Submitting exam automatically.', 'warning');
            const totalTime = activeExam ? activeExam.duration * 60 : 0;
            submitExam(totalTime);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isExamActive, timeRemaining]);

  // Reusable progress saver
  const saveProgress = async (currentAnswers: Record<string, string | string[]>, remaining: number) => {
    if (!activeExam) return;
    setIsSaving(true);

    if (!navigator.onLine) {
      // Cache locally
      localStorage.setItem(`offline_exam_${activeExam.id}`, JSON.stringify({
        answers: currentAnswers,
        timeRemaining: remaining
      }));
      setIsSaving(false);
      return;
    }

    try {
      await api.post(`/student/exams/${activeExam.id}/auto-save`, {
        answers: currentAnswers,
        timeRemaining: remaining
      });
      localStorage.removeItem(`offline_exam_${activeExam.id}`);
    } catch (err) {
      console.error('Auto-save failed:', err);
      localStorage.setItem(`offline_exam_${activeExam.id}`, JSON.stringify({
        answers: currentAnswers,
        timeRemaining: remaining
      }));
    } finally {
      setIsSaving(false);
    }
  };

  // Reconnection Sync Listener
  useEffect(() => {
    const handleOnline = async () => {
      if (activeExam && isExamActive) {
        const cached = localStorage.getItem(`offline_exam_${activeExam.id}`);
        if (cached) {
          try {
            const { answers: cachedAns, timeRemaining: cachedTime } = JSON.parse(cached);
            await saveProgress(cachedAns, cachedTime);
            showToast('Reconnected! Online answers synced.', 'success');
          } catch (e) {
            console.error('Failed syncing offline cache:', e);
          }
        }
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [activeExam, isExamActive]);

  // Autosave interval timer (every 15 seconds)
  useEffect(() => {
    if (isExamActive && activeExam) {
      autoSaveTimerRef.current = setInterval(() => {
        saveProgress(answersRef.current, timeRemainingRef.current);
      }, 15000);
    }

    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [isExamActive, activeExam]);

  const startExam = (exam: Exam) => {
    const initialAnswers = (exam as any).savedAnswers || {};
    const initialTime = (exam as any).timeRemaining !== undefined ? (exam as any).timeRemaining : (exam.duration || 30) * 60;

    let questions = [...(exam.questions || [])];

    const newActiveExam = {
      ...exam,
      questions
    };

    setActiveExam(newActiveExam);
    setCurrentQuestionIndex(0);
    
    setAnswers(initialAnswers);
    answersRef.current = initialAnswers;
    setMarkedForReview([]);
    setTimeRemaining(initialTime);
    timeRemainingRef.current = initialTime;
    setIsExamActive(true);
    setIsSaving(false);

    try {
      sessionStorage.setItem('skill_active_exam_session', JSON.stringify({
        activeExam: newActiveExam,
        currentQuestionIndex: 0,
        answers: initialAnswers,
        markedForReview: [],
        timeRemaining: initialTime,
        isExamActive: true
      }));
    } catch (e) {}
    
    // Request fullscreen automatically for professional distraction-free UI
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch(() => {
        showToast('Fullscreen mode recommended. Use the button to enable.', 'info');
      });
    }
  };

  const saveAnswer = (questionId: string, answer: string | string[]) => {
    const updatedAnswers = {
      ...answersRef.current,
      [questionId]: answer
    };
    
    setAnswers(updatedAnswers);
    answersRef.current = updatedAnswers; // update ref immediately for sync
    
    // Save immediately after answer selection
    saveProgress(updatedAnswers, timeRemainingRef.current);

    try {
      const stored = sessionStorage.getItem('skill_active_exam_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.answers = updatedAnswers;
        sessionStorage.setItem('skill_active_exam_session', JSON.stringify(parsed));
      }
    } catch (e) {}
  };

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview((prev) => {
      const updated = prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId];
      try {
        const stored = sessionStorage.getItem('skill_active_exam_session');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.markedForReview = updated;
          sessionStorage.setItem('skill_active_exam_session', JSON.stringify(parsed));
        }
      } catch (e) {}
      return updated;
    });
  };

  const updateStoredQuestionIndex = (idx: number) => {
    try {
      const stored = sessionStorage.getItem('skill_active_exam_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.currentQuestionIndex = idx;
        sessionStorage.setItem('skill_active_exam_session', JSON.stringify(parsed));
      }
    } catch (e) {}
  };

  const nextQuestion = () => {
    if (activeExam && currentQuestionIndex < activeExam.questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      updateStoredQuestionIndex(nextIdx);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIdx = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIdx);
      updateStoredQuestionIndex(prevIdx);
    }
  };

  const jumpToQuestion = (index: number) => {
    if (activeExam && index >= 0 && index < activeExam.questions.length) {
      setCurrentQuestionIndex(index);
      updateStoredQuestionIndex(index);
    }
  };

  const submitExam = async (timeTaken: number): Promise<ExamResult> => {
    if (!activeExam) throw new Error('No active exam to submit');

    try {
      setIsExamActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);

      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      const currentAnswers = answersRef.current || answers;
      const response = await api.post(`/student/exams/${activeExam.id}/submit`, {
        answers: currentAnswers,
        timeTaken // in seconds
      });

      showToast('Exam submitted successfully!', 'success');
      setActiveExam(null);
      sessionStorage.removeItem('skill_active_exam_session');
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error submitting exam. Please retry.';
      showToast(msg, 'error');
      setIsExamActive(true); // resume active if fails
      throw error;
    }
  };

  const cancelExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setActiveExam(null);
    setIsExamActive(false);
    sessionStorage.removeItem('skill_active_exam_session');
    showToast('Exam cancelled', 'info');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        showToast('Failed to enter fullscreen mode', 'error');
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <ExamContext.Provider
      value={{
        activeExam,
        currentQuestionIndex,
        answers,
        markedForReview,
        timeRemaining,
        isSaving,
        isExamActive,
        isFullscreen,
        startExam,
        saveAnswer,
        toggleMarkForReview,
        nextQuestion,
        prevQuestion,
        jumpToQuestion,
        submitExam,
        cancelExam,
        toggleFullscreen
      }}
    >
      {children}
    </ExamContext.Provider>
  );
};
