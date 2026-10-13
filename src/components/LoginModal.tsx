import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { loginWithEmail, registerWithEmail, loginWithGoogle, resetUserPassword } from '../services/authService';
import { useToast } from './Toast';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<{ isOperationNotAllowed?: boolean; message: string } | null>(null);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [forgotEmail, setForgotEmail] = useState('');

  if (!isLoginModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!loginEmail || !loginPassword) {
      showToast('Vui lòng nhập email và mật khẩu', 'error');
      return;
    }
    setLoading(true);
    try {
      const user = await loginWithEmail(loginEmail.trim(), loginPassword);
      await refreshProfile();
      showToast(`Xin chào, ${user.displayName || user.email}!`, 'success');
      closeLoginModal();
    } catch (err: any) {
      const isNotAllowed = err.code === 'auth/operation-not-allowed' || String(err.message).includes('operation-not-allowed');
      if (isNotAllowed) {
        setAuthError({
          isOperationNotAllowed: true,
          message: 'Phương thức đăng nhập Email/Mật khẩu chưa được bật trong Firebase Console.'
        });
        showToast('Phương thức Email/Mật khẩu chưa được kích hoạt trong Firebase Console.', 'error');
      } else {
        const msg = err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.';
        setAuthError({ message: msg });
        showToast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!regName || !regEmail || !regPassword) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }
    if (regPassword !== regConfirm) {
      showToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }
    if (regPassword.length < 6) {
      showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error');
      return;
    }
    if (!agreeTerms) {
      showToast('Vui lòng đồng ý với điều khoản sử dụng', 'error');
      return;
    }

    setLoading(true);
    try {
      const user = await registerWithEmail(regName.trim(), regEmail.trim(), regPassword);
      await refreshProfile();
      showToast(`Đăng ký thành công! Chào mừng ${user.displayName}.`, 'success');
      closeLoginModal();
    } catch (err: any) {
      const isNotAllowed = err.code === 'auth/operation-not-allowed' || String(err.message).includes('operation-not-allowed');
      if (isNotAllowed) {
        setAuthError({
          isOperationNotAllowed: true,
          message: 'Phương thức đăng ký Email/Mật khẩu chưa được bật trong Firebase Console.'
        });
        showToast('Phương thức Email/Mật khẩu chưa được kích hoạt trong Firebase Console.', 'error');
      } else {
        const msg = err.message || 'Đăng ký thất bại.';
        setAuthError({ message: msg });
        showToast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      await refreshProfile();
      showToast(`Đăng nhập Google thành công: ${user.displayName}!`, 'success');
      closeLoginModal();
    } catch (err: any) {
      showToast(err.message || 'Đăng nhập Google thất bại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast('Vui lòng nhập địa chỉ email', 'error');
      return;
    }
    setLoading(true);
    try {
      await resetUserPassword(forgotEmail.trim());
      showToast('Đã gửi email khôi phục mật khẩu! Vui lòng kiểm tra hòm thư.', 'success');
      setActiveTab('login');
    } catch (err: any) {
      showToast(err.message || 'Không thể gửi email khôi phục.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setLoginEmail('imperblorius@gmail.com');
    setLoginPassword('Admin@123456');
    showToast('Đã điền email Admin: imperblorius@gmail.com', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeLoginModal}
      ></div>

      {/* Modal Dialog */}
      <div className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden relative z-10 animate-slide-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-dark to-brand-red text-white px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">PhuAnh</h2>
            <p className="text-red-200 text-xs font-bold tracking-widest uppercase">SNEAKER AUTHENTIC</p>
          </div>
          <button
            onClick={closeLoginModal}
            className="text-2xl hover:text-gray-200 transition p-1 cursor-pointer"
          >
            <i className="ph ph-x"></i>
          </button>
        </div>

        {/* Tabs */}
        {activeTab !== 'forgot' && (
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                setActiveTab('login');
                setAuthError(null);
              }}
              className={`flex-1 py-3 text-sm font-bold text-center cursor-pointer border-b-2 transition ${
                activeTab === 'login'
                  ? 'border-brand-red text-brand-red bg-white'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              <i className="ph ph-sign-in mr-2"></i>Đăng nhập
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setAuthError(null);
              }}
              className={`flex-1 py-3 text-sm font-bold text-center cursor-pointer border-b-2 transition ${
                activeTab === 'register'
                  ? 'border-brand-red text-brand-red bg-white'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              <i className="ph ph-user-plus mr-2"></i>Đăng ký
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {/* Operation not allowed Guide Callout */}
          {authError?.isOperationNotAllowed && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-300 rounded text-xs text-amber-950 space-y-2">
              <div className="flex items-center font-bold text-amber-900">
                <i className="ph-fill ph-warning-circle text-lg mr-1.5 text-amber-600"></i>
                <span>Lỗi `auth/operation-not-allowed`</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Phương thức <strong>Email/Mật khẩu</strong> mặc định chưa được bật trong Firebase Console (Firebase chỉ cấu hình sẵn Google Sign-In).
              </p>
              <div className="pt-1 space-y-1.5">
                <p className="font-bold text-black text-[11px]">👉 2 cách xử lý:</p>
                <div className="bg-white p-2 rounded border border-amber-200 text-[11px]">
                  <strong>Cách 1 (Nhanh nhất - Không cần cấu hình):</strong> Bấm nút <span className="font-bold text-brand-red">"Đăng nhập với Google"</span> ngay bên dưới với tài khoản <code>imperblorius@gmail.com</code> để vào thẳng Admin!
                </div>
                <div className="bg-white p-2 rounded border border-amber-200 text-[11px]">
                  <strong>Cách 2 (Bật Email/Password):</strong> Vào{' '}
                  <a
                    href="https://console.firebase.google.com/project/autonomous-emblem-b5p7n/authentication/providers"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-bold underline"
                  >
                    Firebase Console &gt; Sign-in method
                  </a>
                  , chọn <strong>Email/Password</strong>, gạt nút <strong>Enable</strong> và bấm <strong>Save</strong>.
                </div>
              </div>
            </div>
          )}

          {authError && !authError.isOperationNotAllowed && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium">
              {authError.message}
            </div>
          )}

          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Google Sign-in Recommended Banner */}
              <div className="mb-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-50 border-2 border-gray-800 hover:border-brand-red font-black py-2.5 px-4 rounded text-xs md:text-sm text-gray-900 flex items-center justify-center space-x-2.5 transition cursor-pointer shadow-sm group"
                >
                  <i className="ph-fill ph-google-logo text-xl text-red-600"></i>
                  <span>Đăng nhập với Google</span>
                  <span className="text-[10px] bg-red-100 text-brand-red px-1.5 py-0.5 rounded font-bold uppercase ml-1">
                    Khuyên dùng
                  </span>
                </button>
                <p className="text-[10px] text-gray-500 text-center mt-1">
                  Đăng nhập với <strong>imperblorius@gmail.com</strong> để mở khóa quyền Admin Panel ngay lập tức.
                </p>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-3 text-gray-400 text-[11px] font-bold uppercase">Hoặc Email / Mật khẩu</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="imperblorius@gmail.com"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded font-medium focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded font-medium focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red text-sm"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center text-gray-600 font-medium cursor-pointer">
                  <input type="checkbox" defaultChecked className="mr-2 accent-black" />
                  Nhớ mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('forgot');
                    setAuthError(null);
                  }}
                  className="font-bold text-brand-red hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-red text-white font-black py-3 rounded uppercase tracking-wider hover:bg-black transition cursor-pointer text-sm disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Đăng nhập với Email'}
              </button>

              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-black">Tài khoản Quản trị:</span>
                  <button
                    type="button"
                    onClick={fillAdminCredentials}
                    className="text-brand-red font-bold hover:underline cursor-pointer"
                  >
                    Điền nhanh
                  </button>
                </div>
                <p className="font-mono text-brand-red truncate">imperblorius@gmail.com</p>
              </div>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-50 border-2 border-gray-800 font-black py-2.5 px-4 rounded text-xs md:text-sm text-gray-900 flex items-center justify-center space-x-2 transition cursor-pointer shadow-sm"
                >
                  <i className="ph-fill ph-google-logo text-xl text-red-600"></i>
                  <span>Đăng ký nhanh với Google</span>
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-3 text-gray-400 text-[11px] font-bold uppercase">Hoặc điền form</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded font-medium focus:outline-none focus:border-brand-red text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded font-medium focus:outline-none focus:border-brand-red text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded font-medium focus:outline-none focus:border-brand-red text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  value={regConfirm}
                  onChange={e => setRegConfirm(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded font-medium focus:outline-none focus:border-brand-red text-sm"
                />
              </div>

              <label className="flex items-start text-xs text-gray-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="mr-2 mt-0.5 accent-black"
                />
                <span>
                  Tôi đồng ý với <span className="text-brand-red font-bold">Điều khoản sử dụng</span> và chính sách bảo mật của PhuAnh Sneaker.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-red text-white font-black py-3 rounded uppercase tracking-wider hover:bg-black transition cursor-pointer text-sm disabled:opacity-50"
              >
                {loading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
              </button>
            </form>
          )}

          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-gray-600 mb-2">
                Nhập địa chỉ email của bạn, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded font-medium focus:outline-none focus:border-brand-red text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white font-black py-3 rounded uppercase tracking-wider hover:bg-brand-red transition cursor-pointer text-sm disabled:opacity-50"
              >
                {loading ? 'Đang gửi...' : 'Gửi link khôi phục'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setAuthError(null);
                }}
                className="w-full text-center text-xs font-bold text-gray-600 hover:text-black py-1 cursor-pointer"
              >
                ← Quay lại đăng nhập
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3.5 text-center border-t border-gray-200">
          <p className="text-xs text-gray-500">
            🔒 Bảo mật và mã hóa Firebase Authentication
          </p>
        </div>
      </div>
    </div>
  );
};
