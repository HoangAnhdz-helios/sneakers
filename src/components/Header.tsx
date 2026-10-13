import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from './Toast';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, category?: string, productAlias?: string) => void;
  onSearch: (searchTerm: string) => void;
  favoritesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onSearch,
  favoritesCount = 0
}) => {
  const { currentUser, profile, isAdmin, openLoginModal, logout } = useAuth();
  const { cartCount, openCheckout } = useCart();
  const { showToast } = useToast();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
      onNavigate('collection', 'ALL');
    }
  };

  const handleLogoutClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setUserDropdownOpen(false);
    try {
      await logout();
      showToast('Đã đăng xuất thành công!', 'info');
      onNavigate('home');
    } catch {
      showToast('Lỗi khi đăng xuất', 'error');
    }
  };

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-brand-dark text-white text-[11px] md:text-xs font-semibold py-2 px-4 flex justify-between items-center relative z-50">
        <div className="hidden md:flex space-x-6">
          <button
            onClick={() => onNavigate('home')}
            className="hover:text-gray-300 transition flex items-center cursor-pointer"
          >
            <i className="ph ph-map-pin mr-1 text-base"></i>PhuAnh Sneaker
          </button>
          <a href="tel:0397233999" className="hover:text-gray-300 transition flex items-center">
            <i className="ph ph-phone mr-1 text-base"></i>Hotline: 0397233999
          </a>
        </div>
        <div className="w-full md:w-auto text-center animate-pulse text-brand-red font-bold tracking-wider">
          SẢN PHẨM MỚI CẬP NHẬT TẠI PHUANH SNEAKER
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <a href="mailto:phuanhsneaker@gmail.com" className="hover:text-gray-300 transition">
            phuanhsneaker@gmail.com
          </a>
          <span className="text-gray-600">|</span>
          {currentUser ? (
            <button
              onClick={() => onNavigate('account')}
              className="hover:text-brand-red transition cursor-pointer font-bold"
            >
              Xin chào, {profile?.displayName || currentUser.email?.split('@')[0]}
            </button>
          ) : (
            <button
              onClick={openLoginModal}
              className="hover:text-gray-300 transition cursor-pointer"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 left-0 right-0 w-full bg-white shadow-sm z-40 border-b border-gray-100 transition-all duration-300 ${
          isScrolled ? 'py-2.5' : 'py-4'
        }`}
        id="main-header"
      >
        <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden text-2xl text-black focus:outline-none p-1 cursor-pointer"
            aria-label="Mở menu di động"
          >
            <i className="ph ph-list"></i>
          </button>

          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex-shrink-0 flex items-center cursor-pointer text-left"
          >
            <div className="font-black text-2xl md:text-3xl tracking-tighter text-black uppercase flex flex-col leading-none">
              <span>PHUANH</span>
              <span className="text-brand-red text-xl md:text-2xl mt-0.5">SNEAKER</span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 font-bold text-[13px] tracking-wide relative">
            <button
              onClick={() => onNavigate('home')}
              className={`nav-link transition py-4 cursor-pointer uppercase ${
                currentView === 'home' ? 'text-brand-red' : 'text-black hover:text-brand-red'
              }`}
            >
              TRANG CHỦ
            </button>

            {/* Product with Mega Menu */}
            <div className="group py-4 cursor-pointer relative">
              <button
                onClick={() => onNavigate('collection', 'ALL')}
                className="nav-link text-black hover:text-brand-red transition flex items-center cursor-pointer uppercase"
              >
                SẢN PHẨM <i className="ph ph-caret-down ml-1 text-gray-400"></i>
              </button>
              {/* Mega Menu Dropdown */}
              <div className="mega-menu absolute top-full left-0 w-[600px] bg-white border border-gray-100 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-50 flex p-6 gap-8">
                <div className="w-1/3">
                  <h4 className="font-black text-sm mb-4 border-b pb-2">DÒNG SẢN PHẨM</h4>
                  <ul className="space-y-3 text-sm font-medium text-gray-500">
                    <li>
                      <button
                        onClick={() => onNavigate('collection', 'TIGER')}
                        className="hover:text-brand-red hover:translate-x-1 block transition transform text-left w-full cursor-pointer"
                      >
                        Tiger
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => onNavigate('collection', 'JD')}
                        className="hover:text-brand-red hover:translate-x-1 block transition transform text-left w-full cursor-pointer"
                      >
                        JD
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => onNavigate('collection', 'NIKE')}
                        className="hover:text-brand-red hover:translate-x-1 block transition transform text-left w-full cursor-pointer"
                      >
                        Nike SB58
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => onNavigate('collection', 'LV')}
                        className="hover:text-brand-red hover:translate-x-1 block transition transform text-left w-full cursor-pointer"
                      >
                        LV
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => onNavigate('collection', 'VANS')}
                        className="hover:text-brand-red hover:translate-x-1 block transition transform text-left w-full cursor-pointer"
                      >
                        Vans
                      </button>
                    </li>
                  </ul>
                </div>
                <div
                  onClick={() => onNavigate('collection', 'TIGER')}
                  className="w-2/3 relative overflow-hidden group/img rounded cursor-pointer"
                >
                  <img
                    src="https://bizweb.dktcdn.net/thumb/large/100/623/516/products/z7841003971170-cccce3f2d2b2842c1d6fcd1222dd345f-1779179014463.jpg?v=1779186926737"
                    className="w-full h-full object-cover transform transition duration-700 group-hover/img:scale-110"
                    alt="tiger kem hồng"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white font-black text-xl tracking-widest border-2 border-white px-4 py-2 hover:bg-white hover:text-black transition">
                      PHUANH SNEAKER
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('collection', 'TIGER')}
              className="nav-link text-black hover:text-brand-red transition py-4 cursor-pointer uppercase"
            >
              TIGER
            </button>
            <button
              onClick={() => onNavigate('collection', 'JD')}
              className="nav-link text-black hover:text-brand-red transition py-4 cursor-pointer uppercase"
            >
              JD
            </button>
            <button
              onClick={() => onNavigate('collection', 'NIKE')}
              className="nav-link text-black hover:text-brand-red transition py-4 cursor-pointer uppercase"
            >
              NIKE
            </button>
            <button
              onClick={() => onNavigate('collection', 'MLB')}
              className="nav-link text-black hover:text-brand-red transition py-4 cursor-pointer uppercase"
            >
              MLB
            </button>
            <button
              onClick={() => onNavigate('collection', 'LV')}
              className="nav-link text-black hover:text-brand-red transition py-4 cursor-pointer uppercase"
            >
              LV
            </button>
            <button
              onClick={() => onNavigate('collection', 'ALL')}
              className="nav-link text-red-600 hover:text-red-800 transition py-4 flex items-center cursor-pointer uppercase font-black"
            >
              <i className="ph-fill ph-fire text-lg mr-1 text-red-600"></i> XEM TẤT CẢ
            </button>
          </nav>

          {/* Right Icons & Search */}
          <div className="flex items-center space-x-3 md:space-x-4 xl:space-x-6">
            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex relative group">
              <input
                type="text"
                placeholder="Tìm sản phẩm..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="bg-gray-100 text-sm font-medium rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-black w-36 transition-all duration-300 focus:w-56 border border-transparent focus:bg-white"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black cursor-pointer"
              >
                <i className="ph ph-magnifying-glass text-lg"></i>
              </button>
            </form>

            {/* Mobile Search Button */}
            <button
              onClick={() => onNavigate('collection', 'ALL')}
              className="md:hidden text-2xl text-black hover:text-brand-red p-1 cursor-pointer"
              title="Tìm kiếm"
            >
              <i className="ph ph-magnifying-glass"></i>
            </button>

            {/* User Account Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  if (!currentUser) {
                    openLoginModal();
                  } else {
                    setUserDropdownOpen(!userDropdownOpen);
                  }
                }}
                className="text-2xl text-black hover:text-brand-red transition p-1 cursor-pointer flex items-center"
                title={currentUser ? (profile?.displayName || currentUser.email || 'Tài khoản') : 'Tài khoản'}
              >
                <i className={currentUser ? 'ph-fill ph-user-circle text-brand-red' : 'ph ph-user'}></i>
              </button>

              {currentUser && userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-lg shadow-2xl z-50 py-2 animate-slide-in"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500">Đăng nhập với</p>
                    <p className="text-sm font-bold text-black truncate">{currentUser.email}</p>
                    {isAdmin && (
                      <span className="inline-block mt-1 bg-red-100 text-brand-red text-[10px] font-black px-2 py-0.5 rounded">
                        QUẢN TRỊ VIÊN
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate('account', 'profile');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-brand-red flex items-center transition cursor-pointer"
                  >
                    <i className="ph ph-user-circle mr-3 text-lg"></i>Hồ sơ cá nhân
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate('account', 'orders');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-brand-red flex items-center transition cursor-pointer"
                  >
                    <i className="ph ph-package mr-3 text-lg"></i>Đơn hàng của tôi
                  </button>

                  {isAdmin && (
                    <>
                      <div className="my-1 border-t border-gray-100"></div>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('admin');
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-bold text-brand-red hover:bg-red-50 flex items-center transition cursor-pointer"
                      >
                        <i className="ph ph-lightning mr-3 text-lg"></i>Admin Panel
                      </button>
                    </>
                  )}

                  <div className="my-1 border-t border-gray-100"></div>
                  <button
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-brand-red flex items-center transition cursor-pointer"
                  >
                    <i className="ph ph-sign-out mr-3 text-lg"></i>Đăng xuất
                  </button>
                </div>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={() => {
                if (!currentUser) {
                  openLoginModal();
                } else {
                  onNavigate('account', 'wishlist');
                }
              }}
              className="text-2xl text-black hover:text-brand-red transition p-1 cursor-pointer relative"
              title="Sản phẩm yêu thích"
            >
              <i className="ph ph-heart"></i>
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={openCheckout}
              className="text-2xl text-black hover:text-brand-red transition relative flex items-center p-1 cursor-pointer"
              aria-label="Mở giỏ hàng"
            >
              <i className="ph ph-shopping-bag"></i>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-brand-red text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border border-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex">
            <div className="bg-white w-[85%] max-w-sm h-full shadow-2xl flex flex-col animate-slide-in">
              <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                <div className="font-black text-xl tracking-tighter text-black uppercase flex flex-col leading-none">
                  <span>PHUANH</span>
                  <span className="text-brand-red text-lg">SNEAKER</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl text-gray-600 hover:text-brand-red bg-gray-200 rounded-full p-1 cursor-pointer"
                >
                  <i className="ph ph-x"></i>
                </button>
              </div>

              <div className="p-4 border-b">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    placeholder="Tìm giày..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    className="w-full bg-gray-100 text-sm font-medium rounded px-3 py-2.5 pr-10 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    <i className="ph ph-magnifying-glass"></i>
                  </button>
                </form>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col py-2">
                  <button
                    onClick={() => {
                      onNavigate('home');
                      setMobileMenuOpen(false);
                    }}
                    className="px-5 py-3.5 border-b border-gray-100 text-sm font-bold text-left text-brand-red"
                  >
                    TRANG CHỦ
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('collection', 'ALL');
                      setMobileMenuOpen(false);
                    }}
                    className="px-5 py-3.5 border-b border-gray-100 text-sm font-bold flex justify-between items-center hover:bg-gray-50 text-left"
                  >
                    SẢN PHẨM <i className="ph ph-caret-right text-gray-400"></i>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('collection', 'TIGER');
                      setMobileMenuOpen(false);
                    }}
                    className="px-5 py-3.5 border-b border-gray-100 text-sm font-bold flex justify-between items-center hover:bg-gray-50 text-left"
                  >
                    TIGER <i className="ph ph-caret-right text-gray-400"></i>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('collection', 'JD');
                      setMobileMenuOpen(false);
                    }}
                    className="px-5 py-3.5 border-b border-gray-100 text-sm font-bold flex justify-between items-center hover:bg-gray-50 text-left"
                  >
                    JD <i className="ph ph-caret-right text-gray-400"></i>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('collection', 'NIKE');
                      setMobileMenuOpen(false);
                    }}
                    className="px-5 py-3.5 border-b border-gray-100 text-sm font-bold flex justify-between items-center hover:bg-gray-50 text-left"
                  >
                    NIKE <i className="ph ph-caret-right text-gray-400"></i>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('collection', 'MLB');
                      setMobileMenuOpen(false);
                    }}
                    className="px-5 py-3.5 border-b border-gray-100 text-sm font-bold flex justify-between items-center hover:bg-gray-50 text-left"
                  >
                    MLB <i className="ph ph-caret-right text-gray-400"></i>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('collection', 'LV');
                      setMobileMenuOpen(false);
                    }}
                    className="px-5 py-3.5 border-b border-gray-100 text-sm font-bold flex justify-between items-center hover:bg-gray-50 text-left"
                  >
                    LV <i className="ph ph-caret-right text-gray-400"></i>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('collection', 'ALL');
                      setMobileMenuOpen(false);
                    }}
                    className="px-5 py-3.5 text-sm font-bold text-red-600 bg-red-50 flex items-center text-left"
                  >
                    <i className="ph-fill ph-fire mr-2"></i> XEM TẤT CẢ
                  </button>
                </div>
              </div>

              <div className="p-5 bg-gray-50 border-t space-y-3">
                {currentUser ? (
                  <>
                    <button
                      onClick={() => {
                        onNavigate('account');
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center text-sm font-semibold text-gray-700 hover:text-brand-red w-full text-left"
                    >
                      <i className="ph ph-user mr-3 text-xl"></i> {currentUser.email}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          onNavigate('admin');
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center text-sm font-bold text-brand-red hover:text-red-700 w-full text-left"
                      >
                        <i className="ph ph-lightning mr-3 text-xl"></i> Admin Panel
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        await logout();
                        setMobileMenuOpen(false);
                        showToast('Đã đăng xuất', 'info');
                      }}
                      className="flex items-center text-sm font-semibold text-gray-600 hover:text-black w-full text-left"
                    >
                      <i className="ph ph-sign-out mr-3 text-xl"></i> Đăng xuất
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      openLoginModal();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center text-sm font-semibold text-gray-700 hover:text-brand-red w-full text-left"
                  >
                    <i className="ph ph-user mr-3 text-xl"></i> Đăng nhập / Đăng ký
                  </button>
                )}
                <a
                  href="tel:0397233999"
                  className="flex items-center text-sm font-semibold text-gray-700 hover:text-brand-red w-full text-left"
                >
                  <i className="ph ph-headset mr-3 text-xl"></i> Hotline: 0397233999
                </a>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
          </div>
        )}
      </header>
    </>
  );
};
