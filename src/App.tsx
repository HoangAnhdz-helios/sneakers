import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider, useToast } from './components/Toast';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { HomeView } from './pages/HomeView';
import { CollectionView } from './pages/CollectionView';
import { ProductDetailView } from './pages/ProductDetailView';
import { AccountView } from './pages/AccountView';
import { AdminView } from './pages/AdminView';
import { Product, Banner } from './types';
import { fetchProducts } from './services/productService';
import { fetchBanners } from './services/storeService';
import { INITIAL_PRODUCTS, INITIAL_BANNERS } from './data/initialProducts';
import { updateUserProfile } from './services/authService';

const FAVORITES_STORAGE_KEY = 'phuanh_sneaker_favorites';

const AppContent: React.FC = () => {
  const { currentUser, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [currentView, setCurrentView] = useState<'home' | 'collection' | 'product' | 'account' | 'admin'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeProductAlias, setActiveProductAlias] = useState<string>('');
  const [accountTab, setAccountTab] = useState<string>('profile');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Load products and banners on mount
  useEffect(() => {
    loadProductsAndBanners();
  }, []);

  const loadProductsAndBanners = async () => {
    setLoadingProducts(true);
    try {
      const [prods, bans] = await Promise.all([
        fetchProducts(),
        fetchBanners()
      ]);
      setProducts(prods);
      setBanners(bans);
    } catch (err) {
      console.warn('Using local fallback for products & banners:', err);
      setProducts(INITIAL_PRODUCTS);
      setBanners(INITIAL_BANNERS);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Sync favorites with user profile if logged in
  useEffect(() => {
    if (profile?.favorites && profile.favorites.length > 0) {
      setFavorites(profile.favorites);
    }
  }, [profile]);

  const toggleFavorite = async (productId: string | number) => {
    const idStr = String(productId);
    const newFavs = favorites.includes(idStr)
      ? favorites.filter(f => f !== idStr)
      : [...favorites, idStr];

    setFavorites(newFavs);
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavs));
    } catch {}

    if (favorites.includes(idStr)) {
      showToast('Đã xóa khỏi danh sách yêu thích.', 'info');
    } else {
      showToast('Đã thêm vào danh sách yêu thích!', 'success');
    }

    if (currentUser) {
      try {
        await updateUserProfile(currentUser.uid, { favorites: newFavs });
        await refreshProfile();
      } catch (e) {
        console.warn('Could not sync favorites to cloud:', e);
      }
    }
  };

  // Unified router
  const handleNavigate = (view: string, category?: string, productAlias?: string) => {
    if (category) {
      setSelectedCategory(category);
    }
    if (productAlias) {
      setActiveProductAlias(productAlias);
    }
    if (view === 'account' && category) {
      setAccountTab(category);
    }

    setCurrentView(view as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeProduct = products.find(p => p.alias === activeProductAlias) || products[0];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Customer Header (visible in all customer views) */}
      {currentView !== 'admin' && (
        <Header
          currentView={currentView}
          onNavigate={handleNavigate}
          onSearch={(term) => {
            setSearchQuery(term);
            handleNavigate('collection', 'ALL');
          }}
          favoritesCount={favorites.length}
        />
      )}

      {/* Main Content Pages */}
      <main className="flex-1">
        {loadingProducts && currentView === 'home' && products.length === 0 ? (
          <div className="py-24 text-center">
            <i className="ph ph-spinner animate-spin text-5xl text-brand-red mb-3"></i>
            <p className="font-bold text-sm text-gray-500 uppercase">Đang tải PhuAnh Sneaker...</p>
          </div>
        ) : (
          <>
            {currentView === 'home' && (
              <HomeView
                products={products}
                banners={banners}
                onNavigate={handleNavigate}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            )}

            {currentView === 'collection' && (
              <CollectionView
                products={products}
                currentCategory={selectedCategory}
                searchQuery={searchQuery}
                onSelectCategory={cat => setSelectedCategory(cat)}
                onClearSearch={() => setSearchQuery('')}
                onSelectProduct={alias => handleNavigate('product', undefined, alias)}
                onNavigateHome={() => handleNavigate('home')}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            )}

            {currentView === 'product' && activeProduct && (
              <ProductDetailView
                product={activeProduct}
                allProducts={products}
                onSelectProduct={alias => handleNavigate('product', undefined, alias)}
                onBackToCollection={cat => handleNavigate('collection', cat || 'ALL')}
                onNavigateHome={() => handleNavigate('home')}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            )}

            {currentView === 'account' && (
              <AccountView
                initialTab={accountTab}
                allProducts={products}
                onSelectProduct={alias => handleNavigate('product', undefined, alias)}
                onNavigateHome={() => handleNavigate('home')}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            )}

            {currentView === 'admin' && (
              <AdminView
                onNavigateHome={() => handleNavigate('home')}
                onRefreshGlobalProducts={loadProductsAndBanners}
              />
            )}
          </>
        )}
      </main>

      {/* Footer (Customer views) */}
      {currentView !== 'admin' && (
        <Footer onNavigate={handleNavigate} />
      )}

      {/* Global Modals */}
      <LoginModal />
      <CheckoutModal />
      <OrderSuccessModal
        onViewAccountOrders={() => handleNavigate('account', 'orders')}
        onContinueShopping={() => handleNavigate('collection', 'ALL')}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
