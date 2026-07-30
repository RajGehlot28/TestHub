import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { Timer } from '../components/Timer.jsx';
import { AccessDeniedModal } from '../components/AccessDeniedModal.jsx';
import {
  Clock, AlertCircle, ArrowLeft, ArrowRight, CheckCircle2,
  HelpCircle, Send, Play, Building2
} from 'lucide-react';

export const StudentTestRunner = () => {
  const { testCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Test session state
  const [accessState, setAccessState] = useState('loading');
  const [deniedDetails, setDeniedDetails] = useState({ teacherInstitute: '', studentInstitute: '' });
  const [existingResultId, setExistingResultId] = useState(null);

  const [testInfo, setTestInfo] = useState(null);
  const [timingStatus, setTimingStatus] = useState('active');

  // Active Runner State
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [startedAtTime, setStartedAtTime] = useState(null);

  // Submit Modal & Submitting State
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Proctoring 3-Strike Warning State
  const [warningCount, setWarningCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [latestViolationReason, setLatestViolationReason] = useState('');

  useEffect(() => {
    if (testCode) {
      verifySession();
    }
  }, [testCode]);

  const registerViolation = (reason) => {
    if (isSubmitting || !isTestStarted) return;

    setWarningCount(prev => {
      const nextCount = prev + 1;
      if (nextCount >= 3) {
        // Strike 3: Terminate & Submit immediately with current choices
        alert(`🔴 PROCTORING TERMINATION: Maximum warning limit reached (${nextCount}/3) due to: ${reason}.\nYour assessment is being automatically submitted now.`);
        handleSubmitTest();
        return nextCount;
      } else {
        // Strike 1 or 2: Display Warning Modal
        setLatestViolationReason(reason);
        setShowWarningModal(true);
        return nextCount;
      }
    });
  };

  useEffect(() => {
    if (!isTestStarted || isSubmitting) return;

    const handleFullscreenExit = () => {
      if (!document.fullscreenElement) {
        registerViolation('Exiting Fullscreen Mode / Pressing Esc');
      }
    };

    const handleVisibilityOrBlur = () => {
      if (document.hidden || !document.hasFocus()) {
        registerViolation('Switching tabs, pressing Windows/Alt+Tab key, or losing window focus');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenExit);
    document.addEventListener('visibilitychange', handleVisibilityOrBlur);
    window.addEventListener('blur', handleVisibilityOrBlur);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenExit);
      document.removeEventListener('visibilitychange', handleVisibilityOrBlur);
      window.removeEventListener('blur', handleVisibilityOrBlur);
    };
  }, [isTestStarted, isSubmitting]);

  const verifySession = async () => {
    setAccessState('loading');
    try {
      const res = await api.get(`/tests/${testCode}/verify`);
      
      if (res.data.alreadySubmitted) {
        setAccessState('already_submitted');
        setExistingResultId(res.data.existingResultId);
        return;
      }

      setTestInfo(res.data.test);
      setTimingStatus(res.data.timingStatus);
      setAccessState('allowed');
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessState('denied');
        setDeniedDetails({
          teacherInstitute: err.response.data.teacherInstitute || 'Specific Institution',
          studentInstitute: err.response.data.studentInstitute || 'No Institute Assigned'
        });
      } else {
        console.error('Session verification error:', err);
      }
    }
  };

  const handleStartTestSession = async () => {
    try {
      const res = await api.post(`/tests/${testCode}/start`);
      setTestInfo(res.data.test);
      setStartedAtTime(new Date());
      setIsTestStarted(true);

      // Enter Fullscreen Lock
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to start test session.');
    }
  };

  const handleResumeFromWarning = () => {
    setShowWarningModal(false);
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const handleOptionSelect = (questionId, optionId) => {
    setStudentAnswers(prev => {
      const updated = { ...prev, [questionId]: optionId };
      // Save choice to Redis temporary session
      api.put(`/tests/${testCode}/draft`, { questionId, selectedOption: optionId, answers: updated }).catch(() => {});
      return updated;
    });
  };

  const handleSubmitTest = async () => {
    if (isSubmitting || !testInfo) return;
    setIsSubmitting(true);

    const now = new Date();
    const startTime = startedAtTime || now;
    const timeTakenSeconds = Math.round((now.getTime() - startTime.getTime()) / 1000);

    try {
      const res = await api.post(`/tests/${testCode}/submit`, {
        answers: studentAnswers,
        startedAt: startTime.toISOString(),
        timeTaken: timeTakenSeconds
      });

      // Exit fullscreen on submit
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }

      // Redirect immediately to result breakdown
      navigate(`/student/results/${res.data.resultId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting test.');
      setIsSubmitting(false);
    }
  };

  // --- RENDER ACCESS DENIED SCREEN ---
  if (accessState === 'denied') {
    return (
      <AccessDeniedModal
        teacherInstitute={deniedDetails.teacherInstitute}
        studentInstitute={deniedDetails.studentInstitute}
        testName={testInfo?.testName}
      />
    );
  }

  // --- RENDER ALREADY SUBMITTED SCREEN ---
  if (accessState === 'already_submitted') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-md text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Assessment Already Completed</h2>
          <p className="text-xs text-slate-500">
            You have already submitted answers for this test. You can view your score breakdown below.
          </p>
          <button
            onClick={() => navigate(`/student/results/${existingResultId}`)}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
          >
            View My Test Result & Answers
          </button>
        </div>
      </div>
    );
  }

  if (accessState === 'loading' || !testInfo) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-500 text-sm font-medium">
        Verifying Institute Access & Session Window...
      </div>
    );
  }

  // --- PRE-START LANDING CARD ---
  if (!isTestStarted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md space-y-6">
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Assessment Ready
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-3">{testInfo.testName}</h1>
            <p className="text-xs text-slate-500 mt-1">Instructor: {testInfo.teacherName}</p>
          </div>

          {/* Test Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">Total Questions</span>
              <span className="font-bold text-slate-900">{testInfo.totalQuestions} Questions</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Maximum Marks</span>
              <span className="font-bold text-slate-900">{testInfo.maxMarks} Marks</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Duration</span>
              <span className="font-bold text-indigo-700">{testInfo.duration} Minutes</span>
            </div>
          </div>

          {/* Scope Indicator */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs">
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-slate-500">Institute Access:</span>
            <span className="font-bold text-slate-900">{testInfo.instituteName || 'Open Assessment'}</span>
          </div>

          {/* Timing Window Check Display */}
          {timingStatus === 'not_started' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center space-y-1">
              <Clock className="w-5 h-5 mx-auto mb-1 text-amber-600" />
              <div className="font-bold">Test hasn't started yet</div>
              <div>Available from {new Date(testInfo.startTime).toLocaleTimeString()} to {new Date(testInfo.endTime).toLocaleTimeString()}</div>
            </div>
          )}

          {timingStatus === 'expired' && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center space-y-1">
              <AlertCircle className="w-5 h-5 mx-auto mb-1 text-rose-600" />
              <div className="font-bold">Test Window Has Expired</div>
              <div>Submissions are no longer accepted for this exam session.</div>
            </div>
          )}

          {/* Beginner-style Exam Proctoring NOTE Box */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5 shadow-sm">
            <div className="font-extrabold flex items-center gap-1.5 text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>📝 NOTE FOR STUDENTS (IMPORTANT EXAM RULES):</span>
            </div>
            <p className="leading-relaxed">
              1. Please do <strong>NOT</strong> press the <strong>Windows key</strong>, <strong>Alt+Tab</strong>, or <strong>Esc key</strong> during the test.
            </p>
            <p className="leading-relaxed">
              2. You are allowed a maximum of <strong>2 warnings</strong> for shortcut keys or tab switching.
            </p>
            <p className="leading-relaxed text-rose-800 font-semibold">
              3. On the 3rd key press or tab switch, your test will end automatically and submit your selected answers.
            </p>
          </div>

          {/* Start Test Button */}
          <button
            onClick={handleStartTestSession}
            disabled={timingStatus !== 'active'}
            className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Start Test Now</span>
          </button>
        </div>
      </div>
    );
  }

  // --- LIVE TEST RUNNER INTERFACE ---
  const questions = testInfo.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQs = questions.length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Strict Proctoring Header Banner */}
      <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 font-semibold shadow-sm">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>📝 <strong>NOTE:</strong> Do NOT press the Windows key, Alt+Tab, or Esc key during the test. On the 3rd key press or tab switch, your test will end automatically.</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 bg-white px-3 py-1 rounded-xl border border-amber-300 shadow-sm text-xs">
          <span className="text-slate-600 font-medium">Warnings Used:</span>
          <span className={`font-extrabold ${warningCount === 0 ? 'text-emerald-600' : warningCount === 1 ? 'text-amber-600' : 'text-rose-600'}`}>
            {warningCount} / 2 Allowed
          </span>
        </div>
      </div>

      {/* Top Runner Header */}
      <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4 sticky top-18 z-30 shadow-sm">
        <div>
          <h1 className="text-base font-extrabold text-slate-900 truncate max-w-md">{testInfo.testName}</h1>
          <span className="text-[11px] text-slate-500">
            Question {currentQuestionIndex + 1} of {totalQs}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Timer durationMinutes={testInfo.duration} onExpire={handleSubmitTest} />
          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            Submit Test
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Question Area, Right Palette */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Question Display */}
        <div className="lg:col-span-3 bg-white p-8 rounded-2xl border border-slate-200 flex flex-col justify-between min-h-[480px] shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pb-3 border-b border-slate-200">
              <span className="font-bold text-indigo-700 uppercase tracking-wider">
                Question #{currentQuestion?.questionNumber}
              </span>
              <span>{currentQuestion?.marks || 1} Mark(s)</span>
            </div>

            {/* Question Text */}
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-6 leading-relaxed">
              {currentQuestion?.questionText}
            </h2>

            {/* Radio Options */}
            <div className="space-y-3">
              {currentQuestion?.options.map((opt) => {
                const isSelected = studentAnswers[currentQuestion.questionId] === opt.optionId;
                return (
                  <button
                    key={opt.optionId}
                    type="button"
                    onClick={() => handleOptionSelect(currentQuestion.questionId, opt.optionId)}
                    className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-600 text-slate-900 font-semibold shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                      isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-600'
                    }`}>
                      {opt.optionId}
                    </div>
                    <span className="text-sm font-medium">{opt.optionText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-8">
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentQuestionIndex < totalQs - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQs - 1, prev + 1))}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>Submit Final Test</span>
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Question Navigation Box / Palette */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 h-fit space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Question Navigation Palette</h3>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = !!studentAnswers[q.questionId];
              const isCurrent = idx === currentQuestionIndex;

              let btnStyle = 'bg-amber-50 border-amber-300 text-amber-800'; // Yellow = Unanswered
              if (isAnswered) {
                btnStyle = 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'; // Green = Answered
              }

              return (
                <button
                  key={q.questionId}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`h-10 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all ${btnStyle} ${
                    isCurrent ? 'ring-2 ring-indigo-600 ring-offset-2 ring-offset-white scale-105' : ''
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 space-y-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-500"></span>
              <span>Green = Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-500"></span>
              <span>Yellow = Skipped / Unanswered</span>
            </div>
          </div>

          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors mt-4"
          >
            Submit Assessment
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4 text-center">
            <HelpCircle className="w-12 h-12 text-indigo-600 mx-auto" />
            <h2 className="text-xl font-extrabold text-slate-900">Submit Assessment?</h2>
            <p className="text-xs text-slate-600">
              You have answered <span className="font-bold text-slate-900">{Object.keys(studentAnswers).length}</span> out of <span className="font-bold text-slate-900">{totalQs}</span> questions.
              Are you sure you want to finalize your submission?
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors"
              >
                Cancel & Resume
              </button>
              <button
                onClick={handleSubmitTest}
                disabled={isSubmitting}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Grading...' : 'Yes, Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-Strike Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-rose-200 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Proctoring Warning ({warningCount}/2 Used)</h2>
            <p className="text-xs text-slate-600">
              <strong className="text-rose-600">Violation Detected:</strong> {latestViolationReason}
            </p>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-semibold">
              ⚠️ Warning: You have {3 - warningCount} attempt(s) remaining. On the 3rd violation, your test will be automatically terminated and submitted with your current selected choices.
            </div>
            <button
              onClick={handleResumeFromWarning}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Re-enter Fullscreen & Continue Test
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
