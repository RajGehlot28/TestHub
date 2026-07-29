import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, UploadCloud, ShieldCheck, BarChart3, BookOpen, ArrowRight } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6">
            <BrainCircuit className="w-4 h-4 text-indigo-600" />
            <span>AI-Driven Automated Assessment SaaS Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto mb-6">
            Transform PDFs into <span className="text-indigo-600">Instant AI MCQ Tests</span> in Seconds
          </h1>

          <p className="text-base text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            TestHub enables educators to instantly generate high-quality assessments from document uploads, enforce institute-aware security, and view real-time student analytics.
          </p>

          {/* Quick Access Roles */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
            <Link
              to="/login-student"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <span>Student Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login-teacher"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-slate-800 font-bold text-sm border border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Teacher Portal</span>
              <BookOpen className="w-4 h-4 text-indigo-600" />
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Engineered for Academic Excellence</h2>
          <p className="text-slate-600 text-sm">Automated workflows tailored for Teachers, Students, and Institute Administrators.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">PDF to MCQ Generator</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload course PDFs or lecture notes. OpenAI ChatGPT parses content to produce precise MCQs with customizable options and equal weighting.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Institute Access Control</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tests created by institute teachers are strictly restricted to students belonging to that institute. Non-affiliated teachers host open tests.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Real-Time Performance Analytics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Instant automated grading upon test completion. Teachers get overall student average trend graphs; students track personal percentage growth.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-700">TestHub Platform</span> &copy; 2026. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login-teacher" className="hover:text-indigo-600 transition-colors">Teacher Portal</Link>
            <span>&bull;</span>
            <Link to="/login-student" className="hover:text-indigo-600 transition-colors">Student Portal</Link>
            <span>&bull;</span>
            <Link to="/login-admin" className="px-3 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-semibold hover:bg-amber-100 transition-colors">Admin Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
