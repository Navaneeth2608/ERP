import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { MockApiService } from '../api/mock';
import { 
  KeyRound, 
  Mail, 
  Lock, 
  Loader2, 
  ShieldCheck, 
  QrCode, 
  AlertCircle 
} from 'lucide-react';

const loginSchema = zod.object({
  username: zod.string().min(3, 'Username or email must be at least 3 characters'),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = zod.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // MFA States
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaSetupData, setMfaSetupData] = useState<{ secret: string; qrCodeUri: string } | null>(null);
  const [tempUserId, setTempUserId] = useState<number | null>(null);


  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await MockApiService.login(data.username, data.password);
      
      if (response.mfaRequired) {
        setTempUserId(response.user.id);
        setMfaStep(true);
        // Automatically fetch setup details so they can test MFA setup in our mock environment
        const setup = await MockApiService.setupMfa(response.user.id);
        setMfaSetupData(setup);
      } else if (response.token) {
        login(response.user, response.token);
        navigate('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUserId || mfaCode.length !== 6) return;
    
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await MockApiService.verifyAndEnableMfa(tempUserId, mfaCode);
      if (result.success && result.token && result.user) {
        login(result.user, result.token);
        navigate('/');
      } else {
        setErrorMsg('Invalid 6-digit MFA security token. Use "123456" to bypass.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'MFA validation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipMfaSetup = () => {
    // If setting up first time and we just want to bypass/skip for testing
    if (tempUserId) {
      MockApiService.verifyAndEnableMfa(tempUserId, '123456').then(result => {
        if (result.success && result.token && result.user) {
          login(result.user, result.token);
          navigate('/');
        }
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 md:p-6 transition-colors duration-200">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card Panel */}
      <div className="relative w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800/80 overflow-hidden transition-all duration-300">
        
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />
        
        <div className="p-8">
          {/* Logo & Headline */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Campus ERP Platform
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Multi-tenant Educational Management Suite
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-pulse-subtle">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* --- Credentials Step --- */}
          {!mfaStep ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="username">
                  Username or Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Mail size={16} />
                  </span>
                  <input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    {...register('username')}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200"
                  />
                </div>
                {errors.username && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.username.message}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" htmlFor="password">
                    Password
                  </label>
                  <Link 
                    to="/forgot-password" 
                    className="text-xs text-blue-500 dark:text-blue-400 hover:underline font-medium"
                  >
                    Forgot Password?
                  </Link>
                </div>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md shadow-blue-500/10 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={16} />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* --- MFA Validation Step --- */
            <form onSubmit={handleMfaSubmit} className="space-y-6">
              <div className="text-center">
                <ShieldCheck size={40} className="mx-auto text-emerald-500 mb-2" />
                <h3 className="text-md font-bold text-slate-850 dark:text-slate-100">Verification Required</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Multi-Factor Authentication (MFA) is enabled on this profile.
                </p>
              </div>

              {/* MFA Setup Assist Box (For Testing Convience) */}
              {mfaSetupData && (
                <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs">
                  <div className="flex items-center gap-2 mb-2 font-semibold text-slate-700 dark:text-slate-300">
                    <QrCode size={14} className="text-blue-500" />
                    <span>Simulated Authenticator Setup</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Scan this provisioning code in Google Authenticator or enter the manual key.
                  </p>
                  
                  {/* Mock QR Code Display */}
                  <div className="w-32 h-32 bg-slate-200 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center text-center font-bold text-[10px] text-slate-600 dark:text-slate-400 p-2 mx-auto mb-3">
                    [Mock QR Image]
                    <br />
                    OTP Link Provisioned
                  </div>

                  <div className="flex flex-col gap-1 text-[11px]">
                    <span className="text-slate-400">Manual Key:</span>
                    <code className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-center select-all">{mfaSetupData.secret}</code>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 text-center" htmlFor="mfaCode">
                  Enter 6-Digit Authenticator Code
                </label>
                <input
                  id="mfaCode"
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-widest text-lg font-bold py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200"
                />
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  Tip: Entering <strong>123456</strong> satisfies the verification check in this mock mode.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMfaStep(false)}
                  className="flex-1 py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 font-semibold text-xs text-slate-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || mfaCode.length !== 6}
                  className="flex-1 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading && <Loader2 size={12} className="animate-spin" />}
                  <span>Verify Code</span>
                </button>
              </div>
              
              <div className="text-center">
                <button 
                  type="button" 
                  onClick={handleSkipMfaSetup}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Skip & Auto-verify with mock code
                </button>
              </div>
            </form>
          )}

          {/* Test Credentials Display */}
          {!mfaStep && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
              <p className="font-bold text-slate-500 dark:text-slate-400 mb-1.5">Roles Demo Credentials:</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <div>Super Admin: <code className="bg-slate-100 dark:bg-slate-850 px-1 rounded select-all">platformadmin</code></div>
                <div>College Admin: <code className="bg-slate-100 dark:bg-slate-850 px-1 rounded select-all">collegeadmin</code></div>
                <div>Principal: <code className="bg-slate-100 dark:bg-slate-850 px-1 rounded select-all">principal</code></div>
                <div>HOD / Faculty: <code className="bg-slate-100 dark:bg-slate-850 px-1 rounded select-all">hod</code></div>
                <div>Student: <code className="bg-slate-100 dark:bg-slate-850 px-1 rounded select-all">student</code></div>
                <div>Librarian: <code className="bg-slate-100 dark:bg-slate-850 px-1 rounded select-all">librarian</code></div>
              </div>
              <p className="mt-2">Passwords are matching the usernames (e.g. <code className="bg-slate-100 dark:bg-slate-850 px-1 rounded">supersecurepassword</code> for platformadmin, <code className="bg-slate-100 dark:bg-slate-850 px-1 rounded">hodpassword</code> for hod, etc.)</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
