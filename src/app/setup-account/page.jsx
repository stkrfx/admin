'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendVerificationOTP, verifyCode, updateSetupProfile, finalizeSetup, getSetupUser } from '@/actions/setup';
import { 
  Loader2, Mail, Lock, CheckCircle2, ArrowRight, User, ShieldCheck, LogOut, Camera, Edit2, Send, Wand2
} from 'lucide-react';
import { useUploadThing } from "@/lib/uploadthing"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  InputOTP, 
  InputOTPSlot, 
} from "@/components/ui/input-otp";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { uniqueNamesGenerator, adjectives, animals, colors } from 'unique-names-generator';
import { cn } from "@/lib/utils";

// --- VALIDATION ---
const otpSchema = z.object({
  otp: z.string().length(6, "Enter complete 6-digit code"),
});

const profileSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  username: z.string().min(3, "Username is too short"),
});

const passwordSchema = z.object({
  password: z.string().min(8, "Min 8 characters"),
  confirm: z.string()
}).refine((data) => data.password === data.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

export default function SetupAccountPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  // State
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  // Profile State
  const [photoUrl, setPhotoUrl] = useState(null); // Important: Initialize as null, not ""
  const [isUploading, setIsUploading] = useState(false);
  const [dbUser, setDbUser] = useState(null);
  
  const fileInputRef = useRef(null);

  // Forms
  const otpForm = useForm({ resolver: zodResolver(otpSchema) });
  const profileForm = useForm({ 
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', username: '' } 
  });
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  // 1. Fetch Data & Auto-Skip
  useEffect(() => {
    async function init() {
      const user = await getSetupUser();
      if (user) {
        setDbUser(user);
        if (user.photo) setPhotoUrl(user.photo);
        
        // Sync form with DB data
        profileForm.reset({
          name: user.name || '',
          username: user.username || ''
        });

        // If verified, skip to Profile (Step 2)
        if (user.isVerified) {
          setStep(2);
        }
      }
    }
    if (session?.user) init();
  }, [session, profileForm]);

  // 2. Upload Logic (Fixed Spinner)
  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      if (res?.[0]?.url) {
        setPhotoUrl(res[0].url);
        toast.success("Photo Updated");
      }
      setIsUploading(false); // Ensure spinner stops
    },
    onUploadError: (e) => {
      setIsUploading(false); // Ensure spinner stops
      toast.error("Upload Failed");
      console.error(e);
    },
  });

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optimistic UI
    const previewUrl = URL.createObjectURL(file);
    setPhotoUrl(previewUrl);
    setIsUploading(true);

    try {
      await startUpload([file]);
    } catch (error) {
      // Catch any immediate errors from startUpload
      setIsUploading(false);
    }
  };

  // Timer
  useEffect(() => {
    let interval;
    if (resendTimer > 0) interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // --- HANDLERS ---

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const res = await sendVerificationOTP();
      if (res.success) {
        setStep(1);
        setResendTimer(60);
        toast.success("Code sent to email");
      } else toast.error(res.error);
    } catch { toast.error("System Error"); }
    finally { setLoading(false); }
  };

  const onVerifyOTP = async (data) => {
    setLoading(true);
    try {
      const res = await verifyCode(data.otp);
      if (res.success) {
        setStep(2); 
        toast.success("Email Verified!");
      } else toast.error(res.error);
    } catch { toast.error("Verification Error"); }
    finally { setLoading(false); }
  };

  const onUpdateProfile = async (data) => {
    setLoading(true);
    try {
      const res = await updateSetupProfile({ 
        name: data.name, 
        username: data.username,
        photo: photoUrl 
      });
      if (res.success) {
        setStep(3);
        toast.success("Profile Saved");
      } else toast.error(res.error);
    } catch { toast.error("Update Failed"); }
    finally { setLoading(false); }
  };

  const handleSkipProfile = () => {
    setStep(3);
    toast.info("Profile skipped");
  };

  const onFinalize = async (data) => {
    setLoading(true);
    try {
      const res = await finalizeSetup({ password: data.password });
      if (res.success) {
        await update({ forcePasswordChange: false });
        toast.success("Setup Complete!", { description: "Redirecting..." });
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1500);
      } else toast.error(res.error);
    } catch { toast.error("Finalization Failed"); }
    finally { setLoading(false); }
  };

  const handleRandomUsername = () => {
    const random = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals], separator: '', length: 2 });
    profileForm.setValue('username', random.toLowerCase());
  };

  return (
    <div className="w-full min-h-[100dvh] flex bg-white">
      <Toaster position="bottom-right" richColors closeButton />

      {/* --- LEFT SIDE: FORM --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 relative z-10">
        
        {/* Mobile Header Doodle */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>

        {/* Progress Bar (Desktop) */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 hidden lg:block">
          <div 
            className="h-full bg-slate-900 transition-all duration-500 ease-out" 
            style={{ width: step === 0 ? '10%' : step === 1 ? '33%' : step === 2 ? '66%' : '100%' }} 
          />
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-2xl mb-6 shadow-xl shadow-slate-900/20">M</div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {step <= 1 ? "Verify Identity" : step === 2 ? "Personalize" : "Secure Access"}
            </h1>
            <p className="mt-2 text-slate-500">
              {step === 0 && "We need to confirm it's really you."}
              {step === 1 && `Enter the code sent to ${session?.user?.email || 'your email'}`}
              {step === 2 && "How should we display your profile?"}
              {step === 3 && "Create a strong password to finish setup."}
            </p>
          </div>

          {/* --- STEP 0: SEND --- */}
          {step === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="p-8 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm text-blue-600">
                  <Mail size={32} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account Email</div>
                  <div className="font-medium text-slate-900 text-lg">{session?.user?.email}</div>
                </div>
              </div>
              <Button onClick={handleSendOTP} disabled={loading} className="w-full h-12 text-base font-semibold shadow-lg shadow-slate-900/10 bg-slate-900 hover:bg-slate-800">
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <>Send Code <Send className="ml-2 h-4 w-4" /></>}
              </Button>
              <button onClick={() => signOut()} className="w-full text-sm text-slate-400 hover:text-slate-600 font-medium flex items-center justify-center gap-2 transition-colors">
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}

          {/* --- STEP 1: VERIFY --- */}
          {step === 1 && (
            <form onSubmit={otpForm.handleSubmit(onVerifyOTP)} className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700">Verification Code</label>
                  <button type="button" disabled={resendTimer > 0} onClick={handleSendOTP} className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400">
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                  </button>
                </div>
                
                {/* FIXED OTP DESIGN: Full width, separate cells */}
                <div className="w-full">
                  <Controller
                    control={otpForm.control}
                    name="otp"
                    render={({ field }) => (
                      <InputOTP maxLength={6} {...field}>
                         <div className="flex w-full gap-2 sm:gap-3 justify-between">
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <InputOTPSlot 
                              key={index} index={index} 
                              className="flex-1 h-14 text-xl border-2 border-slate-200 shadow-sm !rounded-xl focus:border-slate-900 focus:ring-slate-900/20 bg-white transition-all" 
                            />
                          ))}
                        </div>
                      </InputOTP>
                    )}
                  />
                </div>
                {otpForm.formState.errors.otp && <p className="text-center text-xs text-red-500 font-medium">{otpForm.formState.errors.otp.message}</p>}
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold shadow-lg shadow-slate-900/10 bg-slate-900 hover:bg-slate-800">
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <>Verify Code <ArrowRight className="ml-2 h-5 w-5" /></>}
              </Button>
              <button type="button" onClick={() => setStep(0)} className="w-full text-sm text-slate-400 hover:text-slate-600 font-medium">Back</button>
            </form>
          )}

          {/* --- STEP 2: PROFILE --- */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="mb-8 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-800">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">Email verified successfully.</p>
              </div>

              <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-8">
                
                {/* Photo Upload */}
                <div className="flex justify-center">
                  <div 
                    className="relative group cursor-pointer" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Avatar className="h-32 w-32 border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-300 ring-4 ring-slate-50">
                      {/* SAFE IMAGE SRC: Avoids "" error */}
                      <AvatarImage src={photoUrl || dbUser?.photo || null} className="object-cover" />
                      <AvatarFallback className="bg-slate-900 text-slate-50 text-4xl font-bold uppercase">
                        {dbUser?.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Spinner / Hover Overlay */}
                    <div className={cn(
                      "absolute inset-0 bg-slate-900/60 rounded-full flex items-center justify-center transition-opacity duration-200 backdrop-blur-[1px]",
                      isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                      {isUploading ? <Loader2 className="text-white animate-spin" /> : <Camera className="text-white h-8 w-8" />}
                    </div>

                    <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-slate-100 text-slate-700 group-hover:bg-slate-50 transition-colors">
                      <Edit2 size={16} />
                    </div>
                    
                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      disabled={isUploading} 
                    />
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Display Name</label>
                    <Input {...profileForm.register('name')} placeholder="John Doe" className="h-12 bg-slate-50 focus:bg-white border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Username</label>
                    <div className="flex gap-2">
                      <Input {...profileForm.register('username')} placeholder="unique-username" className="h-12 bg-slate-50 focus:bg-white border-slate-200" />
                      <Button type="button" variant="outline" onClick={handleRandomUsername} className="h-12 px-3 bg-slate-50 hover:bg-slate-100 border-slate-200" title="Randomize">
                        <Wand2 size={18} className="text-slate-500" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button type="submit" disabled={loading || isUploading} className="w-full h-12 text-base font-semibold shadow-lg shadow-emerald-600/10 bg-emerald-600 hover:bg-emerald-700 text-white">
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Continue"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleSkipProfile} className="w-full text-slate-400 hover:text-slate-600 font-medium">Skip this step</Button>
                </div>
              </form>
            </div>
          )}

          {/* --- STEP 3: PASSWORD --- */}
          {step === 3 && (
            <form onSubmit={passwordForm.handleSubmit(onFinalize)} className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">New Password</label>
                  <Input type="password" {...passwordForm.register('password')} placeholder="••••••••" className="h-12 bg-slate-50 border-slate-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
                  <Input type="password" {...passwordForm.register('confirm')} placeholder="••••••••" className="h-12 bg-slate-50 border-slate-200" />
                  {passwordForm.formState.errors.confirm && <p className="text-xs text-red-500">{passwordForm.formState.errors.confirm.message}</p>}
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold shadow-lg shadow-emerald-600/10 bg-emerald-600 hover:bg-emerald-700 text-white">
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <>Finish Setup <ShieldCheck className="ml-2 h-5 w-5" /></>}
              </Button>
            </form>
          )}

        </div>
      </div>

      {/* --- RIGHT SIDE: ILLUSTRATION --- */}
      <div className="hidden lg:flex w-1/2 bg-slate-50 border-l border-slate-100 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="relative z-10 text-center max-w-lg p-12">
          <div className="w-72 h-72 bg-white rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] mx-auto mb-10 flex items-center justify-center relative border border-slate-100/50 backdrop-blur-sm">
             <div className="absolute inset-0 bg-gradient-to-tr from-slate-50/50 to-transparent rounded-3xl" />
             {step <= 1 && <Mail size={120} className="text-blue-500 opacity-80 drop-shadow-2xl animate-in zoom-in duration-500" strokeWidth={1} />}
             {step === 2 && <User size={120} className="text-purple-500 opacity-80 drop-shadow-2xl animate-in zoom-in duration-500" strokeWidth={1} />}
             {step === 3 && <Lock size={120} className="text-emerald-500 opacity-80 drop-shadow-2xl animate-in zoom-in duration-500" strokeWidth={1} />}
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
            {step <= 1 ? "Secure Verification" : step === 2 ? "Your Identity" : "Protected Credentials"}
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed font-light">
            {step <= 1 && "We use time-sensitive codes to ensure only you can access this account."}
            {step === 2 && "Personalize your dashboard experience. This helps your team recognize you instantly."}
            {step === 3 && "Industry-standard encryption keeps your password safe. Never share it with anyone."}
          </p>
        </div>
      </div>
    </div>
  );
}