const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface User {
  id: string;
  email: string;
  nickname: string | null;
  avatar: string | null;
  balance: number;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

// 发送验证码
export async function sendVerificationCode(
  email: string,
  type: 'register' | 'reset_password' = 'register'
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${BACKEND_URL}/api/auth/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, type }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || '发送验证码失败');
  }
  return data;
}

// 注册
export async function register(
  email: string,
  password: string,
  code: string,
  nickname?: string
): Promise<AuthResponse> {
  const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, code, nickname }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || '注册失败');
  }

  // 保存 token
  localStorage.setItem('token', data.token);
  return data;
}

// 登录
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || '登录失败');
  }

  // 保存 token
  localStorage.setItem('token', data.token);
  return data;
}

// 获取当前用户
export async function getCurrentUser(): Promise<User | null> {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      localStorage.removeItem('token');
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch {
    return null;
  }
}

// 退出登录
export function logout(): void {
  localStorage.removeItem('token');
}
