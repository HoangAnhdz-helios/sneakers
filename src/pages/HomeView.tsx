import React from 'react';
import { Banner, Product } from '../types';
import { HeroSlider } from '../components/HeroSlider';
import { BrandRibbon } from '../components/BrandRibbon';
import { ProductCard } from '../components/ProductCard';

interface HomeViewProps {
  products: Product[];
  banners: Banner[];
  onNavigate: (view: string, category?: string, productAlias?: string) => void;
  favorites?: string[];
  onToggleFavorite?: (productId: string | number) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  banners,
  onNavigate,
  favorites = [],
  onToggleFavorite
}) => {
  const newArrivals = products.slice(0, 8);
  const bestSellers = products.slice(8, 16);

  return (
    <div className="view-home animate-slide-in">
      {/* Hero Banner Carousel */}
      <HeroSlider banners={banners} onNavigate={onNavigate} />

      {/* Brand Ribbon */}
      <BrandRibbon onSelectBrand={brand => onNavigate('collection', brand)} />

      {/* New Arrivals Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 border-b border-gray-200 pb-4 gap-4">
            <div>
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-black">
                Sản phẩm mới
              </h2>
              <p className="text-gray-500 font-medium text-xs md:text-sm mt-1.5">
                Danh sách sản phẩm mới cập nhật tại PhuAnh Sneaker.
              </p>
            </div>
            <button
              onClick={() => onNavigate('collection', 'ALL')}
              className="inline-flex items-center text-xs md:text-sm font-black uppercase tracking-wider text-brand-red hover:text-black transition cursor-pointer"
            >
              Xem tất cả sản phẩm <i className="ph ph-arrow-right ml-1 text-base"></i>
            </button>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.map((prod, idx) => (
              <ProductCard
                key={prod.alias || prod.id}
                product={prod}
                index={idx}
                onSelect={alias => onNavigate('product', undefined, alias)}
                isFavorite={favorites.includes(String(prod.id)) || favorites.includes(prod.alias)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Collection Banner */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div
              onClick={() => onNavigate('collection', 'TIGER')}
              className="relative h-64 md:h-80 rounded overflow-hidden group cursor-pointer shadow-md"
            >
              <img
                src="https://bizweb.dktcdn.net/thumb/large/100/623/516/products/z7841003971170-cccce3f2d2b2842c1d6fcd1222dd345f-1779179014463.jpg?v=1779186926737"
                alt="Onitsuka Tiger"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 md:p-8">
                <span className="text-brand-red font-black text-xs uppercase tracking-widest mb-1">Xu hướng</span>
                <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                  ONITSUKA TIGER VINTAGE
                </h3>
                <p className="text-gray-300 text-xs md:text-sm mt-1 mb-3">
                  Kiểu dáng cổ điển thanh lịch, êm chân và dễ phối đồ hằng ngày.
                </p>
                <span className="text-white text-xs font-bold uppercase tracking-wider flex items-center group-hover:text-brand-red transition">
                  Khám phá ngay <i className="ph ph-arrow-right ml-1"></i>
                </span>
              </div>
            </div>

            <div
              onClick={() => onNavigate('collection', 'JD')}
              className="relative h-64 md:h-80 rounded overflow-hidden group cursor-pointer shadow-md"
            >
              <img
                src="https://i.pinimg.com/736x/1d/29/6d/1d296d408b5e2d305e67c3b0d888f62d.jpg?v=1767596173883"
                alt="Jordan"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 md:p-8">
                <span className="text-brand-red font-black text-xs uppercase tracking-widest mb-1">Nổi bật</span>
                <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                  AIR JORDAN COLLECTION
                </h3>
                <p className="text-gray-300 text-xs md:text-sm mt-1 mb-3">
                  Đầy đủ phiên bản Low và High với phối màu phong cách đường phố trẻ trung.
                </p>
                <span className="text-white text-xs font-bold uppercase tracking-wider flex items-center group-hover:text-brand-red transition">
                  Khám phá ngay <i className="ph ph-arrow-right ml-1"></i>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      {bestSellers.length > 0 && (
        <section className="py-12 md:py-16 bg-gray-50 border-t border-gray-200">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 border-b border-gray-200 pb-4 gap-4">
              <div>
                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-black">
                  Bán chạy nhất
                </h2>
                <p className="text-gray-500 font-medium text-xs md:text-sm mt-1.5">
                  Các mẫu sneaker được ưa chuộng hàng đầu tại cửa hàng.
                </p>
              </div>
              <button
                onClick={() => onNavigate('collection', 'ALL')}
                className="inline-flex items-center text-xs md:text-sm font-black uppercase tracking-wider text-brand-red hover:text-black transition cursor-pointer"
              >
                Xem toàn bộ kho giày <i className="ph ph-arrow-right ml-1 text-base"></i>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {bestSellers.map((prod, idx) => (
                <ProductCard
                  key={prod.alias || prod.id}
                  product={prod}
                  index={idx}
                  onSelect={alias => onNavigate('product', undefined, alias)}
                  isFavorite={favorites.includes(String(prod.id)) || favorites.includes(prod.alias)}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
