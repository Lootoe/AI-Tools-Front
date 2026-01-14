import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import Logo from '@/img/logo.webp';
import CoinIcon from '@/img/coin.webp';

interface AppNavbarProps {
  rightContent?: React.ReactNode;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({ rightContent }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  const handleLogoutClick = () => {
    setShowDropdown(false);
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    navigate('/home');
    setShowLogoutConfirm(false);
  };

  return (
    <div
      className="relative z-10 h-14 flex items-center justify-between px-4"
      style={{
        borderBottom: '1px solid #1e1e2e',
        backgroundColor: 'rgba(10,10,15,0.8)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-2">
        {/* Logo - 纯展示，无点击效果 */}
        <div className="flex items-center gap-2 px-2 py-1.5">
          <img src={Logo} alt="喵想" className="h-8 w-auto" />
          <span className="font-bold text-lg tracking-wide text-white">
            喵想
          </span>
        </div>

        <div className="h-5 w-px" style={{ backgroundColor: '#1e1e2e' }} />

        {/* 剧本按钮 */}
        <button
          onClick={() => navigate('/video')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-cyan-400 transition-all hover:bg-white/5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          剧本
        </button>

        {/* 白梦写作友情链接 */}
        <a
          href="https://baimengxiezuo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-purple-400 transition-all hover:bg-white/5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          白梦写作
        </a>

        {rightContent && (
          <>
            <div className="h-4 w-px" style={{ backgroundColor: '#1e1e2e' }} />
            {rightContent}
          </>
        )}
      </div>

      {/* 右侧：余额显示 + 个人中心入口 */}
      <div className="flex items-center gap-3" ref={dropdownRef}>
        {/* 代币显示 - 优化样式 */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
            border: '1px solid rgba(251, 191, 36, 0.4)',
            boxShadow: '0 0 12px rgba(251, 191, 36, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
          onClick={() => navigate('/profile')}
        >
          <img src={CoinIcon} alt="余额" className="w-5 h-5 drop-shadow-lg" />
          <span
            className="text-sm font-bold tracking-wide"
            style={{
              background: 'linear-gradient(90deg, #fcd34d, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 20px rgba(251, 191, 36, 0.5)',
            }}
          >
            {Math.floor(user?.balance ?? 0)}
          </span>
        </div>

        {/* 个人中心入口 - 头像优化 */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-1.5 py-1.5 rounded-lg transition-all hover:bg-white/5 group"
          >
            {/* 用户头像 - 圆角方形 */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white transition-transform group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                border: '1px solid rgba(0, 245, 255, 0.3)',
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
                onClick={handleLogoutClick}
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

      {/* 退出登录确认弹窗 */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="退出登录"
        message="确定要退出当前账号吗？"
        type="warning"
        confirmText="退出"
        cancelText="取消"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};
