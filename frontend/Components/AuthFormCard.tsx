import Image from "next/image";
import Link from "next/link";

interface AuthFormCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function AuthFormCard({ title, subtitle, children, footer }: AuthFormCardProps) {
  return (
    <div className="w-full max-w-md animate-fade-in-up">
      <div className="flex flex-col items-center mb-8">
        <div className="w-[160px] h-[56px] relative mb-6">
          <Image
            src="/logo/Dtg_new_logo.png"
            alt="Digitalize The Globe"
            width={160}
            height={56}
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-slate-500 text-sm mt-1.5 text-center">{subtitle}</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
        {children}
      </div>

      {footer && (
        <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
      )}
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-brand font-semibold hover:text-brand-hover transition-colors">
      {children}
    </Link>
  );
}

export const AUTH_INPUT_CLASS =
  "w-full border border-slate-200 rounded-xl px-4 py-3 text-[15px] text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all";

export const AUTH_LABEL_CLASS = "block text-sm font-semibold text-slate-700 mb-1.5";

export const AUTH_SUBMIT_CLASS =
  "w-full bg-brand hover:bg-brand-hover text-white font-bold text-[15px] py-3 rounded-xl shadow-md shadow-brand/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer";
