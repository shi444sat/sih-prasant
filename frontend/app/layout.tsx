'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import TopNavbar from '@/components/TopNavbar';
import DisclaimerBanner from '@/components/DisclaimerBanner';
import GlobalSearchModal from '@/components/GlobalSearchModal';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isLoginPage = pathname === '/login';

  return (
    <>
      <GlobalSearchModal />

      {isLandingPage || isLoginPage ? (
        <main className="min-h-screen bg-[#FFFFFF]">{children}</main>
      ) : (
        <div className="flex min-h-screen bg-[#F7F8FA]">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 bg-[#F7F8FA]">
            <DisclaimerBanner />
            <TopNavbar />
            <main className="flex-1 p-6 max-w-[1500px] w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      )}
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Project Drishti | Infrastructure Project Intelligence & Early Warning System</title>
        <meta
          name="description"
          content="Integrated infrastructure project-monitoring platform developed for SIH26103 (MoSPI DIID). Predictive risk indicators and early intervention."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-[#F7F8FA] text-[#17202A] font-sans antialiased selection:bg-[#F0F6FB] selection:text-[#245B8F]">
        <AppProvider>
          <AppShellContent>{children}</AppShellContent>
        </AppProvider>
      </body>
    </html>
  );
}
