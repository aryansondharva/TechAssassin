import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { CheckCircle2, AlertTriangle, Info, Terminal, Sparkles } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Resolve a simple icon depending on the variant and content
        let Icon = Info;
        let isSuccess = false;
        
        if (variant === "destructive") {
          Icon = AlertTriangle;
        } else {
          const text = ((typeof title === "string" ? title : "") + " " + (typeof description === "string" ? description : "")).toLowerCase();
          if (text.includes("success") || text.includes("successfully") || text.includes("complete")) {
            Icon = CheckCircle2;
            isSuccess = true;
          } else if (text.includes("warning") || text.includes("alert")) {
            Icon = AlertTriangle;
          } else if (text.includes("tactical") || text.includes("mission") || text.includes("command") || text.includes("sync")) {
            Icon = Terminal;
          } else if (text.includes("achievement") || text.includes("unlock") || text.includes("aura") || text.includes("bounty")) {
            Icon = Sparkles;
          }
        }

        return (
          <Toast 
            key={id} 
            variant={variant} 
            {...props} 
            className="group relative pl-5 pr-10 py-3 flex items-center min-h-[50px] bg-white border border-slate-200/90 rounded-xl shadow-lg"
          >
            {/* Simple subtle left color strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${variant === "destructive" ? "bg-red-500" : isSuccess ? "bg-emerald-500" : "bg-slate-400"}`} />
            
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
                {title && (
                  <ToastTitle className={`${variant === "destructive" ? "text-red-600" : isSuccess ? "text-emerald-600" : "text-slate-800"} font-bold`}>
                    {title}
                  </ToastTitle>
                )}
                {title && description && <span className="text-slate-200 text-[10px] hidden sm:inline select-none">|</span>}
                {description && (
                  <ToastDescription className={`${variant === "destructive" ? "text-red-500" : isSuccess ? "text-emerald-500" : "text-slate-600"} font-medium max-w-full truncate`}>
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className="text-slate-400 hover:text-slate-600 hover:bg-slate-100" />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
