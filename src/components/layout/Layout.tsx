import React from 'react';
import Navbar from './Navbar';

export interface LayoutProps {
  children: React.ReactNode;
  navbarTitle?: string;
  navbarLeft?: React.ReactNode;
  navbarRight?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, navbarTitle }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {navbarTitle && (
        <Navbar title={navbarTitle} />
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;

