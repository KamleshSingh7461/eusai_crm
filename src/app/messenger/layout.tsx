import { ToastProvider } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

export default function MessengerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 bg-[#050505] text-white flex flex-col font-sans selection:bg-blue-500/30">
            <ToastProvider>
                {children}
            </ToastProvider>
        </div>
    );
}
