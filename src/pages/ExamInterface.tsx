import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../contexts/ExamContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  ShieldAlert, Maximize2, Minimize2, ChevronLeft, 
  ChevronRight, Save, Bookmark, AlertCircle, FileText, CheckCircle2
} from 'lucide-react';

export const ExamInterface: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const {
    activeExam,
    currentQuestionIndex,
    answers,
    markedForReview,
    timeRemaining,
    isSaving,
    isExamActive,
    isFullscreen,
    saveAnswer,
    toggleMarkForReview,
    nextQuestion,
    prevQuestion,
    jumpToQuestion,
    submitExam,
    cancelExam,
    toggleFullscreen,
    startExam
  } = useExam();

  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Proctor extension states
  const [localWarningCount, setLocalWarningCount] = useState<number>((activeExam as any)?.warningCount || 0);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>((activeExam as any)?.attemptStatus === 'LOCKED');
  const [isReady, setIsReady] = useState<boolean>(false);
  const [loadingExam, setLoadingExam] = useState<boolean>(!activeExam && !!examId);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Auto-fetch exam if activeExam is not in memory (e.g. reload or direct link)
  useEffect(() => {
    if (!activeExam && examId) {
      let isMounted = true;
      setLoadingExam(true);
      setFetchError(null);

      api.get(`/student/exams/${examId}`)
        .then((res) => {
          if (!isMounted) return;
          if (res.data) {
            startExam(res.data);
            if (res.data.attemptStatus === 'LOCKED') {
              setIsLocked(true);
            }
            if (typeof res.data.warningCount === 'number') {
              setLocalWarningCount(res.data.warningCount);
            }
            setLoadingExam(false);
          } else {
            setFetchError('Examination could not be found.');
            setLoadingExam(false);
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          console.error('Failed to load exam:', err);
          const msg = err.response?.data?.message || 'Failed to load examination. Please return to the dashboard.';
          setFetchError(msg);
          setLoadingExam(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [examId, activeExam]);

  // Sync warning and lock status when activeExam changes
  useEffect(() => {
    if (activeExam) {
      if ((activeExam as any).attemptStatus === 'LOCKED') {
        setIsLocked(true);
      }
      if (typeof (activeExam as any).warningCount === 'number') {
        setLocalWarningCount((activeExam as any).warningCount);
      }
    }
  }, [activeExam]);

  // Initialize a brief ready timer to avoid false positives during initial fullscreen request
  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 2500);
    return () => clearTimeout(t);
  }, []);

  // Proctor lock checks: detect if user minimizes screen or escapes full screen
  useEffect(() => {
    if (!isExamActive && !loadingExam && !activeExam && !examId) {
      navigate('/student/dashboard');
    }
  }, [isExamActive, loadingExam, activeExam, examId]);

  // Tab switch, minimize, blur detector
  useEffect(() => {
    if (!activeExam || isLocked || !isReady || !isExamActive) return;

    const handleFocusLoss = async () => {
      if (showWarningModal || isLocked) return;

      const nextWarning = localWarningCount + 1;
      setLocalWarningCount(nextWarning);

      if (nextWarning === 1) {
        setShowWarningModal(true);
        try {
          await api.post(`/student/exams/${activeExam.id}/proctor-event`, {
            eventType: 'tab_switch',
            warningCount: 1
          });
        } catch (err) {
          console.error('Failed sending blur log:', err);
        }
      } else if (nextWarning === 2) {
        setShowWarningModal(true);
        try {
          await api.post(`/student/exams/${activeExam.id}/proctor-event`, {
            eventType: 'tab_switch',
            warningCount: 2
          });
        } catch (err) {
          console.error('Failed sending blur log:', err);
        }
      } else if (nextWarning >= 3) {
        setIsLocked(true);
        setShowWarningModal(false);
        try {
          await api.post(`/student/exams/${activeExam.id}/proctor-event`, {
            eventType: 'tab_switch',
            warningCount: 3
          });
          showToast('Examination closed and locked due to 3 malpractice warnings.', 'error');
        } catch (err) {
          console.error('Failed locking exam:', err);
        }
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        handleFocusLoss();
      }
    };

    const handleWindowBlur = () => {
      handleFocusLoss();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [localWarningCount, showWarningModal, isLocked, activeExam, isReady, isExamActive]);

  // Hardened Anti-Copy, Anti-Paste, Anti-Extension, and Anti-Cheating Security System
  useEffect(() => {
    if (!isExamActive || isLocked) return;

    // 1. Dynamic Enforcer Stylesheet to override any extension-injected CSS
    const styleId = 'anti-copy-enforcer-guard';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      styleTag.innerHTML = `
        *, html, body, .exam-layout, .exam-layout * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          -webkit-user-drag: none !important;
        }
        .text-answer-area {
          -webkit-user-select: text !important;
          user-select: text !important;
        }
        ::selection {
          background: transparent !important;
          color: inherit !important;
        }
        ::-moz-selection {
          background: transparent !important;
          color: inherit !important;
        }
      `;
      document.head.appendChild(styleTag);
    }

    // Keep the style tag at the end of head if extensions try to prepend/append their own styles
    const headObserver = new MutationObserver(() => {
      const current = document.getElementById(styleId);
      if (!current) {
        if (styleTag) document.head.appendChild(styleTag);
      } else if (document.head.lastElementChild !== current) {
        document.head.appendChild(current);
      }
    });
    headObserver.observe(document.head, { childList: true });

    // 2. Intercept selection APIs to defeat extensions that scrape window.getSelection()
    const origWindowGetSelection = window.getSelection;
    const origDocGetSelection = document.getSelection;

    const dummySelection: any = {
      anchorNode: null,
      anchorOffset: 0,
      focusNode: null,
      focusOffset: 0,
      isCollapsed: true,
      rangeCount: 0,
      type: 'None',
      toString: () => '',
      removeAllRanges: () => {},
      addRange: () => {},
      getRangeAt: () => null,
      empty: () => {}
    };

    window.getSelection = () => dummySelection;
    document.getSelection = () => dummySelection;

    // 3. Continuous selection clearing
    const handleSelectionClear = () => {
      try {
        if (origWindowGetSelection) {
          const s = origWindowGetSelection.call(window);
          if (s && s.rangeCount > 0) s.removeAllRanges();
        }
      } catch (err) {}
    };

    // 4. Overwrite Clipboard API so extensions calling writeText/write/readText fail
    const origClipboard = navigator.clipboard;
    if (origClipboard) {
      try {
        const blockClipboardCall = async () => {
          throw new Error('Clipboard operations are strictly restricted during the examination.');
        };
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            ...origClipboard,
            writeText: blockClipboardCall,
            write: blockClipboardCall,
            readText: blockClipboardCall,
            read: blockClipboardCall
          },
          configurable: true,
          writable: true
        });
      } catch (e) {
        try {
          (origClipboard as any).writeText = async () => { throw new Error('Blocked'); };
          (origClipboard as any).write = async () => { throw new Error('Blocked'); };
          (origClipboard as any).readText = async () => { throw new Error('Blocked'); };
          (origClipboard as any).read = async () => { throw new Error('Blocked'); };
        } catch (e2) {}
      }
    }

    // 5. Overwrite document.execCommand
    const origExecCommand = document.execCommand;
    try {
      document.execCommand = function (commandId: string, showUI?: boolean, value?: string) {
        const cmd = String(commandId || '').toLowerCase();
        if (['copy', 'cut', 'paste', 'selectall'].includes(cmd)) {
          return false;
        }
        return (origExecCommand as any).apply(this, [commandId, showUI, value]);
      };
    } catch (e) {}

    // 6. Universal clipboard & mouse event blocker
    const blockEvent = (e: any, message?: string) => {
      if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

        if (e.clipboardData) {
          try {
            e.clipboardData.clearData?.();
            e.clipboardData.setData?.('text/plain', '');
            e.clipboardData.setData?.('text/html', '');
          } catch (err) {}
        }
      }

      if (message) {
        showToast(message, 'warning');
      }
      return false;
    };

    const handleCopyCut = (e: any) => {
      blockEvent(e, 'Copying is strictly prohibited during the examination.');
    };

    const handlePaste = (e: any) => {
      blockEvent(e, 'Pasting is strictly prohibited during the examination.');
    };

    const handleContextMenu = (e: any) => {
      blockEvent(e, 'Right-click context menu is disabled during the examination.');
    };

    const handleDragDrop = (e: any) => {
      blockEvent(e);
    };

    const handleSelectStart = (e: any) => {
      blockEvent(e);
    };

    // 7. Comprehensive Keyboard shortcuts guard
    const handleKeyDown = async (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey; // Windows/Linux Ctrl or Mac Command
      const key = e.key.toLowerCase();

      // Forbidden shortcuts with Ctrl/Command:
      // c (copy), v (paste), x (cut), a (select all), s (save page), p (print), u (view source), insert (Ctrl+Insert = copy)
      const forbiddenCtrlKeys = ['c', 'v', 'x', 'a', 's', 'p', 'u', 'insert'];
      const isForbiddenShortcut = isModifier && forbiddenCtrlKeys.includes(key);

      // Shift+Insert = paste
      const isShiftInsert = e.shiftKey && key === 'insert';

      // PrintScreen / Screenshot key
      const isPrintScreen = key === 'printscreen';

      // DevTools
      const isF12 = key === 'f12';
      const isDevCombo = isModifier && e.shiftKey && ['i', 'j', 'c'].includes(key);

      if (isForbiddenShortcut || isShiftInsert || isPrintScreen) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showToast('Keyboard shortcut / clipboard action is disabled during the exam.', 'warning');
      } else if (isF12 || isDevCombo) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showToast('Developer tools are strictly disabled during the examination.', 'error');

        try {
          await api.post(`/student/exams/${activeExam?.id}/proctor-event`, {
            eventType: 'dev_tools',
            warningCount: localWarningCount
          });
        } catch (err) {
          console.error('Failed to log devtools block:', err);
        }
      }
    };

    // 8. Register on DOM Level 0 properties (defeats extensions clearing listeners)
    document.oncopy = handleCopyCut;
    document.oncut = handleCopyCut;
    document.onpaste = handlePaste;
    document.oncontextmenu = handleContextMenu;
    document.onselectstart = handleSelectStart;
    document.ondragstart = handleDragDrop;

    window.oncopy = handleCopyCut;
    window.oncut = handleCopyCut;
    window.onpaste = handlePaste;
    window.oncontextmenu = handleContextMenu;

    // 9. Register event listeners in CAPTURE phase ({ capture: true, passive: false })
    // Capturing phase ensures our handler runs BEFORE any extension's bubbling listener
    const options = { capture: true, passive: false };

    const addCapturingListener = (target: any, evtName: string, handler: any) => {
      if (target && typeof target.addEventListener === 'function') {
        target.addEventListener(evtName, handler, options);
      }
    };

    const removeCapturingListener = (target: any, evtName: string, handler: any) => {
      if (target && typeof target.removeEventListener === 'function') {
        target.removeEventListener(evtName, handler, options);
      }
    };

    const monitoredEvents: [string, any][] = [
      ['contextmenu', handleContextMenu],
      ['copy', handleCopyCut],
      ['cut', handleCopyCut],
      ['paste', handlePaste],
      ['beforecopy', handleCopyCut],
      ['beforecut', handleCopyCut],
      ['beforepaste', handlePaste],
      ['selectstart', handleSelectStart],
      ['selectionchange', handleSelectionClear],
      ['keydown', handleKeyDown],
      ['dragstart', handleDragDrop],
      ['drop', handleDragDrop]
    ];

    monitoredEvents.forEach(([evt, handler]) => {
      addCapturingListener(window, evt, handler);
      addCapturingListener(document, evt, handler);
      if (document.body) {
        addCapturingListener(document.body, evt, handler);
      }
    });

    return () => {
      headObserver.disconnect();
      const el = document.getElementById(styleId);
      if (el) el.remove();

      window.getSelection = origWindowGetSelection;
      document.getSelection = origDocGetSelection;

      if (origClipboard) {
        try {
          Object.defineProperty(navigator, 'clipboard', {
            value: origClipboard,
            configurable: true,
            writable: true
          });
        } catch (e) {}
      }

      document.execCommand = origExecCommand;

      document.oncopy = null;
      document.oncut = null;
      document.onpaste = null;
      document.oncontextmenu = null;
      document.onselectstart = null;
      document.ondragstart = null;

      window.oncopy = null;
      window.oncut = null;
      window.onpaste = null;
      window.oncontextmenu = null;

      monitoredEvents.forEach(([evt, handler]) => {
        removeCapturingListener(window, evt, handler);
        removeCapturingListener(document, evt, handler);
        if (document.body) {
          removeCapturingListener(document.body, evt, handler);
        }
      });
    };
  }, [isExamActive, isLocked, activeExam, localWarningCount]);

  // Format countdown clock
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading Screen
  if (loadingExam) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#0f172a',
        color: '#ffffff',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255,255,255,0.15)',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '20px'
        }}></div>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>Initializing Secure Assessment Portal</h3>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>Verifying candidate registration and loading examination session...</p>
      </div>
    );
  }

  // Error Screen
  if (fetchError || (!activeExam && !loadingExam)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#0f172a',
        color: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: '#1e293b',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
          maxWidth: '500px',
          border: '1px solid rgba(239,68,68,0.3)'
        }}>
          <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#f87171', marginBottom: '12px' }}>Examination Unavailable</h3>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '24px' }}>
            {fetchError || 'Unable to load examination session. The exam may not be active or you may not be enrolled.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/student/dashboard')}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Lockscreen Renderer
  if (isLocked) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#0f172a',
        color: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: '#1e293b',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
          maxWidth: '500px',
          border: '1px solid #ef4444'
        }}>
          <ShieldAlert size={64} style={{ color: '#ef4444', marginBottom: '24px', marginLeft: 'auto', marginRight: 'auto' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', color: '#f87171' }}>Examination Locked</h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '32px' }}>
            Your examination has been locked due to multiple tab switches.
            Only the Administrator can unlock your examination.
            Please contact your examination administrator.
          </p>
          <button
            className="btn"
            onClick={() => navigate('/student/dashboard')}
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Exit Workspace
          </button>
        </div>
      </div>
    );
  }

  // Empty questions screen
  if (!activeExam?.questions || activeExam.questions.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#0f172a',
        color: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: '#1e293b',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
          maxWidth: '520px',
          border: '1px solid rgba(245,158,11,0.3)'
        }}>
          <AlertCircle size={48} style={{ color: '#f59e0b', marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fbbf24', marginBottom: '12px' }}>No Questions Configured</h3>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '24px' }}>
            This examination ({activeExam?.title}) does not have any questions assigned to it yet. Please contact your instructor or examination administrator.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              cancelExam();
              navigate('/student/dashboard');
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = activeExam.questions[currentQuestionIndex] || activeExam.questions[0];
  const totalQuestions = activeExam.questions.length;
  
  // Calculate answered count
  const answeredCount = Object.keys(answers).filter(key => {
    const ans = answers[key];
    if (ans === undefined || ans === '') return false;
    if (Array.isArray(ans) && ans.length === 0) return false;
    return true;
  }).length;

  const remainingCount = totalQuestions - answeredCount;

  // Handle MCQ selection
  const handleOptionSelect = (optionIdx: number) => {
    if (!currentQuestion?.id) return;
    saveAnswer(currentQuestion.id, String(optionIdx));
  };

  // Handle Checkbox toggles
  const handleCheckboxToggle = (optionIdx: number) => {
    if (!currentQuestion?.id) return;
    const currentAns = (answers[currentQuestion.id] as string[]) || [];
    let updatedAns: string[];
    
    if (currentAns.includes(String(optionIdx))) {
      updatedAns = currentAns.filter(val => val !== String(optionIdx));
    } else {
      updatedAns = [...currentAns, String(optionIdx)];
    }
    
    saveAnswer(currentQuestion.id, updatedAns);
  };

  // Handle Text Description typing
  const handleTextChange = (textVal: string) => {
    if (!currentQuestion?.id) return;
    saveAnswer(currentQuestion.id, textVal);
  };

  // Submit trigger
  const handleSubmitExamClick = async () => {
    setSubmitting(true);
    try {
      const totalTime = activeExam.duration * 60;
      const timeTaken = totalTime - timeRemaining;
      const resObj = await submitExam(timeTaken);
      navigate(`/student/results/${resObj.id}`);
    } catch (err) {
      // Specific error toast is dispatched by submitExam in ExamContext
    } finally {
      setSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  // Time warning thresholds
  const isTimeWarning = timeRemaining < 300; // 5 minutes

  const stripQuestionPrefix = (text: string) => {
    if (!text) return '';
    return text.replace(/^(?:q(?:uestion)?\s*\d+[\s.:)\-–—]+|\d+\s*[\.\)]\s+)/i, '').trim();
  };

  const renderQuestionContent = (content: string, isQuestionText = false) => {
    if (!content) return null;
    let cleanStr = isQuestionText ? stripQuestionPrefix(content) : content;
    cleanStr = cleanStr
      .replace(/\\r\\n/g, '<br/>')
      .replace(/\r\n/g, '<br/>')
      .replace(/\n/g, '<br/>')
      .replace(/â€"/g, '–')
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"');
    
    if (/<[a-z][\s\S]*>/i.test(cleanStr)) {
      return <span dangerouslySetInnerHTML={{ __html: cleanStr }} />;
    }
    return <span>{cleanStr}</span>;
  };


  return (
    <div className="exam-layout" style={{ userSelect: 'none' }}>
      {/* Exam Header */}
      <header className="exam-header">
        <div className="exam-title-section">
          <img src="/logo.jpeg" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '4px' }} />
          <div>
            <h2 className="exam-title-text">{activeExam.title}</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Proctored Evaluation Portal &bull; Candidate: {user?.name}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={toggleFullscreen} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          </button>
          
          <button className="btn btn-danger btn-sm" onClick={() => {
            if (window.confirm('WARNING: Cancelling the exam will discard all answers. Do you wish to continue?')) {
              cancelExam();
              navigate('/student/dashboard');
            }
          }}>
            Discard Exam
          </button>
        </div>
      </header>

      {/* Main examination area */}
      <div className="exam-main">
        {/* Left Panel: Palette navigation */}
        <aside className="exam-left-panel">
          <div className="exam-panel-title">Question Navigator</div>
          <div className="question-palette-grid">
            {activeExam.questions.map((q, idx) => {
              const isActive = idx === currentQuestionIndex;
              const ans = answers[q.id];
              const isAnswered = ans !== undefined && ans !== '' && (!Array.isArray(ans) || ans.length > 0);
              const isMarked = markedForReview.includes(q.id);

              let statusClass = 'unvisited';
              if (isAnswered) statusClass = 'answered';
              else if (isMarked) statusClass = 'marked';

              return (
                <button
                  key={q.id}
                  onClick={() => jumpToQuestion(idx)}
                  className={`palette-btn ${statusClass} ${isActive ? 'active' : ''}`}
                >
                  {(idx + 1).toString().padStart(2, '0')}
                </button>
              );
            })}
          </div>

          <div className="palette-legend">
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: 'var(--success-bg)', borderColor: 'var(--success)' }}></span>
              <span>Answered</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: 'var(--warning-bg)', borderColor: 'var(--warning)' }}></span>
              <span>Marked for Review</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: 'var(--hover)' }}></span>
              <span>Unvisited / Unanswered</span>
            </div>
          </div>
        </aside>

        {/* Center Panel: Current Question */}
        <main className="exam-center-panel">
          <div className="question-card">
            <div className="question-header">
              <span className="question-number-tag">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
              <span className="question-points-tag">{currentQuestion?.points ?? 1} Points &bull; {(currentQuestion?.difficulty || 'medium').toUpperCase()}</span>
            </div>

            <div className="question-text">{renderQuestionContent(currentQuestion?.text || '', true)}</div>

            {/* MCQ Render */}
            {currentQuestion?.type === 'mcq' && (
              <div className="options-list">
                {(currentQuestion?.options || []).map((opt, idx) => {
                  const isSelected = currentQuestion?.id ? answers[currentQuestion.id] === String(idx) : false;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      className={`option-item ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="option-indicator">
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span style={{ fontSize: '15px', color: 'var(--text-main)' }}>{renderQuestionContent(opt)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Checkbox Render */}
            {currentQuestion?.type === 'checkbox' && (
              <div className="options-list">
                {(currentQuestion?.options || []).map((opt, idx) => {
                  const currentAns = currentQuestion?.id ? ((answers[currentQuestion.id] as string[]) || []) : [];
                  const isSelected = currentAns.includes(String(idx));
                  return (
                    <div
                      key={idx}
                      onClick={() => handleCheckboxToggle(idx)}
                      className={`option-item ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="option-indicator" style={{ borderRadius: '4px' }}>
                        {isSelected ? '✓' : ''}
                      </div>
                      <span style={{ fontSize: '15px', color: 'var(--text-main)' }}>{renderQuestionContent(opt)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Text Render */}
            {currentQuestion?.type === 'text' && (
              <div>
                <textarea
                  className="text-answer-area"
                  placeholder="Type your descriptive response here..."
                  value={currentQuestion?.id ? ((answers[currentQuestion.id] as string) || '') : ''}
                  onChange={(e) => handleTextChange(e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    showToast('Pasting is strictly prohibited during the examination.', 'warning');
                  }}
                  onCopy={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    showToast('Copying is strictly prohibited during the examination.', 'warning');
                  }}
                  onCut={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    showToast('Cutting is strictly prohibited during the examination.', 'warning');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  style={{ userSelect: 'text' }}
                />
                <span className="form-helper" style={{ display: 'block', marginTop: '6px' }}>Descriptive answers are fuzzy checked against academic keywords. Ensure all important terms are included.</span>
              </div>
            )}

            <div className="question-actions">
              <button 
                className="btn btn-secondary" 
                disabled={currentQuestionIndex === 0} 
                onClick={prevQuestion}
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <button 
                className="btn btn-secondary" 
                onClick={() => currentQuestion?.id && toggleMarkForReview(currentQuestion.id)}
                style={{
                  borderColor: currentQuestion?.id && markedForReview.includes(currentQuestion.id) ? 'var(--warning)' : 'var(--border)',
                  color: currentQuestion?.id && markedForReview.includes(currentQuestion.id) ? 'var(--warning)' : 'var(--text-main)'
                }}
              >
                <Bookmark size={16} fill={currentQuestion?.id && markedForReview.includes(currentQuestion.id) ? 'var(--warning)' : 'none'} />
                {currentQuestion?.id && markedForReview.includes(currentQuestion.id) ? 'Marked for Review' : 'Mark for Review'}
              </button>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <button className="btn btn-secondary" onClick={nextQuestion}>
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => setShowSubmitConfirm(true)} style={{ backgroundColor: 'var(--success)' }}>
                  Submit Exam
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Right Panel: Proctor Info */}
        <aside className="exam-right-panel">
          <div className="timer-box">
            <span className="timer-label">Time Remaining</span>
            <span className={`timer-clock ${isTimeWarning ? 'warning-time' : ''}`}>
              {formatTimer(timeRemaining)}
            </span>
          </div>

          <div className="progress-stats-box">
            <div className="progress-row">
              <span className="progress-row-label">Total Questions</span>
              <span className="progress-row-val">{totalQuestions}</span>
            </div>
            
            <div className="progress-row">
              <span className="progress-row-label">Answered Questions</span>
              <span className="progress-row-val" style={{ color: 'var(--success)' }}>{answeredCount}</span>
            </div>

            <div className="progress-row">
              <span className="progress-row-label">Remaining Questions</span>
              <span className="progress-row-val" style={{ color: remainingCount > 0 ? 'var(--danger)' : 'var(--text-main)' }}>{remainingCount}</span>
            </div>

            <div className="progress-row">
              <span className="progress-row-label">Marked for Review</span>
              <span className="progress-row-val" style={{ color: 'var(--warning)' }}>{markedForReview.length}</span>
            </div>

            <div className="auto-save-indicator">
              <div className={`auto-save-dot ${isSaving ? 'saving' : ''}`}></div>
              <span>{isSaving ? 'Auto-saving answers...' : 'All answers saved locally'}</span>
            </div>
          </div>

          <div className="exam-submit-box">
            <button className="btn btn-primary" onClick={() => setShowSubmitConfirm(true)} style={{ width: '100%', padding: '12px' }}>
              Final Submit
            </button>
          </div>
        </aside>
      </div>

      {/* SUBMIT CONFIRMATION MODAL */}
      {showSubmitConfirm && (
        <div className="modal-overlay" onClick={() => setShowSubmitConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                Submit Examination Answers?
              </h3>
              <button className="modal-close" onClick={() => setShowSubmitConfirm(false)}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                You are about to submit your examination answers for evaluation. Once submitted, you cannot edit or resume this session.
              </p>
              
              <div style={{
                backgroundColor: 'var(--hover)',
                padding: '16px',
                borderRadius: 'var(--radius)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Answered Questions:</span>
                  <strong>{answeredCount} / {totalQuestions}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: remainingCount > 0 ? 'var(--danger)' : 'var(--text-main)' }}>
                  <span>Unanswered Questions:</span>
                  <strong>{remainingCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)' }}>
                  <span>Marked for Review:</span>
                  <strong>{markedForReview.length}</strong>
                </div>
              </div>

              {remainingCount > 0 && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                  color: 'var(--danger)',
                  fontSize: '12px',
                  fontWeight: 500,
                  backgroundColor: 'var(--danger-bg)',
                  padding: '10px',
                  borderRadius: 'var(--radius)'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>You have left {remainingCount} questions unanswered. We recommend answering all questions.</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSubmitConfirm(false)} disabled={submitting}>
                Go Back to Exam
              </button>
              <button className="btn btn-primary" onClick={handleSubmitExamClick} disabled={submitting} style={{ backgroundColor: 'var(--success)' }}>
                {submitting ? 'Evaluating...' : 'Yes, Submit Exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROCTOR WARNING MODAL */}
      {showWarningModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '480px', border: '1px solid var(--warning)' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)' }}>
                <ShieldAlert size={20} />
                Malpractice Warning ({localWarningCount} of 3)
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-main)' }}>
                You have switched away from the examination window or lost focus.
                <br /><br />
                <strong style={{ color: 'var(--warning)' }}>Warning {localWarningCount} of 3 Issued!</strong>
                <br /><br />
                You are granted up to 3 chances. On your 3rd warning, your examination will automatically be <strong>closed and locked</strong>, requiring official Administrator approval to retake.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => setShowWarningModal(false)}
                style={{ backgroundColor: 'var(--warning)', borderColor: 'var(--warning)' }}
              >
                Return to Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOCKED SCREEN MODAL */}
      {isLocked && (
        <div className="modal-overlay" style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-content" style={{ maxWidth: '520px', border: '2px solid var(--danger)', textAlign: 'center', padding: '32px 24px' }}>
            <ShieldAlert size={56} style={{ color: 'var(--danger)', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--danger)', marginBottom: '12px' }}>
              Examination Terminated & Locked
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
              You have exceeded the maximum limit of <strong>3 malpractice warnings</strong> (tab switching / focus loss).
              <br /><br />
              Your exam has been automatically closed and locked. You must request approval from an <strong>Administrator</strong> before you can retake the exam with a new set of questions.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/student/dashboard')}
              style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
