import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { DashboardProvider } from "./DashboardContext";
import DashboardLayout from "./DashboardLayout";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Rising CRM - Dashboard",
  description: "Rising Spaces Leads and CRM Dashboard",
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
        <DashboardProvider>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </DashboardProvider>
      </body>
    </html>
  );
}
