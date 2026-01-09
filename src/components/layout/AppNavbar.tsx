import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Logo from '@/img/Logo.png';
import CoinIcon from '@/img/coin.png';

interface AppNavbarProps {
  rightContent?: React.ReactNode;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({ rightContent }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/home');
    setShowDropdown(false);
  };

  return (
    <div
      className="relative z-10 h-12 flex items-center justify-between px-4"
      style={{
        borderBottom: '1px solid #1e1e2e',
        backgroundColor: 'rgba(10,10,15,0.8)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/video')}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all group relative overflow-hidden"
        >
          {/* 动态光效背景 */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.1), rgba(191,0,255,0.1), transparent)',
            }}
          />
          {/* Logo图标 */}
          <img src={Logo} alt="喵想" className="h-6 w-auto" />
          {/* Logo文字 */}
          <span className="relative font-bold text-base tracking-wide text-white">
            喵想
          </span>
        </button>

        {rightContent && (
          <>
            <div className="h-4 w-px" style={{ backgroundColor: '#1e1e2e' }} />
            {rightContent}
          </>
        )}
      </div>

      {/* 右侧：余额显示 + 个人中心入口 */}
      <div className="flex items-center gap-3" ref={dropdownRef}>
        {/* 余额显示 */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
          }}
        >
          <img src={CoinIcon} alt="余额" className="w-6 h-6" />
          <span
            className="text-sm font-medium"
            style={{
              background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {Math.floor(user?.balance ?? 0)}
          </span>
        </div>

        {/* 个人中心入口 */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all hover:bg-white/5"
          >
            {/* 用户头像 */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: 'linear-gradient(135deg, #00f5ff, #bf00ff)',
                boxShadow: '0 0 10px rgba(0, 245, 255, 0.3)',
              }}
            >
              {(user?.nickname || user?.email || '用').charAt(0).toUpperCase()}
            </div>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* 下拉菜单 */}
          {showDropdown && (
            <div
              className="absolute right-0 top-full mt-2 w-40 rounded-lg py-1 shadow-xl"
              style={{
                backgroundColor: 'rgba(20, 20, 35, 0.95)',
                border: '1px solid rgba(60, 60, 80, 0.5)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <button
                onClick={() => {
                  navigate('/profile');
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:text-cyan-400 hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                个人中心
              </button>
              <div className="h-px mx-2" style={{ backgroundColor: 'rgba(60, 60, 80, 0.5)' }} />
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
