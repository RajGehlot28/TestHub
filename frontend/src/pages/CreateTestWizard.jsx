import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { QRCodeSVG } from 'qrcode.react';
import {
  UploadCloud, BrainCircuit, CheckCircle2, Copy, Check, Clock,
  Building2, ArrowRight, ArrowLeft, FileText, AlertCircle, Sparkles, Share2
} from 'lucide-react';

export const CreateTestWizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Step 1 Form Parameters
  const [testName, setTestName] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [duration, setDuration] = useState(15);
  
  // Date & Time parameters
  const [testDate, setTestDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTimeStr, setStartTimeStr] = useState('08:00');
  const [endTimeStr, setEndTimeStr] = useState('12:00');

  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Generated Content
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [pdfSourceNames, setPdfSourceNames] = useState([]);
  const [createdTestCode, setCreatedTestCode] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles(filesArr);
    }
  };

  const handleGenerateMCQs = async (e) => {
    e.preventDefault();
    setError('');

    if (!testName.trim()) {
      return setError('Please enter a descriptive test title.');
    }

    // Validate Time Window
    const startDateTime = new Date(`${testDate}T${startTimeStr}:00`);
    const endDateTime = new Date(`${testDate}T${endTimeStr}:00`);
    const windowMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);

    if (windowMinutes < duration) {
      return setError(`Schedule constraint failed: The allowed time window (${windowMinutes} mins) must be at least as long as the test duration (${duration} mins).`);
    }

    setIsGenerating(true);
    setStep(2); // Step 2 Loading state

    try {
      const formData = new FormData();
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => formData.append('pdfFiles', file));
      } else {
        formData.append('sampleText', `Sample assessment materials for ${testName}. Topics cover key curriculum concepts, definitions, and problem-solving methodologies.`);
      }

      formData.append('questionCount', questionCount.toString());
      formData.append('marksPerQuestion', marksPerQuestion.toString());

      const res = await api.post('/ai/generate-mcqs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setGeneratedQuestions(res.data.questions || []);
      setPdfSourceNames(res.data.pdfSourceNames || []);
      setStep(3); // Advance to Review Questions
    } catch (err) {
      setError(err.response?.data?.message || 'AI MCQ generation failed. Please try again.');
      setStep(1);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalSubmitTest = async () => {
    setError('');
    const startDateTime = new Date(`${testDate}T${startTimeStr}:00`);
    const endDateTime = new Date(`${testDate}T${endTimeStr}:00`);

    try {
      const payload = {
        testName,
        questions: generatedQuestions,
        duration,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        pdfSourceNames
      };

      const res = await api.post('/teacher/tests', payload);
      setCreatedTestCode(res.data.test.testCode);
      setStep(4); // Advance to Share Test
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save test.');
    }
  };

  const copyTestLink = () => {
    if (!createdTestCode) return;
    const fullUrl = `${window.location.origin}/test/${createdTestCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Step Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold mb-3">
          <span className={step >= 1 ? 'text-indigo-600 font-bold' : 'text-slate-500'}>1. PDF Upload & Timing</span>
          <span className={step >= 2 ? 'text-indigo-600 font-bold' : 'text-slate-500'}>2. AI Processing</span>
          <span className={step >= 3 ? 'text-indigo-600 font-bold' : 'text-slate-500'}>3. Question Review</span>
          <span className={step >= 4 ? 'text-emerald-600 font-bold' : 'text-slate-500'}>4. Share Test</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: PDF Upload & Timing Parameters */}
      {step === 1 && (
        <form onSubmit={handleGenerateMCQs} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-6 h-6 text-indigo-600" />
              <span>Step 1: Upload PDF & Schedule Test</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Configure assessment metadata, PDF syllabus files, and student access window.</p>
          </div>

          {/* Read-Only Institute Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs">
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-slate-500">Target Institute Association (Pre-filled):</span>
            <span className="font-bold text-slate-900">
              {user?.instituteName || 'No Institute Assigned (Open Test)'}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Test Title</label>
              <input
                type="text"
                required
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="e.g. Data Structures Mid-Term Assessment"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
              />
            </div>

            {/* PDF Upload Dropzone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Upload PDF Source Files</label>
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-50 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="application/pdf"
                  onChange={handleFileChange}
                  id="pdf-upload"
                  className="hidden"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <FileText className="w-8 h-8 text-indigo-600" />
                  <span className="text-xs font-semibold text-slate-800">
                    {selectedFiles.length > 0
                      ? `${selectedFiles.length} File(s) Selected: ${selectedFiles.map(f => f.name).join(', ')}`
                      : 'Click to upload PDF files (Max 10MB each)'}
                  </span>
                  <span className="text-[10px] text-slate-500">Supports single or multiple PDF lecture notes</span>
                </label>
              </div>
            </div>

            {/* Test Configuration Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Number of MCQs (1-50)</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Marks Per Question</label>
                <input
                  type="number"
                  min={1}
                  value={marksPerQuestion}
                  onChange={(e) => setMarksPerQuestion(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Test Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                >
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={20}>20 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
            </div>

            {/* Timing Window Schedule */}
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Student Start Availability Window</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Test Date</label>
                  <input
                    type="date"
                    required
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Window Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Window End Time</label>
                  <input
                    type="time"
                    required
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            <span>Generate MCQs with OpenAI</span>
          </button>
        </form>
      )}

      {/* STEP 2: Processing Spinner */}
      {step === 2 && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto animate-spin">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">AI Engine Processing Document...</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Extracting text from PDF source materials and asking ChatGPT to formulate {questionCount} multiple-choice questions with distinct options and answer key.
          </p>
        </div>
      )}

      {/* STEP 3: Review Generated Questions */}
      {step === 3 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span>Step 3: Review AI Generated Questions</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Review questions, options, and correct answers before creating final test link.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
              {generatedQuestions.length} Questions
            </span>
          </div>

          {/* Read-Only Question List */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {generatedQuestions.map((q, idx) => (
              <div key={q.questionId} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="font-bold text-sm text-slate-900">
                    <span className="text-indigo-600 mr-2">Q{idx + 1}.</span>
                    {q.questionText}
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    {q.marks} Mark
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt) => (
                    <div
                      key={opt.optionId}
                      className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                        opt.optionId === q.correctAnswer
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        opt.optionId === q.correctAnswer ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {opt.optionId}
                      </span>
                      <span>{opt.optionText}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Edit Settings</span>
            </button>

            <button
              onClick={handleFinalSubmitTest}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm flex items-center gap-2 transition-all"
            >
              <span>Publish & Generate Share Link</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Share Test & QR Code */}
      {step === 4 && createdTestCode && (
        <div className="bg-white p-8 rounded-2xl border border-emerald-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <Share2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Test Published Successfully!</h2>
            <p className="text-xs text-slate-500 mt-1">Share this link or QR code with your students to begin the exam session.</p>
          </div>

          {/* Scope Notice */}
          <div className="max-w-md mx-auto p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-800 flex items-center justify-center gap-2 font-medium">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>
              {user?.instituteName
                ? `This test is strictly accessible to ${user.instituteName} students.`
                : 'This test is open to students from any or no institute.'}
            </span>
          </div>

          {/* Shareable Link Box */}
          <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-indigo-700 truncate font-semibold">
              {window.location.origin}/test/{createdTestCode}
            </span>
            <button
              onClick={copyTestLink}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1 shrink-0 hover:bg-indigo-700"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>

          {/* QR Code */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block shadow-sm">
            <QRCodeSVG value={`${window.location.origin}/test/${createdTestCode}`} size={160} />
          </div>

          <div>
            <button
              onClick={() => navigate('/teacher/dashboard')}
              className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-800 font-semibold text-xs hover:bg-slate-200 transition-colors"
            >
              Return to Teacher Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
