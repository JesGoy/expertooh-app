'use client';

import { useState } from 'react';
import ProtectedNavbar from './ProtectedNavbar';
import ProtectedSidebar from './ProtectedSidebar';

interface Props {
  username: string;
  profile: string;
  children: React.ReactNode;
}

export default function ProtectedLayoutClient({ username, profile, children }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <ProtectedSidebar 
        profile={profile} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Área principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <ProtectedNavbar 
          username={username} 
          profile={profile}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto bg-neutral-50">
          {children}
        </main>
      </div>
    </div>
  );
}
