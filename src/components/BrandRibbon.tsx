import React from 'react';
import { INITIAL_CATEGORIES } from '../data/initialProducts';

interface BrandRibbonProps {
  onSelectBrand: (brand: string) => void;
}

export const BrandRibbon: React.FC<BrandRibbonProps> = ({ onSelectBrand }) => {
  const brands = INITIAL_CATEGORIES.filter(cat => cat !== 'ALL');

  return (
    <section className="border-b border-gray-200 py-6 bg-white shadow-sm relative z-20">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center space-x-8 md:space-x-12 overflow-x-auto hide-scrollbar text-gray-400">
          {brands.map(brand => (
            <button
              key={brand}
              onClick={() => onSelectBrand(brand)}
              className="font-black text-2xl md:text-3xl tracking-widest uppercase hover:text-black hover:scale-105 cursor-pointer transition flex-shrink-0 whitespace-nowrap"
            >
              {brand}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
