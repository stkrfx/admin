'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendVerificationOTP, verifyAndSetPassword, completeProfileSetup, getSetupUser } from '@/actions/setup';
import { 
  Loader2, Mail, Lock, CheckCircle2, ArrowRight, User, Wand2, ShieldCheck, LogOut, Camera, Edit2 
} from 'lucide-react';
import { useUploadThing } from "@/lib/uploadthing"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot, 
} from "@/components/ui/input-otp";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { uniqueNamesGenerator, adjectives, animals, colors } from 'unique-names-generator';
import { cn } from "@/lib/utils";

// --- VALIDATION ---
const step2Schema = z.object({
  otp: z.string().length(6, "Enter complete 6-digit code"),
  password: z.string().min(8, "Min 8 characters"),
  confirm: z.string()
}).refine((data) => data.password === data.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

const step3Schema = z.object({
  name: z.string().min(2, "Name is too short"),
  username: z.string().min(3, "Username is too short"),
});

export default function SetupAccountPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  // State
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Hidden input ref for image upload
  const fileInputRef = useRef(null);

  // Forms
  const passwordForm = useForm({ resolver: zodResolver(step2Schema) });
  const profileForm = useForm({ 
    resolver: zodResolver(step3Schema),
    defaultValues: { name: '', username: '' } 
  });

  // Hydrate User Data for Step 3
  useEffect(() => {
    if (step === 3) {
      getSetupUser().then((user) => {
        if (user) {
          profileForm.reset({
            name: user.name || '',
            username: user.username || ''
          });
          if (user.photo) setPhotoUrl(user.photo);
        }
      });
    }
  }, [step, profileForm]);

  // Upload Hook
  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      setPhotoUrl(res[0].url);
      setIsUploading(false);
      toast.success("Photo Updated");
    },
    onUploadError: () => {
      setIsUploading(false);
      toast.error("Upload Failed");
    },
  });

  // Handle File Selection
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Show immediate preview
    const previewUrl = URL.createObjectURL(file);
    setPhotoUrl(previewUrl);
    setIsUploading(true);

    // 2. Start Upload
    await startUpload([file]);
  };

  // Timer Effect
  useEffect(() => {
    let interval;
    if (resendTimer > 0) interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // --- HANDLERS ---

  const handleSendOTP = async () => {
    setLoading(true);
    toast.dismiss();
    try {
      const res = await sendVerificationOTP();
      if (res.success) {
        setStep(2);
        setResendTimer(60);
        toast.success("Code sent to email");
      } else {
        toast.error(res.error);
      }
    } catch { toast.error("System Error"); }
    finally { setLoading(false); }
  };

  const handleVerify = async (data) => {
    setLoading(true);
    toast.dismiss();
    try {
      const res = await verifyAndSetPassword({ otp: data.otp, password: data.password });
      if (res.success) {
        await update({ forcePasswordChange: false });
        setStep(3); 
        toast.success("Account Secured");
      } else {
        toast.error(res.error);
      }
    } catch { toast.error("Verification Error"); }
    finally { setLoading(false); }
  };

  const handleProfileUpdate = async (data) => {
    setLoading(true);
    try {
      const res = await completeProfileSetup({ 
        name: data.name, 
        username: data.username,
        photo: photoUrl 
      });
      if (res.success) {
        toast.success("Setup Complete!");
        router.push('/dashboard');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } catch { toast.error("Update Failed"); }
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
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
          <div className="h-full bg-slate-900 transition-all duration-500 ease-out" style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }} />
        </div>

        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-2xl mb-6 shadow-xl shadow-slate-900/20">
              M
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {step === 1 ? "Check your Inbox" : step === 2 ? "Secure Access" : "One Last Thing"}
            </h1>
            <p className="mt-2 text-slate-500">
              {step === 1 && `We've sent a code to ${session?.user?.email}`}
              {step === 2 && "Enter the code and set a new password."}
              {step === 3 && "Review your profile details. You can change this anytime."}
            </p>
          </div>

          {/* STEP 1: SEND OTP */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="p-8 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm text-blue-600">
                  <Mail size={32} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Verify Email</div>
                  <div className="font-medium text-slate-900 text-lg">{session?.user?.email}</div>
                </div>
              </div>

              <Button onClick={handleSendOTP} disabled={loading} className="w-full h-12 text-base font-semibold shadow-lg shadow-slate-900/10">
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <>Send Verification Code <ArrowRight className="ml-2 h-5 w-5" /></>}
              </Button>

              <div className="text-center">
                <button onClick={() => signOut()} className="text-sm text-slate-400 hover:text-slate-600 font-medium flex items-center justify-center gap-2 mx-auto transition-colors">
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: VERIFY */}
          {step === 2 && (
            <form onSubmit={passwordForm.handleSubmit(handleVerify)} className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700">Verification Code</label>
                  <button type="button" disabled={resendTimer > 0} onClick={handleSendOTP} className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400">
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                  </button>
                </div>
                
                {/* IMPROVED OTP INPUT: Full width & Spaced */}
                <div className="w-full">
                  <Controller
                    control={passwordForm.control}
                    name="otp"
                    render={({ field }) => (
                      <InputOTP maxLength={6} {...field} containerClassName="w-full justify-between gap-2">
                        {/* We map slots individually to control spacing via the container gap */}
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <InputOTPSlot 
                            key={index} 
                            index={index} 
                            className="flex-1 h-14 text-lg border-2 border-slate-200 shadow-sm rounded-xl focus:border-slate-900 transition-all bg-white" 
                          />
                        ))}
                      </InputOTP>
                    )}
                  />
                </div>
                {passwordForm.formState.errors.otp && <p className="text-center text-xs text-red-500 font-medium">{passwordForm.formState.errors.otp.message}</p>}
              </div>

              <div className="space-y-4 pt-2">
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

              <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold shadow-lg shadow-slate-900/10">
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <>Verify & Secure <ShieldCheck className="ml-2 h-5 w-5" /></>}
              </Button>
            </form>
          )}

          {/* STEP 3: PROFILE */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                <div className="bg-emerald-100 p-1.5 rounded-full"><CheckCircle2 className="text-emerald-600 h-5 w-5" /></div>
                <p className="text-sm text-emerald-800 font-medium">Password secured. Set up your profile below.</p>
              </div>

              <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-8">
                
                {/* Clickable Photo Upload */}
                <div className="flex justify-center">
                  <div 
                    className="relative group cursor-pointer" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Avatar className="h-32 w-32 border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-300 ring-4 ring-slate-50">
                      <AvatarImage src={photoUrl || session?.user?.image} className="object-cover" />
                      <AvatarFallback className="bg-slate-900 text-slate-50 text-4xl font-bold uppercase">
                        {session?.user?.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Hover Overlay */}
                    <div className={cn(
                      "absolute inset-0 bg-slate-900/60 rounded-full flex items-center justify-center transition-opacity duration-200 backdrop-blur-[1px]",
                      isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                      {isUploading ? <Loader2 className="text-white animate-spin" /> : <Camera className="text-white h-8 w-8" />}
                    </div>

                    {/* Edit Badge */}
                    <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-slate-100 text-slate-700 group-hover:bg-slate-50 transition-colors">
                      <Edit2 size={16} />
                    </div>
                    
                    {/* Hidden Input */}
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
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Save Profile & Finish"}
                  </Button>
                  
                  <Button type="button" variant="ghost" onClick={() => router.push('/dashboard')} className="w-full text-slate-400 hover:text-slate-600 font-medium">
                    Skip for now
                  </Button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* --- RIGHT SIDE: DOODLE / ILLUSTRATION --- */}
      <div className="hidden lg:flex w-1/2 bg-slate-50 border-l border-slate-100 items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        
        <div className="relative z-10 text-center max-w-lg p-12">
          {/* Illustration Container */}
          <div className="w-72 h-72 bg-white rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] mx-auto mb-10 flex items-center justify-center relative border border-slate-100/50 backdrop-blur-sm">
             <div className="absolute inset-0 bg-gradient-to-tr from-slate-50/50 to-transparent rounded-3xl" />
             
             {step === 1 && <Mail size={120} className="text-blue-500 opacity-80 drop-shadow-2xl animate-in zoom-in duration-500" strokeWidth={1} />}
             {step === 2 && <ShieldCheck size={120} className="text-purple-500 opacity-80 drop-shadow-2xl animate-in zoom-in duration-500" strokeWidth={1} />}
             {step === 3 && <User size={120} className="text-emerald-500 opacity-80 drop-shadow-2xl animate-in zoom-in duration-500" strokeWidth={1} />}
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
            {step === 1 ? "Secure Verification" : step === 2 ? "Protected Credentials" : "Your Identity"}
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed font-light">
            {step === 1 && "We use time-sensitive codes to ensure only you can access this account."}
            {step === 2 && "Industry-standard encryption keeps your password safe. Never share it with anyone."}
            {step === 3 && "Personalize your dashboard experience. This helps your team recognize you instantly."}
          </p>
        </div>
      </div>
    </div>
  );
}