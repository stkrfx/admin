'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle2, Trash2, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DialogConfirm({ 
  open, 
  onOpenChange, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  isLoading,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive", // 'destructive' | 'default' | 'success'
  icon = "default" // 'trash' | 'ban' | 'check' | 'default'
}) {
  
  // Icon Mapping for Visual Feedback
  const icons = {
    trash: <Trash2 size={32} className="text-red-600" />,
    ban: <Ban size={32} className="text-amber-600" />,
    check: <CheckCircle2 size={32} className="text-green-600" />,
    default: <AlertTriangle size={32} className="text-slate-900" />
  };

  // Background styles based on variant
  const headerStyles = {
    destructive: "bg-red-50 border-red-100",
    success: "bg-green-50 border-green-100",
    default: "bg-slate-50 border-slate-100"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-0 shadow-2xl gap-0">
        
        {/* Visual Header */}
        <div className={cn("p-8 flex flex-col items-center justify-center text-center border-b", headerStyles[variant] || headerStyles.default)}>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            {icons[icon] || icons.default}
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 text-center">
              {title}
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-2 text-center leading-relaxed">
              {message}
            </p>
          </DialogHeader>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-6 bg-white gap-3 sm:gap-0 sm:flex-row-reverse sm:justify-between">
          <Button 
            variant={variant === 'success' ? 'default' : variant} 
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto min-w-[120px]"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={onCancel || (() => onOpenChange(false))}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}