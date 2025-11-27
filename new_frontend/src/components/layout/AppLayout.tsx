import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { ROUTES } from '../../types/careguide-ia';

const AppLayout: React.FC = () => {
  const location = useLocation();

  // Main page and login/signup don't need sidebar/header
  // 메인, 로그인, 회원가입 페이지는 사이드바/헤더 불필요
  const noLayoutPaths: readonly string[] = [ROUTES.MAIN, ROUTES.LOGIN, ROUTES.SIGNUP];
  const showLayout = !noLayoutPaths.includes(location.pathname);

  if (!showLayout) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop: Sidebar (lg and above) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Desktop: Header (lg and above) */}
      <div className="hidden lg:block">
        <Header />
      </div>

      {/* Mobile: Bottom Navigation (below lg) */}
      <MobileNav />

      {/* Main Content */}
      <main className="lg:pl-[280px] lg:pt-16 pb-20 lg:pb-6 min-h-screen">
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
