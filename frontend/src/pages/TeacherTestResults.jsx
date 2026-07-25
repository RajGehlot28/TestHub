import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import {
  ArrowLeft, Download, CheckCircle2, XCircle
} from 'lucide-react';

export const TeacherTestResults = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Expand Modal / Answers inspector state
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    fetchTestResults();
  }, [testId]);

  const fetchTestResults = async () => {
    try {
      const res = await api.get(`/teacher/tests/${testId}/results`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load test analytics.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data || data.submissions.length === 0) return;

    const headers = ['Student Name', 'Email', 'Roll No', 'Institute', 'Marks Obtained', 'Max Marks', 'Percentage %', 'Submission Time'];
    const rows = data.submissions.map(s => [
      `"${s.studentName}"`,
      `"${s.studentEmail}"`,
      `"${s.studentRollNo}"`,
      `"${s.instituteName || 'Independent'}"`,
      s.totalMarksObtained,
      s.maxMarks,
      `${s.percentage}%`,
      `"${new Date(s.submittedAt).toLocaleString()}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${data.test.testCode}_Results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-500 text-sm font-medium">
        Loading Detailed Analytics...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-rose-600 text-sm">
        {error || 'Test results not found.'}
      </div>
    );
  }

  const { test, metrics, submissions } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900">{test.testName}</h1>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
            <span>Code: <code className="text-indigo-600 font-mono font-bold">{test.testCode}</code></span>
            <span>•</span>
            <span>Institute Scope: <strong className="text-slate-800">{test.instituteName || 'Open Assessment'}</strong></span>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold mb-1">Total Submissions</div>
          <div className="text-2xl font-extrabold text-slate-900">{metrics.totalSubmissions}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold mb-1">Average Percentage</div>
          <div className="text-2xl font-extrabold text-indigo-600">{metrics.averageScorePercentage}%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold mb-1">Highest Marks</div>
          <div className="text-2xl font-extrabold text-emerald-600">{metrics.highestScore} / {test.maxMarks}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold mb-1">Lowest Marks</div>
          <div className="text-2xl font-extrabold text-amber-600">{metrics.lowestScore} / {test.maxMarks}</div>
        </div>
      </div>

      {/* Student Submissions Roster */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Student Scores Roster</h2>

        {submissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Institute</th>
                  <th className="py-3 px-4">Marks</th>
                  <th className="py-3 px-4">Percentage %</th>
                  <th className="py-3 px-4">Submission Date</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {submissions.map((s) => (
                  <tr key={s.resultId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{s.studentName}</td>
                    <td className="py-3.5 px-4 font-mono">{s.studentRollNo}</td>
                    <td className="py-3.5 px-4">{s.instituteName || 'Independent'}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">{s.totalMarksObtained} / {s.maxMarks}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        s.percentage >= 75 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        s.percentage >= 50 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {s.percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{new Date(s.submittedAt).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedSubmission(s)}
                        className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-semibold"
                      >
                        Inspect Answers
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs">
            No student submissions recorded for this test yet.
          </div>
        )}
      </div>

      {/* Answer Inspection Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedSubmission.studentName}'s Answers</h3>
                <p className="text-xs text-slate-500">Roll No: {selectedSubmission.studentRollNo} • Score: {selectedSubmission.totalMarksObtained}/{selectedSubmission.maxMarks} ({selectedSubmission.percentage}%)</p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Close ✕
              </button>
            </div>

            <div className="space-y-4 pt-2">
              {test.questions.map((q, idx) => {
                const studentAns = (q.questionId && selectedSubmission.answers[q.questionId] !== undefined)
                  ? selectedSubmission.answers[q.questionId]
                  : (selectedSubmission.answers[q.questionNumber.toString()] || null);
                const isCorrect = studentAns === q.correctAnswer;

                return (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="font-bold text-slate-900 flex items-start justify-between gap-2">
                      <span>Q{idx + 1}. {q.questionText}</span>
                      {isCorrect ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-4 h-4" /> Correct
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center gap-1 shrink-0">
                          <XCircle className="w-4 h-4" /> Incorrect
                        </span>
                      )}
                    </div>
                    <div className="text-slate-600">
                      Student Selected: <span className="font-bold text-slate-900">{studentAns || 'Skipped'}</span> | Correct Answer: <span className="font-bold text-emerald-700">{q.correctAnswer}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
