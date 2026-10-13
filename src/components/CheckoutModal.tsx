import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../services/orderService';
import { PaymentMethod } from '../types';
import { useToast } from './Toast';

export const CheckoutModal: React.FC = () => {
  const {
    cart,
    subtotal,
    discount,
    shippingFee,
    total,
    appliedCoupon,
    couponMessage,
    isCheckoutOpen,
    closeCheckout,
    updateQuantity,
    removeFromCart,
    applyCouponCode,
    removeCoupon,
    clearCart,
    setLastOrder
  } = useCart();

  const { currentUser, profile } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('TP. Hồ Chí Minh');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [agreeCall, setAgreeCall] = useState(true);
  const [couponInput, setCouponInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill profile info
  useEffect(() => {
    if (profile) {
      if (profile.displayName && !fullName) setFullName(profile.displayName);
      if (profile.phone && !phone) setPhone(profile.phone);
      if (profile.address && !address) setAddress(profile.address);
      if (profile.city && !city) setCity(profile.city);
    }
  }, [profile]);

  if (!isCheckoutOpen) return null;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    const res = await applyCouponCode(couponInput.trim());
    if (res.valid) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!fullName.trim()) {
      showToast('Vui lòng nhập họ và tên người nhận', 'error');
      return;
    }
    const cleanPhone = phone.replace(/\s+/g, '');
    if (!cleanPhone || !/^\d{9,11}$/.test(cleanPhone)) {
      showToast('Vui lòng nhập số điện thoại hợp lệ (9 - 11 chữ số)', 'error');
      return;
    }
    if (!address.trim()) {
      showToast('Vui lòng nhập địa chỉ giao hàng chi tiết', 'error');
      return;
    }
    if (cart.length === 0) {
      showToast('Giỏ hàng của bạn đang trống', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        userId: currentUser?.uid || 'guest',
        userEmail: currentUser?.email || '',
        customer: {
          fullName: fullName.trim(),
          phone: cleanPhone,
          address: address.trim(),
          city,
          notes: notes.trim()
        },
        items: cart,
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'unpaid',
        couponCode: appliedCoupon || undefined,
        subtotal,
        discount,
        shippingFee,
        total
      });

      setLastOrder(order);
      clearCart();
      closeCheckout();
      showToast(`Đặt hàng thành công! Mã đơn: ${order.id}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeCheckout}
      ></div>

      {/* Modal Window */}
      <section className="bg-white w-full max-w-6xl max-h-[92vh] overflow-y-auto shadow-2xl relative z-10 animate-slide-in rounded-sm">
        {/* Modal Header */}
        <div className="bg-brand-dark text-white px-5 md:px-8 py-4 md:py-5 flex items-center justify-between border-b-4 border-brand-red sticky top-0 z-20">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-red mb-0.5">PhuAnh Sneaker</p>
            <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight">Thanh toán đơn hàng</h2>
          </div>
          <button
            onClick={closeCheckout}
            className="w-10 h-10 bg-white/10 hover:bg-brand-red text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Đóng thanh toán"
          >
            <i className="ph ph-x text-2xl"></i>
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-0">
          {/* Customer & Payment Form */}
          <form onSubmit={handlePlaceOrder} className="p-5 md:p-8 bg-white space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h3 className="text-base md:text-lg font-black uppercase tracking-wide text-black">
                  1. Thông tin nhận hàng
                </h3>
                <span className="text-xs font-bold text-gray-500 uppercase">Giao tận nơi</span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase text-gray-500">Họ và tên *</span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    required
                    className="mt-1.5 w-full border border-gray-300 px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-black focus:ring-1 focus:ring-black rounded-sm"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase text-gray-500">Số điện thoại *</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0397233999"
                    required
                    className="mt-1.5 w-full border border-gray-300 px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-black focus:ring-1 focus:ring-black rounded-sm"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-xs font-bold uppercase text-gray-500">Địa chỉ giao hàng chi tiết *</span>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện"
                    required
                    className="mt-1.5 w-full border border-gray-300 px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-black focus:ring-1 focus:ring-black rounded-sm"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase text-gray-500">Tỉnh / Thành phố *</span>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="mt-1.5 w-full border border-gray-300 px-3.5 py-2.5 text-sm font-semibold bg-white focus:outline-none focus:border-black rounded-sm cursor-pointer"
                  >
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                    <option value="Hải Phòng">Hải Phòng</option>
                    <option value="Bình Dương">Bình Dương</option>
                    <option value="Đồng Nai">Đồng Nai</option>
                    <option value="Khác">Tỉnh thành khác</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase text-gray-500">Ghi chú giao hàng</span>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Ví dụ: Giao giờ hành chính, gọi trước..."
                    className="mt-1.5 w-full border border-gray-300 px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-black rounded-sm"
                  />
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h3 className="text-base md:text-lg font-black uppercase tracking-wide text-black">
                  2. Phương thức thanh toán
                </h3>
                <span className="text-xs font-bold text-gray-500 uppercase">An toàn & Bảo mật</span>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <label
                  onClick={() => setPaymentMethod('cod')}
                  className={`payment-option cursor-pointer p-4 flex flex-col gap-2 rounded-sm transition ${
                    paymentMethod === 'cod' ? 'active' : ''
                  }`}
                >
                  <span className="payment-icon w-9 h-9 flex items-center justify-center rounded">
                    <i className="ph ph-money text-2xl"></i>
                  </span>
                  <span className="font-black uppercase text-sm">COD</span>
                  <span className="payment-copy text-xs leading-relaxed">
                    Thanh toán tiền mặt khi nhận hàng.
                  </span>
                </label>

                <label
                  onClick={() => setPaymentMethod('transfer')}
                  className={`payment-option cursor-pointer p-4 flex flex-col gap-2 rounded-sm transition ${
                    paymentMethod === 'transfer' ? 'active' : ''
                  }`}
                >
                  <span className="payment-icon w-9 h-9 flex items-center justify-center rounded">
                    <i className="ph ph-bank text-2xl"></i>
                  </span>
                  <span className="font-black uppercase text-sm">Chuyển khoản</span>
                  <span className="payment-copy text-xs leading-relaxed">
                    Quét mã VietQR hoặc chuyển khoản Vietcombank.
                  </span>
                </label>

                <label
                  onClick={() => setPaymentMethod('card')}
                  className={`payment-option cursor-pointer p-4 flex flex-col gap-2 rounded-sm transition ${
                    paymentMethod === 'card' ? 'active' : ''
                  }`}
                >
                  <span className="payment-icon w-9 h-9 flex items-center justify-center rounded">
                    <i className="ph ph-credit-card text-2xl"></i>
                  </span>
                  <span className="font-black uppercase text-sm">Thẻ / Ví</span>
                  <span className="payment-copy text-xs leading-relaxed">
                    Visa, Mastercard hoặc ví điện tử.
                  </span>
                </label>
              </div>

              {/* Dynamic Payment Instruction Panel */}
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 text-xs md:text-sm text-gray-700 leading-relaxed rounded-sm">
                {paymentMethod === 'cod' && (
                  <p>
                    📦 Bạn sẽ thanh toán bằng tiền mặt trực tiếp cho shipper khi nhận và kiểm tra hàng. Nhân viên PhuAnh Sneaker sẽ gọi xác nhận đơn trước khi đóng gói.
                  </p>
                )}

                {paymentMethod === 'transfer' && (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="bg-white p-2 border border-gray-200 shadow-sm rounded shrink-0">
                        <img
                          src={`https://api.vietqr.io/image/970436-1234567890-compact2.jpg?amount=${total}&accountName=PHUANH%20SNEAKER`}
                          alt="VietQR PhuAnh Sneaker"
                          className="w-32 h-32 object-contain"
                        />
                      </div>
                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-black uppercase">Thông tin tài khoản cửa hàng:</p>
                        <p>Ngân hàng: <strong className="text-black">Vietcombank</strong></p>
                        <p>Số tài khoản: <strong className="font-mono text-brand-red text-sm">1234567890</strong></p>
                        <p>Chủ tài khoản: <strong className="text-black">PHUANH SNEAKER</strong></p>
                        <p className="text-gray-500 pt-1">
                          Nội dung chuyển khoản: <span className="font-mono font-bold text-black">{phone || 'Họ tên + SĐT'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <p>
                    💳 Thanh toán trực tuyến an toàn. Sau khi đặt hàng, nhân viên CSKH sẽ gửi cổng liên kết thanh toán bảo mật 256-bit qua Zalo hoặc SMS xác nhận đơn.
                  </p>
                )}
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={agreeCall}
                onChange={e => setAgreeCall(e.target.checked)}
                className="mt-0.5 accent-black"
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                Tôi đồng ý nhận cuộc gọi xác nhận đơn từ PhuAnh Sneaker trước khi hàng được vận chuyển.
              </span>
            </label>
          </form>

          {/* Cart Items & Cost Summary */}
          <aside className="bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200 p-5 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-3">
                <h3 className="text-base md:text-lg font-black uppercase tracking-wide text-black">
                  Giỏ hàng của bạn
                </h3>
                <span className="bg-brand-red text-white text-xs font-black px-2.5 py-0.5 rounded">
                  {cart.length} mẫu giày
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">Giỏ hàng của bạn đang trống</p>
                ) : (
                  cart.map((item, index) => (
                    <div
                      key={`${item.alias}-${item.size}`}
                      className="flex gap-3 bg-white border border-gray-200 p-3 rounded-sm shadow-sm"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover bg-gray-100 rounded shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-xs md:text-sm text-black line-clamp-1 capitalize">
                            {item.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeFromCart(index)}
                            className="text-gray-400 hover:text-brand-red text-sm ml-2 cursor-pointer"
                            title="Xóa"
                          >
                            <i className="ph ph-trash"></i>
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Size: <strong className="text-black">{item.size}</strong> | SKU: {item.sizeSku}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateQuantity(index, -1)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 text-xs font-bold cursor-pointer"
                            >
                              −
                            </button>
                            <span className="px-2 text-xs font-bold text-center min-w-[24px]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(index, 1)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 text-xs font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-black text-xs md:text-sm text-brand-red">
                            {(item.priceValue * item.quantity).toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Coupon Code Box */}
              <div className="mt-4 bg-white border border-gray-200 p-3 rounded-sm">
                <label className="text-xs font-bold uppercase text-gray-500">Mã ưu đãi (Coupon)</label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value)}
                    placeholder="Ví dụ: PHUANH50"
                    className="w-full border border-gray-300 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-black uppercase rounded-sm"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="bg-gray-200 text-black px-3 text-xs font-bold uppercase hover:bg-gray-300 transition shrink-0 rounded-sm cursor-pointer"
                    >
                      Xóa mã
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="bg-black text-white px-3 text-xs font-black uppercase hover:bg-brand-red transition shrink-0 rounded-sm cursor-pointer"
                    >
                      Áp dụng
                    </button>
                  )}
                </div>
                {couponMessage && (
                  <p className={`mt-1.5 text-xs font-semibold ${discount > 0 ? 'text-emerald-700' : 'text-brand-red'}`}>
                    {couponMessage}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="mt-4 space-y-2 text-xs md:text-sm pt-2 border-t border-gray-200">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span className="font-bold text-black">{subtotal.toLocaleString('vi-VN')}₫</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-brand-red">
                    <span>Giảm giá ({appliedCoupon})</span>
                    <span className="font-bold">-{discount.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span className="font-bold text-black">
                    {shippingFee === 0 && cart.length > 0 ? (
                      <span className="text-emerald-700 font-bold">Miễn phí</span>
                    ) : (
                      `${shippingFee.toLocaleString('vi-VN')}₫`
                    )}
                  </span>
                </div>
                <div className="border-t border-gray-300 pt-3 flex justify-between items-end">
                  <span className="font-black uppercase text-black text-sm md:text-base">Tổng thanh toán</span>
                  <span className="text-xl md:text-2xl font-black text-brand-red">
                    {total.toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={submitting || cart.length === 0}
                className="w-full bg-brand-red text-white font-black uppercase py-4 hover:bg-black transition flex items-center justify-center space-x-2 text-sm md:text-base rounded-sm shadow-md cursor-pointer disabled:opacity-50"
              >
                <span>{submitting ? 'Đang tạo đơn hàng...' : 'Đặt hàng ngay'}</span>
                <i className="ph ph-arrow-right text-lg"></i>
              </button>
              <p className="mt-2 text-[11px] text-gray-500 text-center">
                Mọi thông tin thanh toán và đơn hàng đều được lưu trữ an toàn trên Cloud Firestore.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};
