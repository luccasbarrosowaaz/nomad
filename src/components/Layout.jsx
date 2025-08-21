import React, { useState } from 'react';
import Header from '@/components/Header';
import MobileSidebar from '@/components/MobileSidebar';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Layout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-background text-foreground" key={user ? `layout-${user.id}` : 'layout-guest'}>
      <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;