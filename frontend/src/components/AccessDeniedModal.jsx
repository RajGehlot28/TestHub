import React from 'react';
import { ShieldX, Home, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AccessDeniedModal = ({
  teacherInstitute,
  studentInstitute,
  testName
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white p-8 rounded-2xl border border-rose-200 shadow-lg text-center relative">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-5">
          <ShieldX className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">Access Denied</h2>
        <p className="text-xs font-semibold text-rose-600 mb-6">You are not allowed to access this test.</p>

        {testName && (
          <div className="text-xs text-slate-600 mb-4 bg-slate-50 py-2 px-3 rounded-lg border border-slate-200 font-medium">
            Target Test: <span className="text-slate-900 font-bold">{testName}</span>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left mb-6 space-y-3">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Test Institute</span>
              <span className="text-sm font-bold text-slate-900">{teacherInstitute || 'Specific Institution'}</span>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-3 flex items-start gap-3">
            <Building2 className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Your Registered Institute</span>
              <span className="text-sm font-bold text-rose-700">{studentInstitute || 'No Institute Assigned'}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 pt-2 border-t border-slate-200">
            If you believe this is incorrect, please contact your institution administrator.
          </p>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
