import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Link } from 'react-router-dom';
import { MockApiService } from '../api/mock';
import { Lock, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

const resetSchema = zod.object({
  password: zod.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: zod.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetFormData = zod.infer<typeof resetSchema>;

const ResetPassword: React.FC = () => {

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema)
  });

  const onSubmit = async (data: ResetFormData) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Simulate token validation and update password
      const result = await MockApiService.resetPassword('mock_token', data.password);
      if (result) {
        setSuccess(true);
      } else {
        setErrorMsg('Password reset token is invalid or has expired.');
      }
    } catch (err: any) {
      setErrorMsg('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 md:p-6 transition-colors duration-200">
      {/* Background Blurs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800/80 overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />
        
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Set New Password
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Create a secure passphrase for your user credentials.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 text-rose-600 dark:text-rose-400 text-xs">
              <span>{errorMsg}</span>
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="password">
                  New Secure Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Lock size={16} />
                  </span>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200"
                  />
                </div>
                {errors.password && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Lock size={16} />
                  </span>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password Credentials</span>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-4">
              <CheckCircle2 size={44} className="mx-auto text-emerald-500" />
              <h3 className="text-md font-bold text-slate-850 dark:text-slate-100">Password Updated Successfully</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                Your passphrase has been updated. You can now use your new credentials to log back in.
              </p>
              
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 py-2 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all duration-200"
                >
                  <ArrowLeft size={14} />
                  <span>Go to Login</span>
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
