'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createNewUser } from '@/actions/auth';
import Link from 'next/link';
import { 
  Copy, Check, Loader2, UserPlus, Shield, Sparkles, Wand2, 
  Mail, Lock, User, UserCheck
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner"; // Ensure this path is correct based on your project structure
import { toast } from "sonner";
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';
import { cn } from "@/lib/utils";

// --- Validation Schema ---
const schema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email address"),
  role: z.enum(['admin', 'expert', 'organisation', 'user']),
});

export default function CreateUserPage() {
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Form Hook
  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'user', name: '' }
  });

  // --- Handlers ---

  const onSubmit = async (data) => {
    setIsPending(true);
    // Dismiss previous toasts
    toast.dismiss(); 
    
    try {
      const res = await createNewUser(data);
      
      if (res.success) {
        setResult(res.credentials);
        reset({ role: 'user', name: '', email: '' });
        toast.success("User created successfully!", {
          description: "Credentials generated. Don't forget to share them.",
        });
      } else {
        toast.error("Creation Failed", {
          description: res.error || "An unexpected error occurred.",
        });
      }
    } catch (e) {
      toast.error("System Error", {
        description: "Failed to connect to the server. Please try again.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    // Only sharing Email & Password as requested
    const text = `Mind Namo Login\nEmail: ${result.email}\nPassword: ${result.tempPassword}`;
    
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Failed to copy"));
  };

  const handleRandomName = () => {
    const randomName = uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: ' ',
      length: 2,
      style: 'capital'
    });
    setValue("name", randomName);
    toast.info("Name Generated", { duration: 1500 });
  };

  // --- Render ---

  return (
    <div className="w-full space-y-8 pb-10 relative">
      
      {/* Configure Sonner Toaster (Bottom Right on Desktop, Bottom on Mobile) */}
      <Toaster position="bottom-right" richColors closeButton />

      {/* Header & Breadcrumbs */}
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard/users">User Management</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Create User</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create New Account</h1>
          <p className="text-slate-500 mt-2 text-lg">
            Generate secure access for new users, experts, or administrators.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* LEFT COLUMN: Input Form */}
        <div className="lg:col-span-3 relative">
          
          {/* Doodle: Background Abstract Shape */}
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -z-10 pointer-events-none"></div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
            {/* Doodle: Subtle corner icon */}
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <UserPlus size={120} strokeWidth={1} />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
              
              {/* Name Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User size={16} className="text-slate-400" />
                  Full Name
                </label>
                <div className="flex gap-3">
                  <Input 
                    {...register('name')} 
                    placeholder="e.g. Dr. Sarah Smith (Optional)" 
                    className="flex-1 bg-slate-50/30 focus:bg-white transition-all h-11"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleRandomName}
                    className="px-3 h-11 bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                    title="Generate Random Name"
                  >
                    <Wand2 size={18} />
                  </Button>
                </div>
                <p className="text-xs text-slate-400 pl-1">Leave empty to auto-generate a name.</p>
              </div>
              
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Mail size={16} className="text-slate-400" />
                  Email Address
                </label>
                <Input 
                  {...register('email')} 
                  placeholder="sarah@example.com" 
                  className={cn(
                    "h-11 bg-slate-50/30 focus:bg-white transition-all",
                    errors.email && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {errors.email && <p className="text-red-500 text-xs font-medium pl-1">{errors.email.message}</p>}
              </div>

              {/* Role Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Shield size={16} className="text-slate-400" />
                  Account Role
                </label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="w-full h-11 bg-slate-50/30 focus:bg-white transition-all">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            User (Client)
                          </div>
                        </SelectItem>
                        <SelectItem value="expert">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            Expert (Provider)
                          </div>
                        </SelectItem>
                        <SelectItem value="organisation">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            Organisation
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                            Admin
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit"
                  disabled={isPending} 
                  className="w-full h-12 text-base font-semibold shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 transition-all bg-slate-900 hover:bg-slate-800"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" /> Create Account
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Success / Preview */}
        <div className="lg:col-span-2 space-y-6">
          
          {result ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex flex-col shadow-lg shadow-emerald-500/5 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Background Doodle */}
              <div className="absolute -top-10 -right-10 text-emerald-100 opacity-60 rotate-12">
                <UserCheck size={180} strokeWidth={1.5} />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-sm border border-emerald-100">
                    <Check size={28} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-900 text-xl">Account Ready!</h3>
                    <p className="text-emerald-700 text-sm">Credentials generated successfully</p>
                  </div>
                </div>
                
                <div className="bg-white/70 backdrop-blur-md border border-emerald-200/60 p-6 rounded-xl space-y-5 shadow-sm">
                  {/* Name (Visual Only) */}
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                    <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Account Name</span>
                    <span className="font-semibold text-slate-900">{result.name}</span>
                  </div>
                  
                  {/* Email */}
                  <div>
                    <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Email</div>
                    <div className="font-mono text-sm text-slate-700 bg-white px-3 py-2 rounded-lg border border-emerald-100/50 block select-all">
                      {result.email}
                    </div>
                  </div>
                  
                  {/* Password */}
                  <div>
                    <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Temporary Password</div>
                    <div className="font-mono text-xl text-slate-900 font-bold select-all bg-emerald-50/50 p-3 rounded-lg border border-emerald-200/50 text-center tracking-wide">
                      {result.tempPassword}
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button 
                    onClick={copyToClipboard}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
                  >
                    {copied ? <Check className="mr-2 h-5 w-5" /> : <Copy className="mr-2 h-5 w-5" />}
                    {copied ? 'Copied to Clipboard' : 'Copy Credentials'}
                  </Button>
                  
                  <p className="text-center text-xs text-emerald-600/70 font-medium">
                    Shares only Email & Password
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center text-slate-400 h-full min-h-[400px] relative">
              {/* Empty State Illustration */}
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100 relative">
                <Sparkles size={40} className="text-slate-300" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-50 rounded-full border-2 border-white"></div>
              </div>
              
              <h3 className="text-slate-900 font-semibold mb-2 text-lg">Credentials Preview</h3>
              <p className="text-sm max-w-[240px] leading-relaxed">
                Fill out the details on the left to generate secure login credentials for the new user.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}