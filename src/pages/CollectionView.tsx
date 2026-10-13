import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { INITIAL_CATEGORIES } from '../data/initialProducts';
import { ProductCard } from '../components/ProductCard';

interface CollectionViewProps {
  products: Product[];
  currentCategory: string;
  searchQuery?: string;
  onSelectCategory: (category: string) => void;
  onClearSearch?: () => void;
  onSelectProduct: (alias: string) => void;
  onNavigateHome: () => void;
  favorites?: string[];
  onToggleFavorite?: (productId: string | number) => void;
}

const PRICE_RANGES = [
  { id: 'all', label: 'Tất cả giá', min: 0, max: Infinity },
  { id: 'under450', label: 'Dưới 450.000₫', min: 0, max: 449999 },
  { id: '450to480', label: '450.000₫ - 480.000₫', min: 450000, max: 480000 },
  { id: 'above480', label: 'Trên 480.000₫', min: 480001, max: Infinity }
];

const SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];

export const CollectionView: React.FC<CollectionViewProps> = ({
  products,
  currentCategory,
  searchQuery = '',
  onSelectCategory,
  onClearSearch,
  onSelectProduct,
  onNavigateHome,
  favorites = [],
  onToggleFavorite
}) => {
  const [selectedPriceId, setSelectedPriceId] = useState('all');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'name-asc'>('newest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);

  // Filter calculation
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (currentCategory && currentCategory !== 'ALL') {
      result = result.filter(p => p.category.toUpperCase() === currentCategory.toUpperCase());
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.alias.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }

    // Price range filter
    const activePrice = PRICE_RANGES.find(r => r.id === selectedPriceId);
    if (activePrice && activePrice.id !== 'all') {
      result = result.filter(p => p.priceValue >= activePrice.min && p.priceValue <= activePrice.max);
    }

    // Size filter
    if (selectedSizes.length > 0) {
      result = result.filter(p =>
        p.sizes.some(s => selectedSizes.includes(s.label) && s.available && s.quantity > 0)
      );
    }

    // In-stock only filter
    if (inStockOnly) {
      result = result.filter(p => p.available);
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.priceValue - b.priceValue);
        break;
      case 'price-desc':
        result.sort((a, b) => b.priceValue - a.priceValue);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        // maintain order or ID desc
        break;
    }

    return result;
  }, [products, currentCategory, searchQuery, selectedPriceId, selectedSizes, inStockOnly, sortBy]);

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const resetAllFilters = () => {
    setSelectedPriceId('all');
    setSelectedSizes([]);
    setInStockOnly(false);
    onSelectCategory('ALL');
    if (onClearSearch) onClearSearch();
  };

  // Determine banner image & title
  const activeBannerCategory = currentCategory === 'ALL' ? 'SẢN PHẨM' : currentCategory;
  const heroImage = useMemo(() => {
    const categoryProds = currentCategory === 'ALL'
      ? products
      : products.filter(p => p.category === currentCategory);
    return categoryProds[0]?.image || 'https://bizweb.dktcdn.net/100/623/516/themes/1096067/assets/slider_1.jpg?1767854690623';
  }, [products, currentCategory]);

  return (
    <div className="view-collection bg-white animate-slide-in">
      {/* Banner */}
      <div className="w-full h-[25vh] md:h-[35vh] relative bg-black flex items-center justify-center overflow-hidden">
        <img
          src={heroImage}
          alt={activeBannerCategory}
          className="absolute inset-0 w-full h-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-widest mb-2">
            {activeBannerCategory}
          </h1>
          <p className="text-gray-300 text-xs md:text-sm font-medium max-w-xl mx-auto">
            {currentCategory === 'ALL'
              ? 'Toàn bộ các dòng giày sneaker thịnh hành đang có sẵn tại PhuAnh Sneaker.'
              : `Bộ sưu tập giày sneaker ${currentCategory} thời trang, chất lượng với giá tốt nhất.`}
          </p>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8 py-3 text-xs font-semibold text-gray-500 flex items-center space-x-2">
          <button onClick={onNavigateHome} className="hover:text-black cursor-pointer">
            Trang chủ
          </button>
          <span>/</span>
          <button onClick={() => onSelectCategory('ALL')} className="hover:text-black cursor-pointer">
            Danh mục
          </button>
          <span>/</span>
          <span className="text-black font-bold uppercase">{activeBannerCategory}</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="container mx-auto px-4 lg:px-8 py-8 md:py-10">
        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden mb-6 flex justify-between items-center bg-gray-50 p-3.5 border border-gray-200 rounded">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="font-bold text-xs uppercase flex items-center cursor-pointer"
          >
            <i className="ph ph-faders mr-2 text-lg"></i> Bộ lọc & Danh mục ({filteredProducts.length})
          </button>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="text-xs font-bold border border-gray-300 bg-white rounded px-2 py-1.5 focus:outline-none"
          >
            <option value="newest">Mới nhất</option>
            <option value="price-asc">Giá: Thấp đến Cao</option>
            <option value="price-desc">Giá: Cao đến Thấp</option>
            <option value="name-asc">Tên A-Z</option>
          </select>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filter Container (Desktop) */}
          <aside className="w-full lg:w-1/4 flex-shrink-0 hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b-2 border-black">
                <h3 className="font-black text-lg uppercase tracking-wide">Bộ lọc sản phẩm</h3>
                {(selectedPriceId !== 'all' || selectedSizes.length > 0 || inStockOnly || currentCategory !== 'ALL' || searchQuery) && (
                  <button
                    onClick={resetAllFilters}
                    className="text-xs text-brand-red font-bold hover:underline cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="pb-6 border-b border-gray-200">
                <h4 className="font-bold text-xs uppercase text-gray-500 tracking-wider mb-3.5">
                  Thương hiệu / Dòng sản phẩm
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {INITIAL_CATEGORIES.map(cat => {
                    const count = cat === 'ALL'
                      ? products.length
                      : products.filter(p => p.category.toUpperCase() === cat.toUpperCase()).length;
                    const isSelected = currentCategory.toUpperCase() === cat.toUpperCase();

                    return (
                      <button
                        key={cat}
                        onClick={() => onSelectCategory(cat)}
                        className={`w-full flex items-center justify-between text-xs py-1.5 px-2 rounded text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-black text-white font-bold'
                            : 'text-gray-700 hover:bg-gray-100 font-medium'
                        }`}
                      >
                        <span>{cat === 'ALL' ? 'TẤT CẢ SẢN PHẨM' : cat}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Ranges */}
              <div className="pb-6 border-b border-gray-200">
                <h4 className="font-bold text-xs uppercase text-gray-500 tracking-wider mb-3.5">
                  Khoảng giá
                </h4>
                <div className="space-y-2.5">
                  {PRICE_RANGES.map(range => (
                    <label
                      key={range.id}
                      className="flex items-center cursor-pointer group text-xs font-semibold text-gray-700"
                    >
                      <input
                        type="radio"
                        name="price"
                        checked={selectedPriceId === range.id}
                        onChange={() => setSelectedPriceId(range.id)}
                        className="mr-2.5 accent-black w-4 h-4"
                      />
                      <span className="group-hover:text-black">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div className="pb-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-3.5">
                  <h4 className="font-bold text-xs uppercase text-gray-500 tracking-wider">
                    Kích cỡ (Size)
                  </h4>
                  {selectedSizes.length > 0 && (
                    <button
                      onClick={() => setSelectedSizes([])}
                      className="text-[11px] text-gray-400 hover:text-black cursor-pointer"
                    >
                      Bỏ chọn ({selectedSizes.length})
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {SIZES.map(size => {
                    const isSelected = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`size-btn border py-2 text-xs font-bold transition rounded-sm cursor-pointer ${
                          isSelected
                            ? 'active'
                            : 'border-gray-200 text-gray-700 hover:border-black'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* In-Stock Only */}
              <div className="pb-6">
                <label className="flex items-center cursor-pointer text-xs font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={e => setInStockOnly(e.target.checked)}
                    className="mr-2.5 accent-black w-4 h-4"
                  />
                  <span>Chỉ hiển thị sản phẩm còn hàng</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="w-full lg:w-3/4">
            {/* Top Action Bar */}
            <div className="hidden lg:flex justify-between items-center bg-gray-50 p-4 mb-6 rounded-sm border border-gray-100">
              <p className="text-xs md:text-sm font-semibold text-gray-500">
                Hiển thị <span className="text-black font-bold">{Math.min(visibleCount, filteredProducts.length)}</span> trên tổng số <span className="text-black font-bold">{filteredProducts.length}</span> sản phẩm phù hợp
              </p>

              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="bg-white border border-gray-300 text-xs font-semibold py-2 px-3 rounded focus:outline-none focus:border-black cursor-pointer"
                >
                  <option value="newest">Sản phẩm mới</option>
                  <option value="price-asc">Giá: Thấp đến Cao</option>
                  <option value="price-desc">Giá: Cao đến Thấp</option>
                  <option value="name-asc">Tên A-Z</option>
                </select>
              </div>
            </div>

            {/* Active Filter Tags */}
            <div className="flex flex-wrap gap-2 mb-6 items-center">
              <span className="bg-gray-100 border border-gray-200 text-xs font-bold px-3 py-1 flex items-center">
                PhuAnh Sneaker
              </span>

              {currentCategory !== 'ALL' && (
                <span className="bg-gray-100 border border-gray-200 text-xs font-bold px-3 py-1 flex items-center">
                  Dòng: {currentCategory}
                  <button
                    onClick={() => onSelectCategory('ALL')}
                    className="ml-2 hover:text-brand-red cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="bg-red-50 border border-red-200 text-brand-red text-xs font-bold px-3 py-1 flex items-center">
                  Tìm kiếm: "{searchQuery}"
                  <button
                    onClick={onClearSearch}
                    className="ml-2 hover:text-black cursor-pointer font-black"
                  >
                    ×
                  </button>
                </span>
              )}

              {selectedPriceId !== 'all' && (
                <span className="bg-gray-100 border border-gray-200 text-xs font-bold px-3 py-1 flex items-center">
                  {PRICE_RANGES.find(r => r.id === selectedPriceId)?.label}
                  <button
                    onClick={() => setSelectedPriceId('all')}
                    className="ml-2 hover:text-brand-red cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}

              {selectedSizes.map(size => (
                <span
                  key={size}
                  className="bg-gray-100 border border-gray-200 text-xs font-bold px-3 py-1 flex items-center"
                >
                  Size: {size}
                  <button
                    onClick={() => toggleSize(size)}
                    className="ml-2 hover:text-brand-red cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}

              {inStockOnly && (
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1 flex items-center">
                  Còn hàng
                  <button
                    onClick={() => setInStockOnly(false)}
                    className="ml-2 hover:text-black cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}

              {(selectedPriceId !== 'all' || selectedSizes.length > 0 || inStockOnly || currentCategory !== 'ALL' || searchQuery) && (
                <button
                  onClick={resetAllFilters}
                  className="text-xs font-bold text-brand-red underline cursor-pointer ml-2"
                >
                  Đặt lại bộ lọc
                </button>
              )}
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="py-16 text-center bg-gray-50 rounded border border-gray-200">
                <i className="ph ph-sneaker text-5xl text-gray-300 mb-3"></i>
                <h3 className="text-lg font-black uppercase text-black mb-1">
                  Không tìm thấy sản phẩm phù hợp
                </h3>
                <p className="text-xs md:text-sm text-gray-500 mb-4 max-w-md mx-auto">
                  Hãy thử điều chỉnh lại bộ lọc kích cỡ, khoảng giá hoặc từ khóa tìm kiếm của bạn.
                </p>
                <button
                  onClick={resetAllFilters}
                  className="bg-black text-white px-6 py-2.5 text-xs font-black uppercase hover:bg-brand-red transition rounded cursor-pointer"
                >
                  Xem tất cả sản phẩm
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {filteredProducts.slice(0, visibleCount).map((prod, idx) => (
                  <ProductCard
                    key={prod.alias || prod.id}
                    product={prod}
                    index={idx}
                    onSelect={onSelectProduct}
                    isFavorite={favorites.includes(String(prod.id)) || favorites.includes(prod.alias)}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {visibleCount < filteredProducts.length && (
              <div className="flex justify-center mt-12 mb-8">
                <button
                  onClick={() => setVisibleCount(prev => prev + 24)}
                  className="inline-flex items-center bg-black text-white font-black py-3 px-8 text-xs md:text-sm uppercase tracking-wider hover:bg-brand-red transition cursor-pointer rounded-sm shadow"
                >
                  Tải thêm sản phẩm ({filteredProducts.length - visibleCount}) <i className="ph ph-arrow-down ml-2 text-base"></i>
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileFilterOpen(false)}></div>
          <div className="bg-white w-[85%] max-w-xs h-full relative z-10 flex flex-col shadow-2xl p-5 overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="font-black text-base uppercase">Bộ lọc sản phẩm</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="text-2xl p-1 cursor-pointer">
                <i className="ph ph-x"></i>
              </button>
            </div>

            <div className="py-4 space-y-6 flex-1">
              {/* Category */}
              <div>
                <h4 className="font-bold text-xs uppercase text-gray-500 mb-2">Dòng sản phẩm</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {INITIAL_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => onSelectCategory(cat)}
                      className={`text-xs py-2 px-2 border rounded font-semibold text-center cursor-pointer ${
                        currentCategory === cat ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <h4 className="font-bold text-xs uppercase text-gray-500 mb-2">Khoảng giá</h4>
                <div className="space-y-2">
                  {PRICE_RANGES.map(range => (
                    <label key={range.id} className="flex items-center text-xs font-semibold text-gray-700">
                      <input
                        type="radio"
                        name="mobilePrice"
                        checked={selectedPriceId === range.id}
                        onChange={() => setSelectedPriceId(range.id)}
                        className="mr-2 accent-black"
                      />
                      <span>{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h4 className="font-bold text-xs uppercase text-gray-500 mb-2">Kích cỡ</h4>
                <div className="grid grid-cols-5 gap-1.5">
                  {SIZES.map(size => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`border py-2 text-xs font-bold rounded cursor-pointer ${
                        selectedSizes.includes(size) ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* In stock */}
              <div>
                <label className="flex items-center text-xs font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={e => setInStockOnly(e.target.checked)}
                    className="mr-2 accent-black"
                  />
                  <span>Chỉ sản phẩm còn hàng</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t flex gap-2">
              <button
                onClick={resetAllFilters}
                className="w-1/2 py-2.5 border border-gray-300 text-xs font-bold uppercase rounded"
              >
                Đặt lại
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-1/2 py-2.5 bg-brand-red text-white text-xs font-black uppercase rounded"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
