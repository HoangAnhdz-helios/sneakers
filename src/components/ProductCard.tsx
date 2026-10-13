import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  index?: number;
  onSelect: (alias: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: string | number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  index = 0,
  onSelect,
  isFavorite = false,
  onToggleFavorite
}) => {
  const isAvailable = product.available;
  const image = product.image || 'https://bizweb.dktcdn.net/100/623/516/themes/984005/assets/logo.png?1766551790087';

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(product.id || product.alias);
    }
  };

  return (
    <div
      onClick={() => onSelect(product.alias)}
      className="product-card text-left group bg-white flex flex-col relative border border-transparent hover:border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      <div className="relative bg-gray-100 overflow-hidden aspect-square">
        {index < 16 && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-black text-white text-[10px] font-bold px-2.5 py-1 uppercase tracking-wide">
              Mới
            </span>
          </div>
        )}

        <button
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 z-10 transition text-xl bg-white rounded-full p-1.5 shadow cursor-pointer ${
            isFavorite
              ? 'text-brand-red opacity-100'
              : 'text-gray-400 hover:text-brand-red opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0'
          }`}
          title="Yêu thích"
        >
          <i className={isFavorite ? 'ph-fill ph-heart text-brand-red' : 'ph ph-heart'}></i>
        </button>

        <img
          src={image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-white/90 backdrop-blur">
          <span className="block w-full bg-black text-white text-center text-xs font-bold py-3 uppercase group-hover:bg-brand-red transition">
            Xem chi tiết
          </span>
        </div>
      </div>

      <div className="p-4 flex-grow flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">
            {product.category}
          </p>
          <p className="text-[10px] font-bold uppercase shrink-0">
            {isAvailable ? (
              <span className="text-emerald-700 font-bold">Còn hàng</span>
            ) : (
              <span className="text-gray-400">Hết hàng</span>
            )}
          </p>
        </div>

        <h3 className="text-sm font-bold text-black mb-2 line-clamp-2 group-hover:text-brand-red transition flex-grow capitalize">
          {product.name}
        </h3>

        <div className="flex items-baseline space-x-2 mt-auto">
          <span className="text-sm font-black text-black">{product.price}</span>
          {product.compareAt && (
            <span className="text-xs text-gray-400 line-through font-medium">
              {product.compareAt}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
