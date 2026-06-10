export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB] px-4 py-10">
      {children}
    </div>
  );
}
