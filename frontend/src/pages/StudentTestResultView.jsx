import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { Award, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

export const StudentTestResultView = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResultBreakdown();
  }, [resultId]);

  const fetchResultBreakdown = async () => {
    try {
      const res = await api.get(`/student/results/${resultId}`);
      setResult(res.data.result);
      setTest(res.data.test);
    } catch (err) {
      console.error('Failed to load result breakdown:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !result || !test) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-500 text-sm font-medium">
        Loading test evaluation report...
      </div>
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/student/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Student Dashboard</span>
      </button>

      {/* Score Summary Card */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
          <Award className="w-4 h-4" />
          <span>Assessment Performance Report</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{test.testName}</h1>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
          <div className="text-center">
            <span className="text-3xl font-black text-slate-900">{result.totalMarksObtained} / {result.maxMarks}</span>
            <span className="block text-[11px] uppercase tracking-wider text-slate-500 mt-1">Marks Obtained</span>
          </div>

          <div className="w-px h-12 bg-slate-200 hidden sm:block"></div>

          <div className="text-center">
            <span className={`text-3xl font-black ${
              result.percentage >= 75 ? 'text-emerald-600' :
              result.percentage >= 50 ? 'text-indigo-600' : 'text-rose-600'
            }`}>
              {result.percentage}%
            </span>
            <span className="block text-[11px] uppercase tracking-wider text-slate-500 mt-1">Percentage Score</span>
          </div>

          <div className="w-px h-12 bg-slate-200 hidden sm:block"></div>

          <div className="text-center">
            <span className="text-2xl font-bold text-slate-800">{formatTime(result.timeTaken)}</span>
            <span className="block text-[11px] uppercase tracking-wider text-slate-500 mt-1">Time Taken</span>
          </div>
        </div>

        {/* Student Metadata Bar */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 flex flex-wrap items-center justify-around gap-3">
          <div>Student: <span className="font-bold text-slate-900">{result.studentName}</span></div>
          <div>Institute: <span className="font-bold text-indigo-700">{result.instituteName || 'Independent'}</span></div>
          <div>Submitted: <span className="text-slate-500">{new Date(result.submittedAt).toLocaleString()}</span></div>
        </div>
      </div>

      {/* Detailed Question Review Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Detailed Question & Answer Review</h2>

        <div className="space-y-4">
          {test.questions.map((q, idx) => {
            const studentAnsObj = result.answers.find(a => a.questionId === q.questionId);
            const isCorrect = studentAnsObj?.isCorrect;
            const chosenOption = studentAnsObj?.studentAnswer;

            return (
              <div key={q.questionId} className={`p-5 rounded-xl border space-y-3 ${
                isCorrect ? 'bg-slate-50 border-emerald-200' : 'bg-slate-50 border-rose-200'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="font-bold text-sm text-slate-900">
                    <span className="text-indigo-600 mr-2">Q{idx + 1}.</span>
                    {q.questionText}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                    isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {isCorrect ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>{isCorrect ? `+${q.marks || 1} Mark` : '0 Marks'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt) => {
                    const isStudentChoice = chosenOption === opt.optionId;
                    const isRightAnswer = q.correctAnswer === opt.optionId;

                    let optionStyle = 'bg-white border-slate-200 text-slate-700';
                    if (isRightAnswer) {
                      optionStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                    } else if (isStudentChoice && !isCorrect) {
                      optionStyle = 'bg-rose-50 border-rose-400 text-rose-900 font-bold';
                    }

                    return (
                      <div key={opt.optionId} className={`p-3 rounded-lg border flex items-center justify-between gap-2 ${optionStyle}`}>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">
                            {opt.optionId}
                          </span>
                          <span>{opt.optionText}</span>
                        </div>

                        {isRightAnswer && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                            Correct Answer
                          </span>
                        )}
                        {isStudentChoice && !isRightAnswer && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded font-semibold">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
