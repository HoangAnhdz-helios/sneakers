import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';
import { useToast } from '../components/Toast';

interface ProductDetailViewProps {
  product: Product;
  allProducts: Product[];
  onSelectProduct: (alias: string) => void;
  onBackToCollection: (category?: string) => void;
  onNavigateHome: () => void;
  favorites?: string[];
  onToggleFavorite?: (productId: string | number) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  allProducts,
  onSelectProduct,
  onBackToCollection,
  onNavigateHome,
  favorites = [],
  onToggleFavorite
}) => {
  const { addToCart, openCheckout } = useCart();
  const { showToast } = useToast();

  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const [activeImage, setActiveImage] = useState(images[0] || product.image);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Sync active image when product changes
  useEffect(() => {
    const imgs = product.images && product.images.length > 0 ? product.images : [product.image];
    setActiveImage(imgs[0] || product.image);
    setSelectedSize(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product.alias]);

  // Related products from same category
  const relatedProducts = allProducts
    .filter(p => p.alias !== product.alias && p.category.toUpperCase() === product.category.toUpperCase())
    .slice(0, 4);

  const availableSizes = product.sizes.filter(s => s.available && s.quantity > 0);
  const totalStock = product.sizes.reduce((sum, s) => sum + (s.quantity || 0), 0);

  const handleAddToCart = () => {
    if (!selectedSize) {
      showToast('Vui lòng chọn kích cỡ (Size) trước khi thêm vào giỏ!', 'error');
      return;
    }
    const res = addToCart(product, selectedSize, 1);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      showToast('Vui lòng chọn kích cỡ (Size) để thanh toán ngay!', 'error');
      return;
    }
    const res = addToCart(product, selectedSize, 1);
    if (res.success) {
      openCheckout();
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="view-product bg-white animate-slide-in">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8 py-3 text-xs font-semibold text-gray-500 flex items-center space-x-2">
          <button onClick={onNavigateHome} className="hover:text-black cursor-pointer">
            Trang chủ
          </button>
          <span>/</span>
          <button onClick={() => onBackToCollection(product.category)} className="hover:text-black cursor-pointer uppercase">
            {product.category}
          </button>
          <span>/</span>
          <span className="text-black font-bold capitalize truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      <section className="container mx-auto px-4 lg:px-8 py-8 md:py-12">
        {/* Back Link */}
        <button
          type="button"
          onClick={() => onBackToCollection(product.category)}
          className="inline-flex items-center text-xs font-black uppercase tracking-wider text-gray-500 hover:text-brand-red transition mb-6 cursor-pointer"
        >
          <i className="ph ph-arrow-left mr-2 text-base"></i> Quay lại danh mục {product.category}
        </button>

        {/* Product Main Display */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-start">
          {/* Left Column: Gallery */}
          <div>
            <div className="relative bg-gray-100 aspect-square overflow-hidden border border-gray-200 rounded-sm shadow-sm">
              <span
                className={`absolute top-4 left-4 z-10 text-white text-[11px] font-black px-3 py-1 uppercase rounded-sm ${
                  product.available ? 'bg-black' : 'bg-gray-500'
                }`}
              >
                {product.available ? 'Còn hàng' : 'Hết hàng'}
              </span>

              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2.5 mt-3.5">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`border aspect-square overflow-hidden rounded-sm transition cursor-pointer bg-gray-50 ${
                      activeImage === img ? 'border-black ring-2 ring-black/20' : 'border-gray-200 hover:border-black'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Information & Actions */}
          <div className="lg:sticky lg:top-28">
            <p className="text-xs font-black text-brand-red uppercase tracking-[0.2em] mb-2">
              {product.category} SNEAKER
            </p>
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-black mb-3 capitalize">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-end gap-3 mb-6">
              <span className="text-2xl md:text-3xl font-black text-brand-red">
                {product.price}
              </span>
              {product.compareAt && (
                <span className="text-sm font-bold text-gray-400 line-through">
                  {product.compareAt}
                </span>
              )}
            </div>

            {/* Metrics Badges */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="border border-gray-200 p-3 bg-gray-50 rounded-sm">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Mã SP (SKU)</p>
                <p className="font-black text-xs md:text-sm text-black truncate">{product.sku || product.alias}</p>
              </div>
              <div className="border border-gray-200 p-3 bg-gray-50 rounded-sm">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Tổng tồn kho</p>
                <p className="font-black text-xs md:text-sm text-black">
                  {totalStock > 0 ? `${totalStock} đôi` : 'Tạm hết'}
                </p>
              </div>
              <div className="border border-gray-200 p-3 bg-gray-50 rounded-sm">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Size có sẵn</p>
                <p className="font-black text-xs md:text-sm text-black">
                  {availableSizes.length} size
                </p>
              </div>
            </div>

            {/* Size Selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="font-black uppercase tracking-wide text-xs md:text-sm">
                  Chọn kích cỡ (Size)
                </h3>
                <span className="text-xs font-semibold text-gray-500">
                  {selectedSize ? `Đang chọn Size ${selectedSize}` : 'Vui lòng chọn size'}
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {product.sizes.map(size => {
                  const isAvail = size.available && size.quantity > 0;
                  const isChosen = selectedSize === size.label;

                  return (
                    <button
                      key={size.label}
                      type="button"
                      disabled={!isAvail}
                      onClick={() => setSelectedSize(size.label)}
                      className={`border py-2.5 text-xs font-bold transition rounded-sm relative cursor-pointer ${
                        !isAvail
                          ? 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed line-through'
                          : isChosen
                          ? 'bg-black text-white border-black ring-2 ring-black/20'
                          : 'border-gray-300 text-black hover:border-black bg-white'
                      }`}
                      title={isAvail ? `Còn ${size.quantity} đôi (SKU: ${size.sku})` : 'Hết hàng'}
                    >
                      <span>{size.label}</span>
                      {isAvail && size.quantity < 3 && (
                        <span className="block text-[9px] text-amber-500 font-normal">
                          Còn {size.quantity}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!product.available || availableSizes.length === 0}
                className="flex-1 bg-black text-white font-black uppercase py-4 hover:bg-brand-red transition flex items-center justify-center space-x-2 text-xs md:text-sm rounded-sm shadow-md cursor-pointer disabled:opacity-50"
              >
                <span>Thêm vào giỏ</span>
                <i className="ph ph-shopping-bag text-lg"></i>
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!product.available || availableSizes.length === 0}
                className="flex-1 bg-brand-red text-white font-black uppercase py-4 hover:bg-black transition flex items-center justify-center space-x-2 text-xs md:text-sm rounded-sm shadow-md cursor-pointer disabled:opacity-50"
              >
                <span>Mua ngay</span>
                <i className="ph ph-credit-card text-lg"></i>
              </button>
            </div>

            {/* Product Specifications & Policies */}
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <div>
                <h3 className="font-black uppercase tracking-wide text-xs md:text-sm mb-2">
                  Thông tin sản phẩm
                </h3>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                  {product.description ||
                    `${product.name} thuộc nhóm ${product.category}, giá ${product.price}. Sản phẩm chuẩn form dáng thể thao năng động, chất liệu cao cấp mang lại cảm giác êm ái khi di chuyển.`}
                </p>
              </div>

              <div className="bg-gray-50 p-4 border border-gray-200 rounded text-xs space-y-2">
                <p className="font-bold text-black uppercase">Chính sách mua sắm tại PhuAnh Sneaker:</p>
                <div className="flex items-center text-gray-700">
                  <i className="ph ph-truck mr-2 text-base text-black"></i> Giao hàng tận nơi toàn quốc, kiểm tra hàng trước khi nhận.
                </div>
                <div className="flex items-center text-gray-700">
                  <i className="ph ph-arrows-clockwise mr-2 text-base text-black"></i> Hỗ trợ đổi size trong vòng 7 ngày nếu không vừa.
                </div>
                <div className="flex items-center text-gray-700">
                  <i className="ph ph-shield-check mr-2 text-base text-black"></i> Cam kết sản phẩm chất lượng đúng mô tả và hình ảnh chụp.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 md:mt-20 border-t border-gray-200 pt-10">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight text-black">
                  Sản phẩm cùng dòng {product.category}
                </h2>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  Khám phá thêm các mẫu cùng phong cách để có thêm lựa chọn.
                </p>
              </div>
              <button
                onClick={() => onBackToCollection(product.category)}
                className="text-xs font-bold text-brand-red hover:underline uppercase cursor-pointer"
              >
                Xem thêm <i className="ph ph-arrow-right"></i>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map(rel => (
                <ProductCard
                  key={rel.alias || rel.id}
                  product={rel}
                  onSelect={onSelectProduct}
                  isFavorite={favorites.includes(String(rel.id)) || favorites.includes(rel.alias)}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  );
};
