import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Product, Order, Coupon, InventoryMovement, StoreSettings, OrderStatus, PaymentStatus } from '../types';
import { fetchProducts, createProduct, updateProduct, deleteProduct, seedProducts } from '../services/productService';
import { getAllOrders, updateOrderStatus, cancelOrder } from '../services/orderService';
import { getInventoryMovements, adjustVariantStock } from '../services/inventoryService';
import { fetchCoupons, saveCoupon, deleteCoupon } from '../services/couponService';
import { fetchStoreSettings, updateStoreSettings } from '../services/storeService';
import { INITIAL_CATEGORIES } from '../data/initialProducts';
import { useToast } from '../components/Toast';

interface AdminViewProps {
  onNavigateHome: () => void;
  onRefreshGlobalProducts: () => Promise<void>;
}

type AdminTab = 'dashboard' | 'products' | 'inventory' | 'orders' | 'coupons' | 'settings';

export const AdminView: React.FC<AdminViewProps> = ({ onNavigateHome, onRefreshGlobalProducts }) => {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);

  // Core Datasets
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  // Product Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    alias: '',
    category: 'TIGER',
    sku: '',
    priceValue: 450000,
    compareAtValue: 0,
    image: '',
    description: '',
    available: true,
    sizes: [
      { label: '36', available: true, quantity: 5, sku: '' },
      { label: '37', available: true, quantity: 5, sku: '' },
      { label: '38', available: true, quantity: 5, sku: '' },
      { label: '39', available: true, quantity: 5, sku: '' }
    ]
  });

  // Inventory Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustData, setAdjustData] = useState({
    productAlias: '',
    size: '36',
    delta: 5,
    type: 'IMPORT' as InventoryMovement['type'],
    reason: 'Nhập hàng lô mới'
  });

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [carrierInput, setCarrierInput] = useState('Giao Hàng Nhanh');
  const [internalNotesInput, setInternalNotesInput] = useState('');

  // Coupon Modal
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState<Coupon>({
    code: '',
    discountType: 'fixed',
    discountValue: 50000,
    minOrderValue: 400000,
    usageLimit: 500,
    usedCount: 0,
    active: true
  });

  // Product Search & Filters
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategoryFilter, setProdCategoryFilter] = useState('ALL');

  // Order Search & Filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  useEffect(() => {
    if (isAdmin) {
      loadAllAdminData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [prods, ords, mvs, cps, st] = await Promise.all([
        fetchProducts(),
        getAllOrders(),
        getInventoryMovements(100),
        fetchCoupons(),
        fetchStoreSettings()
      ]);
      setProducts(prods);
      setOrders(ords);
      setMovements(mvs);
      setCoupons(cps);
      setSettings(st);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Dashboard Metrics Calculation
  const metrics = useMemo(() => {
    const validOrders = orders.filter(o => o.orderStatus !== 'cancelled');
    const totalRev = validOrders.reduce((sum, o) => sum + o.total, 0);

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const todayRev = validOrders
      .filter(o => o.createdAt.startsWith(todayStr))
      .reduce((sum, o) => sum + o.total, 0);

    const statusCounts = {
      pending: orders.filter(o => o.orderStatus === 'pending').length,
      processing: orders.filter(o => o.orderStatus === 'processing').length,
      shipping: orders.filter(o => o.orderStatus === 'shipping').length,
      delivered: orders.filter(o => o.orderStatus === 'delivered').length,
      cancelled: orders.filter(o => o.orderStatus === 'cancelled').length
    };

    let lowStockCount = 0;
    products.forEach(p => {
      p.sizes.forEach(s => {
        if (s.quantity > 0 && s.quantity <= 2) lowStockCount++;
      });
    });

    return {
      totalRev,
      todayRev,
      orderCount: orders.length,
      statusCounts,
      productCount: products.length,
      lowStockCount
    };
  }, [orders, products]);

  // Product Filter
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCat = prodCategoryFilter === 'ALL' || p.category.toUpperCase() === prodCategoryFilter.toUpperCase();
      const q = prodSearch.toLowerCase().trim();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.alias.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, prodSearch, prodCategoryFilter]);

  // Orders Filter
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus = orderStatusFilter === 'ALL' || o.orderStatus === orderStatusFilter;
      const q = orderSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customer.fullName.toLowerCase().includes(q) ||
        o.customer.phone.includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 text-brand-red rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ph ph-lock-key text-4xl"></i>
        </div>
        <h2 className="text-2xl font-black uppercase text-black mb-2">Quyền truy cập bị từ chối</h2>
        <p className="text-xs md:text-sm text-gray-500 mb-6">
          Chỉ tài khoản Quản trị viên (Admin) được cấp quyền mới có thể truy cập trang quản trị PhuAnh Sneaker.
        </p>
        <p className="text-xs font-mono bg-gray-100 p-2.5 rounded text-gray-700 mb-6">
          Tài khoản admin hiện tại: <strong>imperblorius@gmail.com</strong>
        </p>
        <button
          onClick={onNavigateHome}
          className="bg-black text-white px-6 py-2.5 rounded text-xs font-bold uppercase hover:bg-brand-red transition cursor-pointer"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  // --- Handlers ---
  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      alias: '',
      category: 'TIGER',
      sku: `PA-${Date.now().toString().slice(-4)}`,
      priceValue: 460000,
      compareAtValue: 0,
      image: '',
      description: '',
      available: true,
      sizes: [
        { label: '36', available: true, quantity: 4, sku: '' },
        { label: '37', available: true, quantity: 4, sku: '' },
        { label: '38', available: true, quantity: 4, sku: '' },
        { label: '39', available: true, quantity: 4, sku: '' }
      ]
    });
    setProductModalOpen(true);
  };

  const handleEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      alias: p.alias,
      category: p.category,
      sku: p.sku,
      priceValue: p.priceValue,
      compareAtValue: p.compareAtValue || 0,
      image: p.image,
      description: p.description || '',
      available: p.available,
      sizes: p.sizes.map(s => ({ ...s }))
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      showToast('Vui lòng nhập tên sản phẩm', 'error');
      return;
    }

    const alias = productForm.alias.trim() || productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const priceFormatted = `${productForm.priceValue.toLocaleString('vi-VN')}₫`;
    const compareFormatted = productForm.compareAtValue > 0 ? `${productForm.compareAtValue.toLocaleString('vi-VN')}₫` : '';

    const payload = {
      alias,
      name: productForm.name.trim(),
      category: productForm.category,
      sku: productForm.sku.trim(),
      price: priceFormatted,
      priceValue: productForm.priceValue,
      compareAt: compareFormatted,
      compareAtValue: productForm.compareAtValue,
      image: productForm.image.trim() || 'https://bizweb.dktcdn.net/100/623/516/themes/984005/assets/logo.png?1766551790087',
      images: [productForm.image.trim() || 'https://bizweb.dktcdn.net/100/623/516/themes/984005/assets/logo.png?1766551790087'],
      description: productForm.description.trim(),
      available: productForm.available && productForm.sizes.some(s => s.available && s.quantity > 0),
      sizes: productForm.sizes.map(s => ({
        ...s,
        sku: s.sku || `${productForm.sku}-${s.label}`
      }))
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.alias, payload);
        showToast('Đã cập nhật sản phẩm thành công!', 'success');
      } else {
        await createProduct(payload);
        showToast('Đã thêm sản phẩm mới thành công!', 'success');
      }
      setProductModalOpen(false);
      await loadAllAdminData();
      await onRefreshGlobalProducts();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu sản phẩm', 'error');
    }
  };

  const handleDeleteProduct = async (alias: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`)) return;
    try {
      await deleteProduct(alias);
      showToast('Đã xóa sản phẩm.', 'info');
      await loadAllAdminData();
      await onRefreshGlobalProducts();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa sản phẩm', 'error');
    }
  };

  const handleOpenAdjust = (productAlias: string, size = '36') => {
    setAdjustData({
      productAlias,
      size,
      delta: 5,
      type: 'IMPORT',
      reason: 'Nhập bổ sung kho'
    });
    setAdjustModalOpen(true);
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const delta = adjustData.type === 'EXPORT' ? -Math.abs(adjustData.delta) : Math.abs(adjustData.delta);
      await adjustVariantStock(
        adjustData.productAlias,
        adjustData.size,
        delta,
        adjustData.type,
        adjustData.reason,
        currentUser?.displayName || 'Admin'
      );
      showToast('Đã cập nhật tồn kho và ghi nhật ký thành công!', 'success');
      setAdjustModalOpen(false);
      await loadAllAdminData();
      await onRefreshGlobalProducts();
    } catch (err: any) {
      showToast(err.message || 'Lỗi điều chỉnh kho', 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status, {
        trackingCode: trackingInput.trim() || undefined,
        shippingCarrier: carrierInput.trim() || undefined,
        internalNotes: internalNotesInput.trim() || undefined
      });
      showToast(`Đã cập nhật trạng thái đơn thành ${status.toUpperCase()}!`, 'success');
      await loadAllAdminData();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, orderStatus: status } : null);
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi cập nhật trạng thái', 'error');
    }
  };

  const handleAdminCancelOrder = async (orderId: string) => {
    const reason = window.prompt('Nhập lý do hủy đơn (hệ thống sẽ tự động hoàn lại tồn kho):');
    if (reason === null) return;
    try {
      await cancelOrder(orderId, reason.trim() || 'Quản trị viên hủy đơn', 'Admin');
      showToast('Đã hủy đơn và hoàn tồn kho an toàn.', 'success');
      await loadAllAdminData();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi hủy đơn', 'error');
    }
  };

  const handleExportOrdersCSV = () => {
    if (orders.length === 0) {
      showToast('Không có đơn hàng để xuất', 'error');
      return;
    }
    const headers = ['Mã Đơn', 'Ngày Tạo', 'Khách Hàng', 'SĐT', 'Địa Chỉ', 'Thành Phố', 'Phương Thức', 'Trạng Thái', 'Tổng Tiền (VNĐ)'];
    const rows = orders.map(o => [
      o.id,
      new Date(o.createdAt).toLocaleString('vi-VN'),
      `"${o.customer.fullName.replace(/"/g, '""')}"`,
      o.customer.phone,
      `"${o.customer.address.replace(/"/g, '""')}"`,
      o.customer.city,
      o.paymentMethod.toUpperCase(),
      o.orderStatus.toUpperCase(),
      o.total
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PhuAnh_Sneaker_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file báo cáo đơn hàng CSV!', 'success');
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;
    try {
      await saveCoupon(couponForm);
      showToast('Đã lưu mã giảm giá thành công!', 'success');
      setCouponModalOpen(false);
      await loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi lưu mã giảm giá', 'error');
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!window.confirm(`Xóa mã giảm giá ${code}?`)) return;
    try {
      await deleteCoupon(code);
      showToast('Đã xóa mã giảm giá', 'info');
      await loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi xóa coupon', 'error');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await updateStoreSettings(settings);
      showToast('Đã lưu cấu hình cửa hàng!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật cài đặt', 'error');
    }
  };

  const handleSeedCatalog = async () => {
    if (!window.confirm('Bạn có muốn đồng bộ lại 46 mẫu giày gốc từ catalog vào cơ sở dữ liệu Firestore?')) return;
    try {
      await seedProducts();
      await loadAllAdminData();
      await onRefreshGlobalProducts();
      showToast('Đã đồng bộ đầy đủ catalog 46 sản phẩm vào Firestore!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi đồng bộ', 'error');
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen text-gray-800 animate-slide-in pb-16">
      {/* Admin Top Header */}
      <header className="bg-brand-dark text-white border-b-4 border-brand-red px-4 lg:px-8 py-3.5 flex flex-wrap justify-between items-center gap-4 sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="font-black text-xl tracking-tighter uppercase flex flex-col leading-none">
            <span>PHUANH</span>
            <span className="text-brand-red text-base">ADMIN PANEL</span>
          </div>
          <span className="bg-red-950 text-red-200 border border-red-800 text-[10px] font-black px-2 py-0.5 rounded uppercase hidden sm:inline">
            Hệ thống Quản trị
          </span>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3">
          <button
            onClick={onNavigateHome}
            className="border border-gray-700 hover:border-white px-3 py-1.5 text-xs font-bold rounded flex items-center space-x-1.5 transition cursor-pointer"
          >
            <i className="ph ph-storefront text-base"></i>
            <span className="hidden sm:inline">Về cửa hàng</span>
          </button>
          <button
            onClick={handleSeedCatalog}
            className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 text-xs font-bold rounded text-gray-200 transition cursor-pointer flex items-center space-x-1"
            title="Đồng bộ lại 46 sản phẩm mẫu vào Firestore"
          >
            <i className="ph ph-database text-base text-amber-400"></i>
            <span className="hidden md:inline">Đồng bộ Catalog (46 SP)</span>
          </button>
        </div>
      </header>

      {/* Main Admin Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-[57px] z-20 overflow-x-auto hide-scrollbar">
        <div className="container mx-auto px-4 lg:px-8 flex space-x-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: 'ph-chart-line-up' },
            { id: 'products', label: 'Quản lý Sản phẩm', icon: 'ph-sneaker' },
            { id: 'inventory', label: 'Quản lý Kho', icon: 'ph-warehouse' },
            { id: 'orders', label: 'Quản lý Đơn hàng', icon: 'ph-package' },
            { id: 'coupons', label: 'Khuyến mãi & Mã giảm', icon: 'ph-tag' },
            { id: 'settings', label: 'Cài đặt Cửa hàng', icon: 'ph-gear' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`py-3.5 px-4 text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-brand-red text-brand-red bg-red-50/50'
                  : 'border-transparent text-gray-600 hover:text-black hover:bg-gray-50'
              }`}
            >
              <i className={`ph ${tab.icon} text-base`}></i>
              <span>{tab.label}</span>
              {tab.id === 'orders' && metrics.statusCounts.pending > 0 && (
                <span className="bg-brand-red text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center ml-1">
                  {metrics.statusCounts.pending}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-6 md:py-8">
        {loading ? (
          <div className="py-20 text-center">
            <i className="ph ph-spinner animate-spin text-4xl text-brand-red mb-3"></i>
            <p className="text-sm font-bold text-gray-600">Đang đồng bộ dữ liệu từ Cloud Firestore...</p>
          </div>
        ) : (
          <>
            {/* ========================================= */}
            {/* TAB 1: DASHBOARD METRICS                  */}
            {/* ========================================= */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-gray-500 uppercase">Tổng Doanh Thu</p>
                      <i className="ph ph-money text-2xl text-emerald-600"></i>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-black mt-2">
                      {metrics.totalRev.toLocaleString('vi-VN')}₫
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-1">Đơn hàng không bị hủy</p>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-gray-500 uppercase">Doanh thu hôm nay</p>
                      <i className="ph ph-calendar text-2xl text-blue-600"></i>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-black mt-2">
                      {metrics.todayRev.toLocaleString('vi-VN')}₫
                    </h3>
                    <p className="text-[11px] text-emerald-600 font-bold mt-1">Giao dịch trong ngày</p>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-gray-500 uppercase">Tổng số Đơn hàng</p>
                      <i className="ph ph-shopping-bag text-2xl text-purple-600"></i>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-black mt-2">
                      {metrics.orderCount}
                    </h3>
                    <p className="text-[11px] text-amber-600 font-bold mt-1">
                      {metrics.statusCounts.pending} đơn chờ xử lý
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-gray-500 uppercase">Cảnh báo tồn kho</p>
                      <i className="ph ph-warning text-2xl text-red-500"></i>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-brand-red mt-2">
                      {metrics.lowStockCount} size sắp hết
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-1">Tồn kho &lt; 3 đôi</p>
                  </div>
                </div>

                {/* Status Breakdown Bar */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="font-black text-sm uppercase text-black mb-4">
                    Tình trạng xử lý đơn hàng
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                    <div className="p-3 bg-amber-50 rounded border border-amber-200">
                      <p className="text-xs font-bold text-amber-800">Chờ xử lý</p>
                      <p className="text-2xl font-black text-amber-900 mt-1">{metrics.statusCounts.pending}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-bold text-blue-800">Đang đóng gói</p>
                      <p className="text-2xl font-black text-blue-900 mt-1">{metrics.statusCounts.processing}</p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded border border-indigo-200">
                      <p className="text-xs font-bold text-indigo-800">Đang vận chuyển</p>
                      <p className="text-2xl font-black text-indigo-900 mt-1">{metrics.statusCounts.shipping}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
                      <p className="text-xs font-bold text-emerald-800">Đã giao thành công</p>
                      <p className="text-2xl font-black text-emerald-900 mt-1">{metrics.statusCounts.delivered}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded border border-red-200">
                      <p className="text-xs font-bold text-red-800">Đã hủy</p>
                      <p className="text-2xl font-black text-red-900 mt-1">{metrics.statusCounts.cancelled}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Orders Overview */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-black text-sm uppercase text-black">Đơn hàng mới nhất</h4>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-brand-red hover:underline uppercase cursor-pointer"
                    >
                      Xem tất cả ({orders.length}) →
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-y border-gray-200 text-gray-500 uppercase font-bold">
                        <tr>
                          <th className="py-2.5 px-3">Mã đơn</th>
                          <th className="py-2.5 px-3">Khách hàng</th>
                          <th className="py-2.5 px-3">Phương thức</th>
                          <th className="py-2.5 px-3">Trạng thái</th>
                          <th className="py-2.5 px-3 text-right">Tổng tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {orders.slice(0, 5).map(o => (
                          <tr key={o.id} className="hover:bg-gray-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-black">{o.id}</td>
                            <td className="py-2.5 px-3 font-semibold">{o.customer.fullName} ({o.customer.phone})</td>
                            <td className="py-2.5 px-3 uppercase text-gray-500">{o.paymentMethod}</td>
                            <td className="py-2.5 px-3 uppercase font-bold">{o.orderStatus}</td>
                            <td className="py-2.5 px-3 text-right font-black text-brand-red">{o.total.toLocaleString('vi-VN')}₫</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================= */}
            {/* TAB 2: QUẢN LÝ SẢN PHẨM                   */}
            {/* ========================================= */}
            {activeTab === 'products' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-black text-lg uppercase text-black">Danh sách Sản phẩm ({filteredProducts.length})</h3>
                    <p className="text-xs text-gray-500">Quản lý giá bán, biến thể kích cỡ, SKU và hình ảnh.</p>
                  </div>
                  <button
                    onClick={handleOpenNewProduct}
                    className="bg-brand-red text-white text-xs font-black uppercase px-4 py-2.5 rounded shadow hover:bg-black transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <i className="ph ph-plus-bold text-base"></i>
                    <span>Thêm sản phẩm mới</span>
                  </button>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Tìm theo tên, SKU, alias..."
                      value={prodSearch}
                      onChange={e => setProdSearch(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-xs font-semibold focus:outline-none focus:border-black"
                    />
                  </div>
                  <select
                    value={prodCategoryFilter}
                    onChange={e => setProdCategoryFilter(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-xs font-semibold bg-white cursor-pointer"
                  >
                    <option value="ALL">Tất cả danh mục</option>
                    {INITIAL_CATEGORIES.filter(c => c !== 'ALL').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-gray-200 rounded">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-black">
                      <tr>
                        <th className="py-3 px-3">Hình ảnh</th>
                        <th className="py-3 px-3">Tên sản phẩm</th>
                        <th className="py-3 px-3">Dòng</th>
                        <th className="py-3 px-3">Mã SKU</th>
                        <th className="py-3 px-3">Giá bán</th>
                        <th className="py-3 px-3">Biến thể Size & Tồn</th>
                        <th className="py-3 px-3">Trạng thái</th>
                        <th className="py-3 px-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {filteredProducts.map(p => {
                        const totalStock = p.sizes.reduce((sum, s) => sum + s.quantity, 0);
                        return (
                          <tr key={p.alias} className="hover:bg-gray-50">
                            <td className="py-2.5 px-3">
                              <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded bg-gray-100" />
                            </td>
                            <td className="py-2.5 px-3">
                              <p className="font-bold text-black capitalize">{p.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{p.alias}</p>
                            </td>
                            <td className="py-2.5 px-3 uppercase font-bold text-gray-600">{p.category}</td>
                            <td className="py-2.5 px-3 font-mono font-bold">{p.sku}</td>
                            <td className="py-2.5 px-3 font-black text-brand-red">{p.price}</td>
                            <td className="py-2.5 px-3">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {p.sizes.map(s => (
                                  <span
                                    key={s.label}
                                    className={`inline-block text-[10px] px-1.5 py-0.5 rounded border ${
                                      s.quantity > 0 ? 'bg-gray-50 text-gray-700 border-gray-200' : 'bg-red-50 text-red-500 border-red-200 line-through'
                                    }`}
                                  >
                                    {s.label}:{s.quantity}
                                  </span>
                                ))}
                              </div>
                              <span className="text-[10px] text-gray-400 font-bold block mt-0.5">Tổng: {totalStock} đôi</span>
                            </td>
                            <td className="py-2.5 px-3">
                              {p.available ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Còn hàng</span>
                              ) : (
                                <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded">Hết hàng</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => handleOpenAdjust(p.alias, p.sizes[0]?.label || '36')}
                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-black rounded text-[11px] font-bold cursor-pointer"
                                title="Nhập/xuất kho"
                              >
                                Kho
                              </button>
                              <button
                                onClick={() => handleEditProduct(p)}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-bold cursor-pointer"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.alias, p.name)}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[11px] font-bold cursor-pointer"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================= */}
            {/* TAB 3: QUẢN LÝ KHO & LỊCH SỬ BIẾN ĐỘNG    */}
            {/* ========================================= */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-lg uppercase text-black">Nhật ký biến động tồn kho</h3>
                      <p className="text-xs text-gray-500">Ghi nhận mọi giao dịch nhập kho, xuất kho và trừ hàng khi khách đặt đơn.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-black">
                        <tr>
                          <th className="py-2.5 px-3">Thời gian</th>
                          <th className="py-2.5 px-3">Sản phẩm</th>
                          <th className="py-2.5 px-3">Size & SKU</th>
                          <th className="py-2.5 px-3">Loại giao dịch</th>
                          <th className="py-2.5 px-3">Biến động</th>
                          <th className="py-2.5 px-3">Tồn cũ → mới</th>
                          <th className="py-2.5 px-3">Lý do</th>
                          <th className="py-2.5 px-3">Thực hiện bởi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {movements.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-gray-400">
                              Chưa có lịch sử biến động nào được ghi nhận.
                            </td>
                          </tr>
                        ) : (
                          movements.map(m => (
                            <tr key={m.id} className="hover:bg-gray-50">
                              <td className="py-2 px-3 text-gray-500">{new Date(m.createdAt).toLocaleString('vi-VN')}</td>
                              <td className="py-2 px-3 font-bold text-black capitalize">{m.productName}</td>
                              <td className="py-2 px-3 font-mono">Size {m.size} ({m.sku})</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                                    m.type === 'IMPORT' ? 'bg-emerald-100 text-emerald-800' :
                                    m.type === 'EXPORT' ? 'bg-red-100 text-red-800' :
                                    m.type === 'ORDER_DEDUCT' ? 'bg-amber-100 text-amber-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {m.type}
                                </span>
                              </td>
                              <td className={`py-2 px-3 font-black ${m.quantityChange > 0 ? 'text-emerald-700' : 'text-brand-red'}`}>
                                {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                              </td>
                              <td className="py-2 px-3 font-mono text-gray-600">{m.previousStock} → {m.newStock}</td>
                              <td className="py-2 px-3 text-gray-600">{m.reason}</td>
                              <td className="py-2 px-3 font-semibold text-gray-700">{m.performedBy}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================= */}
            {/* TAB 4: QUẢN LÝ ĐƠN HÀNG                   */}
            {/* ========================================= */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-black text-lg uppercase text-black">Quản lý Đơn hàng ({filteredOrders.length})</h3>
                    <p className="text-xs text-gray-500">Cập nhật quy trình giao hàng, vận đơn và hóa đơn.</p>
                  </div>
                  <button
                    onClick={handleExportOrdersCSV}
                    className="bg-emerald-700 text-white text-xs font-black uppercase px-4 py-2.5 rounded shadow hover:bg-emerald-800 transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <i className="ph ph-file-csv text-base"></i>
                    <span>Xuất báo cáo CSV</span>
                  </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Tìm theo mã đơn, tên khách, số điện thoại..."
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-xs font-semibold focus:outline-none focus:border-black"
                  />
                  <select
                    value={orderStatusFilter}
                    onChange={e => setOrderStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-xs font-semibold bg-white cursor-pointer"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="processing">Đang xử lý</option>
                    <option value="shipping">Đang giao</option>
                    <option value="delivered">Đã hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>

                {/* Orders Table */}
                <div className="overflow-x-auto border border-gray-200 rounded">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-black">
                      <tr>
                        <th className="py-3 px-3">Mã đơn</th>
                        <th className="py-3 px-3">Thời gian</th>
                        <th className="py-3 px-3">Khách hàng</th>
                        <th className="py-3 px-3">Số lượng SP</th>
                        <th className="py-3 px-3">Tổng tiền</th>
                        <th className="py-3 px-3">Phương thức</th>
                        <th className="py-3 px-3">Trạng thái</th>
                        <th className="py-3 px-3 text-right">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-400">
                            Không tìm thấy đơn hàng nào.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map(o => (
                          <tr key={o.id} className="hover:bg-gray-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-black">{o.id}</td>
                            <td className="py-2.5 px-3 text-gray-500">{new Date(o.createdAt).toLocaleString('vi-VN')}</td>
                            <td className="py-2.5 px-3">
                              <p className="font-bold text-black">{o.customer.fullName}</p>
                              <p className="text-[11px] text-gray-500 font-mono">{o.customer.phone}</p>
                            </td>
                            <td className="py-2.5 px-3 font-bold">{o.items.reduce((s, it) => s + it.quantity, 0)} đôi</td>
                            <td className="py-2.5 px-3 font-black text-brand-red">{o.total.toLocaleString('vi-VN')}₫</td>
                            <td className="py-2.5 px-3 uppercase text-gray-600">{o.paymentMethod}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                                  o.orderStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                                  o.orderStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
                                  o.orderStatus === 'shipping' ? 'bg-indigo-100 text-indigo-800' :
                                  o.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                                  'bg-red-100 text-red-800'
                                }`}
                              >
                                {o.orderStatus}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setTrackingInput(o.trackingCode || '');
                                  setCarrierInput(o.shippingCarrier || 'Giao Hàng Nhanh');
                                  setInternalNotesInput(o.internalNotes || '');
                                }}
                                className="px-3 py-1.5 bg-black text-white rounded text-[11px] font-bold hover:bg-brand-red transition cursor-pointer"
                              >
                                Xử lý
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================= */}
            {/* TAB 5: QUẢN LÝ KHUYẾN MÃI                  */}
            {/* ========================================= */}
            {activeTab === 'coupons' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-lg uppercase text-black">Mã giảm giá & Khuyến mãi</h3>
                    <p className="text-xs text-gray-500">Cấu hình mã giảm giá, giới hạn sử dụng và mức đơn tối thiểu.</p>
                  </div>
                  <button
                    onClick={() => {
                      setCouponForm({
                        code: '',
                        discountType: 'fixed',
                        discountValue: 50000,
                        minOrderValue: 400000,
                        usageLimit: 1000,
                        usedCount: 0,
                        active: true
                      });
                      setCouponModalOpen(true);
                    }}
                    className="bg-brand-red text-white text-xs font-black uppercase px-4 py-2.5 rounded shadow hover:bg-black transition cursor-pointer"
                  >
                    + Tạo mã mới
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {coupons.map(cp => (
                    <div key={cp.code} className="border border-gray-200 p-4 rounded bg-gray-50 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono font-black text-base text-brand-red uppercase">{cp.code}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cp.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-500'}`}>
                            {cp.active ? 'Hoạt động' : 'Tạm tắt'}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-black">
                          Giảm {cp.discountType === 'percent' ? `${cp.discountValue}%` : `${cp.discountValue.toLocaleString('vi-VN')}₫`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Đơn tối thiểu: {cp.minOrderValue.toLocaleString('vi-VN')}₫
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Đã dùng: {cp.usedCount} / {cp.usageLimit || '∞'}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-gray-200 flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setCouponForm(cp);
                            setCouponModalOpen(true);
                          }}
                          className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(cp.code)}
                          className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================= */}
            {/* TAB 6: CÀI ĐẶT CỬA HÀNG                   */}
            {/* ========================================= */}
            {activeTab === 'settings' && settings && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 max-w-3xl space-y-6">
                <div>
                  <h3 className="font-black text-lg uppercase text-black">Cài đặt Cửa hàng & Thanh toán</h3>
                  <p className="text-xs text-gray-500">Cập nhật hotline, email, thông báo và tài khoản chuyển khoản ngân hàng.</p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-4 text-xs md:text-sm">
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="font-bold uppercase text-gray-500 text-xs">Tên cửa hàng</span>
                      <input
                        type="text"
                        value={settings.storeName}
                        onChange={e => setSettings({ ...settings, storeName: e.target.value })}
                        className="mt-1 w-full border border-gray-300 p-2.5 rounded font-semibold focus:outline-none focus:border-black"
                      />
                    </label>

                    <label className="block">
                      <span className="font-bold uppercase text-gray-500 text-xs">Hotline hỗ trợ</span>
                      <input
                        type="text"
                        value={settings.hotline}
                        onChange={e => setSettings({ ...settings, hotline: e.target.value })}
                        className="mt-1 w-full border border-gray-300 p-2.5 rounded font-semibold focus:outline-none focus:border-black"
                      />
                    </label>

                    <label className="block">
                      <span className="font-bold uppercase text-gray-500 text-xs">Email liên hệ</span>
                      <input
                        type="email"
                        value={settings.email}
                        onChange={e => setSettings({ ...settings, email: e.target.value })}
                        className="mt-1 w-full border border-gray-300 p-2.5 rounded font-semibold focus:outline-none focus:border-black"
                      />
                    </label>

                    <label className="block">
                      <span className="font-bold uppercase text-gray-500 text-xs">Phí vận chuyển mặc định (VNĐ)</span>
                      <input
                        type="number"
                        value={settings.shippingFee}
                        onChange={e => setSettings({ ...settings, shippingFee: Number(e.target.value) })}
                        className="mt-1 w-full border border-gray-300 p-2.5 rounded font-semibold focus:outline-none focus:border-black"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="font-bold uppercase text-gray-500 text-xs">Thông báo đầu trang (Announcement Bar)</span>
                    <input
                      type="text"
                      value={settings.announcement}
                      onChange={e => setSettings({ ...settings, announcement: e.target.value })}
                      className="mt-1 w-full border border-gray-300 p-2.5 rounded font-semibold focus:outline-none focus:border-black"
                    />
                  </label>

                  <div className="pt-2 border-t space-y-3">
                    <h4 className="font-black uppercase text-xs text-black">Thông tin chuyển khoản ngân hàng</h4>
                    <div className="grid md:grid-cols-3 gap-3">
                      <label className="block">
                        <span className="font-bold text-gray-500 text-xs">Tên ngân hàng</span>
                        <input
                          type="text"
                          value={settings.bankInfo.bankName}
                          onChange={e => setSettings({
                            ...settings,
                            bankInfo: { ...settings.bankInfo, bankName: e.target.value }
                          })}
                          className="mt-1 w-full border border-gray-300 p-2 rounded text-xs font-semibold"
                        />
                      </label>
                      <label className="block">
                        <span className="font-bold text-gray-500 text-xs">Số tài khoản</span>
                        <input
                          type="text"
                          value={settings.bankInfo.accountNumber}
                          onChange={e => setSettings({
                            ...settings,
                            bankInfo: { ...settings.bankInfo, accountNumber: e.target.value }
                          })}
                          className="mt-1 w-full border border-gray-300 p-2 rounded text-xs font-semibold font-mono"
                        />
                      </label>
                      <label className="block">
                        <span className="font-bold text-gray-500 text-xs">Chủ tài khoản</span>
                        <input
                          type="text"
                          value={settings.bankInfo.accountName}
                          onChange={e => setSettings({
                            ...settings,
                            bankInfo: { ...settings.bankInfo, accountName: e.target.value }
                          })}
                          className="mt-1 w-full border border-gray-300 p-2 rounded text-xs font-semibold"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="bg-black text-white px-8 py-3 rounded text-xs font-black uppercase hover:bg-brand-red transition cursor-pointer"
                    >
                      Lưu cấu hình
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================= */}
      {/* MODAL: THÊM / SỬA SẢN PHẨM               */}
      {/* ========================================= */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setProductModalOpen(false)}></div>
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 relative z-10 animate-slide-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="font-black text-base uppercase">
                {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h3>
              <button onClick={() => setProductModalOpen(false)} className="text-2xl p-1 cursor-pointer">
                <i className="ph ph-x"></i>
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="py-4 space-y-4 text-xs md:text-sm">
              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="font-bold uppercase text-gray-500 text-xs">Tên sản phẩm *</span>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    required
                    placeholder="Ví dụ: Onitsuka Tiger Kem Hồng"
                    className="mt-1 w-full border border-gray-300 p-2.5 rounded font-semibold focus:outline-none focus:border-black"
                  />
                </label>

                <label className="block">
                  <span className="font-bold uppercase text-gray-500 text-xs">Mã SKU *</span>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                    required
                    placeholder="PVN668"
                    className="mt-1 w-full border border-gray-300 p-2.5 rounded font-semibold font-mono"
                  />
                </label>

                <label className="block">
                  <span className="font-bold uppercase text-gray-500 text-xs">Dòng sản phẩm *</span>
                  <select
                    value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                    className="mt-1 w-full border border-gray-300 p-2.5 rounded font-semibold bg-white"
                  >
                    {INITIAL_CATEGORIES.filter(c => c !== 'ALL').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="font-bold uppercase text-gray-500 text-xs">Giá bán (VNĐ) *</span>
                  <input
                    type="number"
                    value={productForm.priceValue}
                    onChange={e => setProductForm({ ...productForm, priceValue: Number(e.target.value) })}
                    required
                    className="mt-1 w-full border border-gray-300 p-2.5 rounded font-semibold"
                  />
                </label>
              </div>

              <label className="block">
                <span className="font-bold uppercase text-gray-500 text-xs">URL Hình ảnh *</span>
                <input
                  type="url"
                  value={productForm.image}
                  onChange={e => setProductForm({ ...productForm, image: e.target.value })}
                  placeholder="https://..."
                  required
                  className="mt-1 w-full border border-gray-300 p-2.5 rounded font-semibold text-xs"
                />
              </label>

              <label className="block">
                <span className="font-bold uppercase text-gray-500 text-xs">Mô tả sản phẩm</span>
                <textarea
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  rows={2}
                  className="mt-1 w-full border border-gray-300 p-2.5 rounded font-semibold text-xs"
                />
              </label>

              {/* Sizes Variants Table */}
              <div className="border p-3.5 rounded bg-gray-50 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold uppercase text-xs text-black">Biến thể kích cỡ & Tồn kho</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const label = prompt('Nhập size mới (ví dụ: 45):');
                      if (label) {
                        setProductForm({
                          ...productForm,
                          sizes: [...productForm.sizes, { label: label.trim(), available: true, quantity: 5, sku: '' }]
                        });
                      }
                    }}
                    className="text-xs font-bold text-brand-red hover:underline cursor-pointer"
                  >
                    + Thêm size
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {productForm.sizes.map((s, idx) => (
                    <div key={s.label} className="bg-white p-2 border rounded text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-black">Size {s.label}</span>
                        <input
                          type="checkbox"
                          checked={s.available}
                          onChange={e => {
                            const updated = [...productForm.sizes];
                            updated[idx].available = e.target.checked;
                            setProductForm({ ...productForm, sizes: updated });
                          }}
                        />
                      </div>
                      <label className="block">
                        <span className="text-[10px] text-gray-400">Số lượng:</span>
                        <input
                          type="number"
                          value={s.quantity}
                          onChange={e => {
                            const updated = [...productForm.sizes];
                            updated[idx].quantity = Number(e.target.value);
                            updated[idx].available = Number(e.target.value) > 0;
                            setProductForm({ ...productForm, sizes: updated });
                          }}
                          className="w-full border border-gray-200 px-1 py-0.5 rounded text-xs font-bold"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-xs font-bold uppercase cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand-red text-white rounded text-xs font-black uppercase hover:bg-black transition cursor-pointer"
                >
                  Lưu sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL: ĐIỀU CHỈNH KHO (NHẬP/XUẤT)         */}
      {/* ========================================= */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAdjustModalOpen(false)}></div>
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 relative z-10 animate-slide-in">
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="font-black text-base uppercase">Điều chỉnh tồn kho</h3>
              <button onClick={() => setAdjustModalOpen(false)} className="text-2xl p-1 cursor-pointer">
                <i className="ph ph-x"></i>
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="py-4 space-y-4 text-xs md:text-sm">
              <p className="font-bold text-black uppercase">{adjustData.productAlias}</p>

              <div>
                <label className="block font-bold text-xs uppercase text-gray-500 mb-1">Loại thao tác</label>
                <select
                  value={adjustData.type}
                  onChange={e => setAdjustData({ ...adjustData, type: e.target.value as any })}
                  className="w-full border p-2 rounded bg-white font-semibold"
                >
                  <option value="IMPORT">Nhập hàng (+)</option>
                  <option value="EXPORT">Xuất hàng (-)</option>
                  <option value="ADJUST">Kiểm kê / Điều chỉnh</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-xs uppercase text-gray-500 mb-1">Kích cỡ</label>
                  <input
                    type="text"
                    value={adjustData.size}
                    onChange={e => setAdjustData({ ...adjustData, size: e.target.value })}
                    required
                    className="w-full border p-2 rounded font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-xs uppercase text-gray-500 mb-1">Số lượng</label>
                  <input
                    type="number"
                    min="1"
                    value={adjustData.delta}
                    onChange={e => setAdjustData({ ...adjustData, delta: Number(e.target.value) })}
                    required
                    className="w-full border p-2 rounded font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-xs uppercase text-gray-500 mb-1">Lý do điều chỉnh *</label>
                <input
                  type="text"
                  value={adjustData.reason}
                  onChange={e => setAdjustData({ ...adjustData, reason: e.target.value })}
                  required
                  placeholder="Ví dụ: Nhập bổ sung lô hàng mới"
                  className="w-full border p-2 rounded font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 border rounded font-bold uppercase text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white rounded font-black uppercase text-xs hover:bg-brand-red transition"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL: CHI TIẾT & XỬ LÝ ĐƠN HÀNG          */}
      {/* ========================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
          <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full p-6 relative z-10 animate-slide-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <span className="text-xs text-gray-500 font-bold uppercase">Xử lý đơn hàng</span>
                <h3 className="font-mono font-black text-lg text-black">{selectedOrder.id}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-2xl p-1 cursor-pointer">
                <i className="ph ph-x"></i>
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs md:text-sm">
              <div className="bg-gray-50 p-3.5 rounded space-y-1.5 border">
                <p><strong>Khách hàng:</strong> {selectedOrder.customer.fullName} (<span className="font-mono">{selectedOrder.customer.phone}</span>)</p>
                <p><strong>Địa chỉ:</strong> {selectedOrder.customer.address}, {selectedOrder.customer.city}</p>
                <p><strong>Phương thức:</strong> {selectedOrder.paymentMethod.toUpperCase()} | Thanh toán: <strong className="uppercase">{selectedOrder.paymentStatus}</strong></p>
                {selectedOrder.customer.notes && <p className="text-gray-500"><strong>Ghi chú:</strong> {selectedOrder.customer.notes}</p>}
              </div>

              {/* Status Stepper */}
              <div>
                <h4 className="font-bold uppercase text-xs text-gray-500 mb-2">Cập nhật quy trình đơn hàng:</h4>
                <div className="flex flex-wrap gap-2">
                  {(['pending', 'processing', 'shipping', 'delivered'] as OrderStatus[]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, st)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase rounded border cursor-pointer ${
                        selectedOrder.orderStatus === st
                          ? 'bg-black text-white border-black ring-2 ring-black/20'
                          : 'border-gray-300 text-gray-700 hover:border-black'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                  {selectedOrder.orderStatus !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => handleAdminCancelOrder(selectedOrder.id)}
                      className="px-3 py-1.5 text-xs font-bold uppercase rounded border border-red-300 text-red-600 hover:bg-brand-red hover:text-white transition cursor-pointer"
                    >
                      Hủy & Hoàn kho
                    </button>
                  )}
                </div>
              </div>

              {/* Shipping info */}
              <div className="grid grid-cols-2 gap-3 border p-3 rounded bg-gray-50">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500">Đơn vị vận chuyển</label>
                  <input
                    type="text"
                    value={carrierInput}
                    onChange={e => setCarrierInput(e.target.value)}
                    placeholder="Giao Hàng Nhanh, ViettelPost..."
                    className="mt-1 w-full border bg-white p-1.5 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500">Mã vận đơn</label>
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={e => setTrackingInput(e.target.value)}
                    placeholder="VD: GHN987654321"
                    className="mt-1 w-full border bg-white p-1.5 rounded text-xs font-mono"
                  />
                </div>
              </div>

              {/* Products list */}
              <div>
                <h4 className="font-bold uppercase text-xs text-black mb-2">Sản phẩm trong đơn:</h4>
                <div className="space-y-2 border p-3 rounded">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold">{it.name}</p>
                        <p className="text-gray-500">Size {it.size} (SKU: {it.sizeSku}) x {it.quantity}</p>
                      </div>
                      <span className="font-black">{(it.priceValue * it.quantity).toLocaleString('vi-VN')}₫</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-2 flex justify-between font-black text-sm">
                <span>Tổng tiền:</span>
                <span className="text-brand-red">{selectedOrder.total.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border rounded text-xs font-bold uppercase cursor-pointer"
              >
                In hóa đơn
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-black text-white rounded text-xs font-black uppercase cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL: TẠO / SỬA MÃ GIẢM GIÁ              */}
      {/* ========================================= */}
      {couponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCouponModalOpen(false)}></div>
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 relative z-10 animate-slide-in">
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="font-black text-base uppercase">Cấu hình mã giảm giá</h3>
              <button onClick={() => setCouponModalOpen(false)} className="text-2xl p-1 cursor-pointer">
                <i className="ph ph-x"></i>
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="py-4 space-y-3.5 text-xs md:text-sm">
              <label className="block">
                <span className="font-bold uppercase text-gray-500 text-xs">Mã giảm giá (Code) *</span>
                <input
                  type="text"
                  value={couponForm.code}
                  onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  required
                  placeholder="VD: PHUANH50"
                  className="mt-1 w-full border p-2 rounded uppercase font-mono font-bold"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-bold uppercase text-gray-500 text-xs">Loại giảm</span>
                  <select
                    value={couponForm.discountType}
                    onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value as any })}
                    className="mt-1 w-full border p-2 rounded font-semibold bg-white"
                  >
                    <option value="fixed">Số tiền cố định (VNĐ)</option>
                    <option value="percent">Phần trăm (%)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="font-bold uppercase text-gray-500 text-xs">Mức giảm *</span>
                  <input
                    type="number"
                    value={couponForm.discountValue}
                    onChange={e => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                    required
                    className="mt-1 w-full border p-2 rounded font-bold"
                  />
                </label>
              </div>

              <label className="block">
                <span className="font-bold uppercase text-gray-500 text-xs">Đơn tối thiểu (VNĐ)</span>
                <input
                  type="number"
                  value={couponForm.minOrderValue}
                  onChange={e => setCouponForm({ ...couponForm, minOrderValue: Number(e.target.value) })}
                  className="mt-1 w-full border p-2 rounded font-semibold"
                />
              </label>

              <label className="block">
                <span className="font-bold uppercase text-gray-500 text-xs">Số lượt sử dụng tối đa</span>
                <input
                  type="number"
                  value={couponForm.usageLimit}
                  onChange={e => setCouponForm({ ...couponForm, usageLimit: Number(e.target.value) })}
                  className="mt-1 w-full border p-2 rounded font-semibold"
                />
              </label>

              <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={couponForm.active}
                  onChange={e => setCouponForm({ ...couponForm, active: e.target.checked })}
                  className="accent-black w-4 h-4"
                />
                <span className="font-bold text-black text-xs">Kích hoạt mã ngay</span>
              </label>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCouponModalOpen(false)}
                  className="px-4 py-2 border rounded font-bold uppercase text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand-red text-white rounded font-black uppercase text-xs hover:bg-black transition cursor-pointer"
                >
                  Lưu mã
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
