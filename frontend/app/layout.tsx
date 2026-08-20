import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { DashboardProvider } from "./DashboardContext";
import { AuthProvider } from "./AuthContext";
import AppShell from "./AppShell";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "DTG CRM | Digitalize The Globe",
  description: "Digitalize The Globe CRM & Real Estate Dashboard",
  icons: {
    icon: "/logo/Dtg_new_logo.png",
    
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#FDFCFB]">
        <AuthProvider>
          <DashboardProvider>
            <AppShell>{children}</AppShell>
          </DashboardProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
