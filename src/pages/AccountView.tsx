import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOrdersByUser, cancelOrder } from '../services/orderService';
import { updateUserProfile } from '../services/authService';
import { Order, Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { useToast } from '../components/Toast';

interface AccountViewProps {
  initialTab?: string;
  allProducts: Product[];
  onSelectProduct: (alias: string) => void;
  onNavigateHome: () => void;
  favorites: string[];
  onToggleFavorite: (id: string | number) => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  initialTab = 'profile',
  allProducts,
  onSelectProduct,
  onNavigateHome,
  favorites,
  onToggleFavorite
}) => {
  const { currentUser, profile, refreshProfile, openLoginModal } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'wishlist'>(
    initialTab === 'orders' ? 'orders' : initialTab === 'wishlist' ? 'wishlist' : 'profile'
  );

  // Profile Form state
  const [name, setName] = useState(profile?.displayName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [city, setCity] = useState(profile?.city || 'TP. Hồ Chí Minh');
  const [savingProfile, setSavingProfile] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.displayName || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setCity(profile.city || 'TP. Hồ Chí Minh');
    }
  }, [profile]);

  useEffect(() => {
    if (currentUser && activeTab === 'orders') {
      loadUserOrders();
    }
  }, [currentUser, activeTab]);

  const loadUserOrders = async () => {
    if (!currentUser) return;
    setLoadingOrders(true);
    try {
      const userOrders = await getOrdersByUser(currentUser.uid);
      setOrders(userOrders);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingProfile(true);
    try {
      await updateUserProfile(currentUser.uid, {
        displayName: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city
      });
      await refreshProfile();
      showToast('Cập nhật hồ sơ thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu hồ sơ', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const reason = window.prompt('Vui lòng nhập lý do hủy đơn hàng:');
    if (reason === null) return;

    setCancellingOrder(true);
    try {
      await cancelOrder(orderId, reason.trim() || 'Khách hàng yêu cầu hủy', currentUser?.displayName || 'Customer');
      showToast('Đã hủy đơn hàng thành công!', 'success');
      await loadUserOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Không thể hủy đơn hàng này.', 'error');
    } finally {
      setCancellingOrder(false);
    }
  };

  const favoriteProducts = allProducts.filter(p =>
    favorites.includes(String(p.id)) || favorites.includes(p.alias)
  );

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <i className="ph ph-user-circle text-6xl text-gray-300 mb-3"></i>
        <h2 className="text-2xl font-black uppercase mb-2">Bạn chưa đăng nhập</h2>
        <p className="text-sm text-gray-500 mb-6">
          Vui lòng đăng nhập để xem thông tin hồ sơ và đơn hàng của bạn.
        </p>
        <button
          onClick={openLoginModal}
          className="bg-brand-red text-white font-bold px-8 py-3 rounded uppercase text-sm hover:bg-black transition cursor-pointer"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  const getStatusBadge = (status: Order['orderStatus']) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded">Chờ xử lý</span>;
      case 'processing':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-1 rounded">Đang xử lý</span>;
      case 'shipping':
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-1 rounded">Đang giao hàng</span>;
      case 'delivered':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded">Đã giao thành công</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 text-[10px] font-black px-2.5 py-1 rounded">Đã hủy</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-[10px] font-black px-2.5 py-1 rounded">{status}</span>;
    }
  };

  return (
    <div className="bg-gray-50 min-h-[75vh] py-8 md:py-12 animate-slide-in">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Breadcrumb */}
        <div className="text-xs font-semibold text-gray-500 mb-6 flex items-center space-x-2">
          <button onClick={onNavigateHome} className="hover:text-black cursor-pointer">
            Trang chủ
          </button>
          <span>/</span>
          <span className="text-black font-bold">Tài khoản cá nhân</span>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Bar */}
          <div className="bg-brand-dark text-white p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-xs uppercase text-brand-red font-black tracking-widest mb-1">Tài khoản khách hàng</p>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                {profile?.displayName || currentUser.email}
              </h1>
              <p className="text-gray-400 text-xs mt-0.5">{currentUser.email}</p>
            </div>
            {profile?.role === 'ADMIN' && (
              <span className="bg-brand-red text-white text-xs font-black uppercase px-3 py-1.5 rounded">
                Quản trị viên hệ thống
              </span>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3.5 px-6 text-xs md:text-sm font-bold uppercase transition border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-brand-red text-brand-red bg-white'
                  : 'border-transparent text-gray-600 hover:text-black'
              }`}
            >
              <i className="ph ph-user-circle mr-2 text-base"></i> Hồ sơ & Địa chỉ
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3.5 px-6 text-xs md:text-sm font-bold uppercase transition border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-brand-red text-brand-red bg-white'
                  : 'border-transparent text-gray-600 hover:text-black'
              }`}
            >
              <i className="ph ph-package mr-2 text-base"></i> Đơn hàng của tôi
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`py-3.5 px-6 text-xs md:text-sm font-bold uppercase transition border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'wishlist'
                  ? 'border-brand-red text-brand-red bg-white'
                  : 'border-transparent text-gray-600 hover:text-black'
              }`}
            >
              <i className="ph ph-heart mr-2 text-base"></i> Yêu thích ({favoriteProducts.length})
            </button>
          </div>

          {/* Tab 1: Profile Form */}
          {activeTab === 'profile' && (
            <div className="p-6 md:p-8 max-w-2xl">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-gray-500">Họ và tên</span>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Nhập họ và tên"
                      required
                      className="mt-1 w-full border border-gray-300 px-3.5 py-2.5 text-sm font-semibold rounded focus:outline-none focus:border-black"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold uppercase text-gray-500">Số điện thoại</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="0397233999"
                      className="mt-1 w-full border border-gray-300 px-3.5 py-2.5 text-sm font-semibold rounded focus:outline-none focus:border-black"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-bold uppercase text-gray-500">Địa chỉ giao hàng mặc định</span>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Số nhà, đường, phường/xã..."
                    className="mt-1 w-full border border-gray-300 px-3.5 py-2.5 text-sm font-semibold rounded focus:outline-none focus:border-black"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase text-gray-500">Tỉnh / Thành phố</span>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="mt-1 w-full border border-gray-300 px-3.5 py-2.5 text-sm font-semibold bg-white rounded focus:outline-none focus:border-black"
                  >
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                    <option value="Hải Phòng">Hải Phòng</option>
                    <option value="Khác">Tỉnh thành khác</option>
                  </select>
                </label>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-black text-white px-8 py-3 text-xs font-black uppercase tracking-wider rounded hover:bg-brand-red transition cursor-pointer disabled:opacity-50"
                  >
                    {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Orders List */}
          {activeTab === 'orders' && (
            <div className="p-6 md:p-8">
              {loadingOrders ? (
                <div className="py-12 text-center text-sm font-bold text-gray-500">
                  <i className="ph ph-spinner animate-spin text-3xl mb-2"></i>
                  <p>Đang tải lịch sử đơn hàng...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <i className="ph ph-receipt text-5xl text-gray-300 mb-2"></i>
                  <p className="font-bold text-black text-sm uppercase">Bạn chưa có đơn hàng nào</p>
                  <p className="text-xs text-gray-400 mt-1">Các đơn hàng bạn đặt sẽ xuất hiện tại đây.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div
                      key={order.id}
                      className="border border-gray-200 rounded p-4 md:p-5 bg-white shadow-sm hover:border-black transition"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-3 border-b border-gray-100 gap-2">
                        <div>
                          <span className="font-mono font-black text-sm text-black mr-3">{order.id}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(order.orderStatus)}
                          <span className="text-xs text-gray-500 font-bold uppercase">
                            {order.paymentMethod.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="py-3 divide-y divide-gray-50">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-2 flex items-center justify-between text-xs md:text-sm">
                            <div className="flex items-center space-x-3">
                              <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded bg-gray-100" />
                              <div>
                                <p className="font-bold text-black capitalize">{item.name}</p>
                                <p className="text-[11px] text-gray-500">
                                  Size: <strong>{item.size}</strong> | Số lượng: {item.quantity}
                                </p>
                              </div>
                            </div>
                            <span className="font-bold">
                              {(item.priceValue * item.quantity).toLocaleString('vi-VN')}₫
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="text-xs text-gray-600">
                          <span>Tổng thanh toán: </span>
                          <span className="font-black text-brand-red text-base">
                            {order.total.toLocaleString('vi-VN')}₫
                          </span>
                          {order.trackingCode && (
                            <span className="block text-[11px] text-indigo-700 mt-0.5">
                              Mã vận đơn: <strong>{order.trackingCode}</strong> ({order.shippingCarrier})
                            </span>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="px-3.5 py-1.5 border border-gray-300 text-xs font-bold rounded uppercase hover:bg-black hover:text-white transition cursor-pointer"
                          >
                            Xem chi tiết
                          </button>
                          {order.orderStatus === 'pending' && (
                            <button
                              type="button"
                              disabled={cancellingOrder}
                              onClick={() => handleCancelOrder(order.id)}
                              className="px-3.5 py-1.5 border border-red-300 text-red-600 text-xs font-bold rounded uppercase hover:bg-brand-red hover:text-white transition cursor-pointer disabled:opacity-50"
                            >
                              Hủy đơn
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Wishlist */}
          {activeTab === 'wishlist' && (
            <div className="p-6 md:p-8">
              {favoriteProducts.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <i className="ph ph-heart text-5xl text-gray-300 mb-2"></i>
                  <p className="font-bold text-black text-sm uppercase">Danh sách yêu thích trống</p>
                  <p className="text-xs text-gray-400 mt-1">Nhấn biểu tượng trái tim ở các sản phẩm để lưu lại tại đây.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {favoriteProducts.map(prod => (
                    <ProductCard
                      key={prod.alias || prod.id}
                      product={prod}
                      onSelect={onSelectProduct}
                      isFavorite={true}
                      onToggleFavorite={onToggleFavorite}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 relative z-10 animate-slide-in max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <p className="text-xs text-gray-500">Chi tiết đơn hàng</p>
                <h3 className="font-mono font-black text-base">{selectedOrder.id}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-2xl p-1 cursor-pointer">
                <i className="ph ph-x"></i>
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs md:text-sm">
              <div className="bg-gray-50 p-3 rounded space-y-1">
                <p><strong>Người nhận:</strong> {selectedOrder.customer.fullName} ({selectedOrder.customer.phone})</p>
                <p><strong>Địa chỉ:</strong> {selectedOrder.customer.address}, {selectedOrder.customer.city}</p>
                <p><strong>Trạng thái:</strong> {selectedOrder.orderStatus.toUpperCase()}</p>
                <p><strong>Thanh toán:</strong> {selectedOrder.paymentMethod.toUpperCase()} ({selectedOrder.paymentStatus})</p>
              </div>

              <div>
                <h4 className="font-bold uppercase text-xs mb-2">Sản phẩm:</h4>
                <div className="space-y-2 border p-3 rounded">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold">{it.name}</p>
                        <p className="text-gray-500">Size {it.size} x {it.quantity}</p>
                      </div>
                      <span className="font-bold">{(it.priceValue * it.quantity).toLocaleString('vi-VN')}₫</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3 space-y-1 text-xs">
                <div className="flex justify-between"><span>Tạm tính:</span><span>{selectedOrder.subtotal.toLocaleString('vi-VN')}₫</span></div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-brand-red"><span>Giảm giá:</span><span>-{selectedOrder.discount.toLocaleString('vi-VN')}₫</span></div>
                )}
                <div className="flex justify-between"><span>Vận chuyển:</span><span>{selectedOrder.shippingFee.toLocaleString('vi-VN')}₫</span></div>
                <div className="flex justify-between text-sm font-black border-t pt-2">
                  <span>Tổng cộng:</span>
                  <span className="text-brand-red">{selectedOrder.total.toLocaleString('vi-VN')}₫</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-black text-white px-5 py-2 text-xs font-bold uppercase rounded cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
