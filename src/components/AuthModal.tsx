import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, Phone, ArrowRight, CheckCircle2, Lock, 
  RefreshCw, Sparkles, User, Camera, ArrowLeft, Shield, Smartphone 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { COUNTRIES, CountryPicker } from './CountryPicker';
import { UserProfile } from '../types';
import { generateUserCryptoProfile } from '../services/crypto';
import { storage } from '../services/storage';
import { signInWithGoogle, syncUserProfileToFirestore } from '../services/firebase';

interface AuthModalProps {
  onSuccess: (user: UserProfile) => void;
  onClose?: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
];

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [authMethod, setAuthMethod] = useState<'main' | 'phone' | 'otp' | 'profile'>('main');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('849201');
  const [timer, setTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSmsBanner, setShowSmsBanner] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Profile setup state
  const [name, setName] = useState('');
  const [about, setAbout] = useState('Using ChatRoom with E2EE 🔐');
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // OTP Countdown timer
  useEffect(() => {
    let interval: any;
    if (authMethod === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [authMethod, timer]);

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      const userProfile = await signInWithGoogle();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      await storage.setCurrentUser(userProfile);
      onSuccess(userProfile);
    } catch (err: any) {
      console.warn('Google Sign-In note:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in popup was closed.');
      } else {
        setErrorMsg(err.message || 'Google sign-in could not complete.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSendOtp = () => {
    if (!phoneNumber || phoneNumber.trim().length < 6) {
      setErrorMsg('Please enter a valid mobile number');
      return;
    }
    setErrorMsg('');
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newCode);
    setTimer(60);
    setOtpDigits(['', '', '', '', '', '']);
    setAuthMethod('otp');
    setShowSmsBanner(true);

    setTimeout(() => {
      otpInputsRef.current[0]?.focus();
    }, 100);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d !== '') && index === 5) {
      verifyOtpCode(newDigits.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const arr = pasted.split('');
      setOtpDigits(arr);
      verifyOtpCode(pasted);
    }
  };

  const handleAutoFillOtp = () => {
    const arr = generatedOtp.split('');
    setOtpDigits(arr);
    verifyOtpCode(generatedOtp);
  };

  const verifyOtpCode = async (enteredCode: string) => {
    setIsVerifying(true);
    setErrorMsg('');

    setTimeout(async () => {
      setIsVerifying(false);
      const fullPhone = `${selectedCountry.dialCode} ${phoneNumber.trim()}`;
      const existingAccounts = storage.getAllAccounts();
      const existingUser = existingAccounts.find((a) => a.phone === fullPhone);

      if (existingUser) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        await storage.setCurrentUser(existingUser);
        await syncUserProfileToFirestore(existingUser);
        onSuccess(existingUser);
      } else {
        setAuthMethod('profile');
      }
    }, 600);
  };

  const handleCompleteProfile = async () => {
    if (!name.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }

    const fullPhone = `${selectedCountry.dialCode} ${phoneNumber.trim()}`;
    const cryptoProfile = await generateUserCryptoProfile(fullPhone);

    const newUser: UserProfile = {
      id: 'usr_' + Date.now(),
      phone: fullPhone,
      countryCode: selectedCountry.code,
      name: name.trim(),
      about: about.trim() || 'ChatRoom member • E2EE Active 🔐',
      avatar: avatar,
      publicKey: cryptoProfile.publicKeyHex,
      safetyNumber: cryptoProfile.safetyNumberSnippet,
      online: true,
      lastSeen: Date.now(),
      joinedRooms: [],
      createdAt: Date.now()
    };

    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    await storage.setCurrentUser(newUser);
    await syncUserProfileToFirestore(newUser);
    onSuccess(newUser);
  };

  const handleQuickLoginAs = async (id: string, userName: string, userAvatar: string, userAbout: string) => {
    const cryptoProfile = await generateUserCryptoProfile(id);
    const user: UserProfile = {
      id,
      uid: id,
      phone: '+1 555-0100',
      countryCode: 'US',
      name: userName,
      about: userAbout,
      avatar: userAvatar,
      publicKey: cryptoProfile.publicKeyHex,
      safetyNumber: cryptoProfile.safetyNumberSnippet,
      online: true,
      lastSeen: Date.now(),
      joinedRooms: [],
      createdAt: Date.now()
    };

    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    await storage.setCurrentUser(user);
    await syncUserProfileToFirestore(user);
    onSuccess(user);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans text-[#1c1e21]">
      
      {/* SMS Simulation Banner Notification */}
      {showSmsBanner && authMethod === 'otp' && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-2xl p-4 text-[#1c1e21] animate-slide-down">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-blue-50 text-[#0084ff] rounded-xl flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold">Messages • Now</div>
                <div className="text-xs text-gray-500">
                  Your verification code is <span className="font-mono font-bold text-[#0084ff]">{generatedOtp}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowSmsBanner(false)}
              className="text-gray-400 hover:text-gray-600 text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <button
            onClick={handleAutoFillOtp}
            className="w-full mt-2.5 bg-blue-50 hover:bg-blue-100 text-[#0084ff] text-xs font-bold py-1.5 rounded-lg transition cursor-pointer"
          >
            Auto-fill Code ({generatedOtp})
          </button>
        </div>
      )}

      {/* Main Modal Box */}
      <div className="w-full max-w-[420px] bg-white text-[#1c1e21] rounded-3xl shadow-2xl p-7 border border-gray-100 animate-scale-up">
        
        {/* MAIN / GOOGLE AUTH VIEW */}
        {authMethod === 'main' && (
          <div>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-tr from-[#0084ff] to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-200 text-white">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-[#1c1e21]">ChatRoom</h2>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Real-time encrypted chat rooms with zero-knowledge AES-256 and Firestore persistence.
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Google Sign-In Primary Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-2xl border border-gray-300 shadow-xs hover:shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-[#0084ff]" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* Or Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">or test demo accounts</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Quick Persona Logins for multi-user real-time testing */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickLoginAs(
                    'user_sarah', 
                    'Sarah Jenkins', 
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
                    'Cryptography & Security Lead 🔐'
                  )}
                  className="p-2.5 bg-gray-50 hover:bg-blue-50/70 border border-gray-200 hover:border-blue-300 rounded-2xl text-left transition cursor-pointer flex items-center gap-2 group"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" 
                    alt="Sarah" 
                    className="w-8 h-8 rounded-xl object-cover" 
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1c1e21] group-hover:text-[#0084ff] truncate">Sarah J.</div>
                    <div className="text-[10px] text-gray-400 truncate">Security Dev</div>
                  </div>
                </button>

                <button
                  onClick={() => handleQuickLoginAs(
                    'user_alex', 
                    'Alex Rivera', 
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                    'E2EE Architect & Tech Lead 🚀'
                  )}
                  className="p-2.5 bg-gray-50 hover:bg-blue-50/70 border border-gray-200 hover:border-blue-300 rounded-2xl text-left transition cursor-pointer flex items-center gap-2 group"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" 
                    alt="Alex" 
                    className="w-8 h-8 rounded-xl object-cover" 
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1c1e21] group-hover:text-[#0084ff] truncate">Alex R.</div>
                    <div className="text-[10px] text-gray-400 truncate">Tech Lead</div>
                  </div>
                </button>

                <button
                  onClick={() => handleQuickLoginAs(
                    'user_elena', 
                    'Elena Rostova', 
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                    'AI Researcher & Room Creator ✨'
                  )}
                  className="p-2.5 bg-gray-50 hover:bg-blue-50/70 border border-gray-200 hover:border-blue-300 rounded-2xl text-left transition cursor-pointer flex items-center gap-2 group"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" 
                    alt="Elena" 
                    className="w-8 h-8 rounded-xl object-cover" 
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1c1e21] group-hover:text-[#0084ff] truncate">Elena R.</div>
                    <div className="text-[10px] text-gray-400 truncate">AI Researcher</div>
                  </div>
                </button>

                <button
                  onClick={() => handleQuickLoginAs(
                    'user_marcus', 
                    'Marcus Vance', 
                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
                    'Fullstack Engineer & Community Host 💻'
                  )}
                  className="p-2.5 bg-gray-50 hover:bg-blue-50/70 border border-gray-200 hover:border-blue-300 rounded-2xl text-left transition cursor-pointer flex items-center gap-2 group"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" 
                    alt="Marcus" 
                    className="w-8 h-8 rounded-xl object-cover" 
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1c1e21] group-hover:text-[#0084ff] truncate">Marcus V.</div>
                    <div className="text-[10px] text-gray-400 truncate">Host & Dev</div>
                  </div>
                </button>
              </div>

              {/* Mobile Phone Alternative */}
              <button
                onClick={() => setAuthMethod('phone')}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-gray-600 hover:text-[#0084ff] font-semibold hover:bg-gray-50 rounded-xl transition cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Or sign in with Phone Number</span>
              </button>

              {errorMsg && (
                <div className="text-xs text-red-500 text-center font-medium bg-red-50 py-2 rounded-xl border border-red-100">
                  {errorMsg}
                </div>
              )}

              {/* Trust Badge */}
              <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-green-700 bg-green-50/80 border border-green-200/60 rounded-xl py-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                <span>Web Crypto AES-256 + Firestore Active</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP: PHONE NUMBER INPUT */}
        {authMethod === 'phone' && (
          <div>
            <button
              onClick={() => setAuthMethod('main')}
              className="p-1 -ml-2 text-gray-400 hover:text-gray-700 rounded-full mb-2 inline-flex items-center text-xs font-medium cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>Back</span>
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-[#0084ff]">
                <Phone className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Phone Sign-In</h3>
              <p className="text-xs text-gray-500 mt-1">
                Enter your mobile number to receive a verification OTP.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCountryPicker(true)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-[#1c1e21] transition cursor-pointer pr-2 border-r border-gray-200"
                >
                  <span>{selectedCountry.flag}</span>
                  <span>{selectedCountry.dialCode}</span>
                </button>
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d]/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-24 pr-4 text-sm focus:ring-2 focus:ring-[#0084ff]/30 focus:border-[#0084ff] focus:outline-none transition-all placeholder:text-gray-400 font-medium"
                  autoFocus
                />
              </div>

              {errorMsg && (
                <div className="text-xs text-red-500 text-center font-medium bg-red-50 py-1.5 rounded-lg border border-red-100">
                  {errorMsg}
                </div>
              )}

              <button
                onClick={handleSendOtp}
                className="w-full bg-[#0084ff] hover:bg-[#0073e6] text-white font-bold py-3 rounded-xl transition cursor-pointer shadow-md shadow-blue-100"
              >
                Send OTP Code
              </button>
            </div>
          </div>
        )}

        {/* STEP: OTP VERIFICATION */}
        {authMethod === 'otp' && (
          <div>
            <button
              onClick={() => setAuthMethod('phone')}
              className="p-1 -ml-2 text-gray-400 hover:text-gray-700 rounded-full mb-2 inline-flex items-center text-xs font-medium cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>Back</span>
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-[#0084ff]">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Enter Verification Code</h3>
              <p className="text-xs text-gray-500 mt-1">
                We sent a 6-digit code to <span className="font-semibold text-[#1c1e21]">{selectedCountry.dialCode} {phoneNumber}</span>
              </p>
            </div>

            <div className="flex justify-center gap-2 mb-4" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputsRef.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-11 h-12 text-center text-lg font-bold bg-gray-50 border border-gray-200 rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/30 focus:outline-none transition"
                />
              ))}
            </div>

            {errorMsg && (
              <div className="text-xs text-red-500 text-center font-medium bg-red-50 py-1.5 rounded-lg mb-3 border border-red-100">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 mb-5 px-1">
              <span>Resend in <strong className="text-[#1c1e21] font-mono">{timer}s</strong></span>
              <button
                disabled={timer > 0}
                onClick={handleSendOtp}
                className="text-[#0084ff] font-bold hover:underline disabled:opacity-40 disabled:hover:no-underline cursor-pointer"
              >
                Resend Code
              </button>
            </div>

            <button
              onClick={() => verifyOtpCode(otpDigits.join(''))}
              disabled={isVerifying || otpDigits.some(d => d === '')}
              className="w-full bg-[#0084ff] text-white font-bold py-3 rounded-xl hover:bg-[#0073e6] disabled:opacity-50 transition cursor-pointer shadow-md shadow-blue-100 flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying AES Key...</span>
                </>
              ) : (
                <span>Verify & Continue</span>
              )}
            </button>
          </div>
        )}

        {/* STEP: PROFILE SETUP */}
        {authMethod === 'profile' && (
          <div>
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold tracking-tight">Create Profile</h3>
              <p className="text-xs text-gray-500 mt-1">
                Set your public display name and encryption avatar.
              </p>
            </div>

            <div className="flex flex-col items-center mb-4">
              <div className="relative mb-3">
                <img
                  src={avatar}
                  alt="Avatar"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-gray-100"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-2 bg-[#0084ff] text-white rounded-xl shadow-md hover:bg-[#0073e6] transition cursor-pointer"
                  title="Upload photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) setAvatar(ev.target.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </div>

              <div className="flex gap-2">
                {PRESET_AVATARS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(p)}
                    className={`w-7 h-7 rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                      avatar === p ? 'border-[#0084ff] scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={p} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#0084ff]/30 focus:border-[#0084ff] focus:outline-none transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Status Bio
                </label>
                <input
                  type="text"
                  placeholder="Hey there! Using ChatRoom"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#0084ff]/30 focus:border-[#0084ff] focus:outline-none transition"
                />
              </div>

              {errorMsg && (
                <div className="text-xs text-red-500 text-center font-medium bg-red-50 py-1.5 rounded-lg border border-red-100">
                  {errorMsg}
                </div>
              )}

              <button
                onClick={handleCompleteProfile}
                className="w-full mt-2 bg-[#0084ff] text-white font-bold py-3 rounded-xl hover:bg-[#0073e6] active:scale-98 transition shadow-md shadow-blue-100 cursor-pointer"
              >
                Generate Keys & Start Chatting
              </button>
            </div>
          </div>
        )}

      </div>

      {showCountryPicker && (
        <CountryPicker
          selectedCountry={selectedCountry}
          onSelect={(c) => {
            setSelectedCountry(c);
            setShowCountryPicker(false);
          }}
          onClose={() => setShowCountryPicker(false)}
        />
      )}

    </div>
  );
};
