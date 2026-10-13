import React from 'react';

interface FooterProps {
  onNavigate: (view: string, category?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <>
      {/* Services / Features (Global) */}
      <section className="border-t border-b border-gray-200 py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <i className="ph ph-truck text-4xl mb-3 text-black"></i>
              <h4 className="font-bold text-sm uppercase mb-1">Giao hàng toàn quốc</h4>
              <p className="text-xs text-gray-500">Nhận đơn và tư vấn qua hotline</p>
            </div>
            <div className="flex flex-col items-center">
              <i className="ph ph-shield-check text-4xl mb-3 text-black"></i>
              <h4 className="font-bold text-sm uppercase mb-1">Sản phẩm PhuAnh</h4>
              <p className="text-xs text-gray-500">Danh mục được cập nhật thường xuyên</p>
            </div>
            <div className="flex flex-col items-center">
              <i className="ph ph-arrows-left-right text-4xl mb-3 text-black"></i>
              <h4 className="font-bold text-sm uppercase mb-1">Liên hệ cửa hàng</h4>
              <p className="text-xs text-gray-500">Email: phuanhsneaker@gmail.com</p>
            </div>
            <div className="flex flex-col items-center">
              <i className="ph ph-headset text-4xl mb-3 text-black"></i>
              <h4 className="font-bold text-sm uppercase mb-1">Hỗ trợ khách hàng</h4>
              <p className="text-xs text-gray-500">Hotline: 0397233999</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Main */}
      <footer className="bg-brand-dark text-gray-300 pt-16 pb-8 border-t-[6px] border-brand-red">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Col 1: About */}
            <div>
              <div className="font-black text-2xl tracking-tighter text-white uppercase flex flex-col leading-none mb-6">
                <span>PHUANH</span>
                <span className="text-brand-red text-xl">SNEAKER</span>
              </div>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                PhuAnh Sneaker cung cấp các mẫu sneaker đang cập nhật, nổi bật với nhiều lựa chọn Tiger, JD, Nike, MLB, LV, Vans, Puma và NB.
              </p>
              <div className="flex space-x-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-brand-red transition"
                  aria-label="Facebook"
                >
                  <i className="ph-fill ph-facebook-logo text-xl"></i>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-brand-red transition"
                  aria-label="Instagram"
                >
                  <i className="ph-fill ph-instagram-logo text-xl"></i>
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-brand-red transition"
                  aria-label="YouTube"
                >
                  <i className="ph-fill ph-youtube-logo text-xl"></i>
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-brand-red transition"
                  aria-label="TikTok"
                >
                  <i className="ph-fill ph-tiktok-logo text-xl"></i>
                </a>
              </div>
            </div>

            {/* Col 2: Links */}
            <div>
              <h4 className="text-white font-bold uppercase mb-6 tracking-wide text-sm border-l-2 border-brand-red pl-3">
                Về PhuAnh Sneaker
              </h4>
              <ul className="space-y-3 text-sm text-gray-400 font-medium">
                <li>
                  <button
                    onClick={() => onNavigate('home')}
                    className="hover:text-brand-red transition flex items-center cursor-pointer text-left"
                  >
                    <i className="ph ph-caret-right mr-2 text-xs"></i> Trang chủ
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('collection', 'ALL')}
                    className="hover:text-brand-red transition flex items-center cursor-pointer text-left"
                  >
                    <i className="ph ph-caret-right mr-2 text-xs"></i> Danh mục sản phẩm
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('collection', 'TIGER')}
                    className="hover:text-brand-red transition flex items-center cursor-pointer text-left"
                  >
                    <i className="ph ph-caret-right mr-2 text-xs"></i> Dòng giày Onitsuka Tiger
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('collection', 'JD')}
                    className="hover:text-brand-red transition flex items-center cursor-pointer text-left"
                  >
                    <i className="ph ph-caret-right mr-2 text-xs"></i> Dòng giày Air Jordan
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('collection', 'NIKE')}
                    className="hover:text-brand-red transition flex items-center cursor-pointer text-left"
                  >
                    <i className="ph ph-caret-right mr-2 text-xs"></i> Nike SB & Cortez
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Policy */}
            <div>
              <h4 className="text-white font-bold uppercase mb-6 tracking-wide text-sm border-l-2 border-brand-red pl-3">
                Hỗ trợ khách hàng
              </h4>
              <ul className="space-y-3 text-sm text-gray-400 font-medium">
                <li className="flex items-center">
                  <i className="ph ph-caret-right mr-2 text-xs"></i> Hướng dẫn chọn size giày
                </li>
                <li className="flex items-center">
                  <i className="ph ph-caret-right mr-2 text-xs"></i> Chính sách giao hàng toàn quốc
                </li>
                <li className="flex items-center">
                  <i className="ph ph-caret-right mr-2 text-xs"></i> Đổi trả trong 7 ngày
                </li>
                <li className="flex items-center">
                  <i className="ph ph-caret-right mr-2 text-xs"></i> Cam kết chất lượng
                </li>
                <li className="flex items-center">
                  <i className="ph ph-caret-right mr-2 text-xs"></i> Hotline tư vấn: 0397233999
                </li>
              </ul>
            </div>

            {/* Col 4: Newsletter */}
            <div>
              <h4 className="text-white font-bold uppercase mb-6 tracking-wide text-sm border-l-2 border-brand-red pl-3">
                Đăng ký nhận tin
              </h4>
              <p className="text-sm text-gray-400 mb-4">
                Đăng ký nhận thông tin sản phẩm mới và ưu đãi từ <span className="text-white font-bold">PhuAnh Sneaker</span>.
              </p>
              <form onSubmit={e => e.preventDefault()} className="flex mb-6 shadow-lg rounded overflow-hidden">
                <input
                  type="email"
                  placeholder="Nhập email của bạn..."
                  className="bg-gray-800 text-white px-4 py-3 w-full focus:outline-none focus:bg-gray-700 text-sm placeholder-gray-500"
                />
                <button
                  type="submit"
                  className="bg-brand-red text-white px-5 py-3 font-bold hover:bg-red-700 transition uppercase text-sm whitespace-nowrap cursor-pointer"
                >
                  <i className="ph-fill ph-paper-plane-right text-lg"></i>
                </button>
              </form>
              <div className="mt-4">
                <img
                  src="https://images.dmca.com/Badges/dmca_protected_sml_120m.png?ID=1"
                  alt="DMCA"
                  className="opacity-50 grayscale hover:grayscale-0 transition cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 font-medium">
            <p>&copy; 2026 PHUANH SNEAKER. Mọi quyền được bảo lưu.</p>
            <div className="flex space-x-3 mt-4 md:mt-0 items-center">
              <span>Thanh toán an toàn:</span>
              <i className="ph ph-stripe-logo text-3xl text-gray-400"></i>
              <i className="ph ph-visa-logo text-3xl text-gray-400"></i>
              <i className="ph ph-mastercard-logo text-3xl text-gray-400"></i>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
