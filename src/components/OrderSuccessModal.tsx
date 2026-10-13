import React from 'react';
import { useCart } from '../context/CartContext';

interface OrderSuccessModalProps {
  onViewAccountOrders: () => void;
  onContinueShopping: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  onViewAccountOrders,
  onContinueShopping
}) => {
  const { lastOrder, setLastOrder } = useCart();

  if (!lastOrder) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setLastOrder(null);
    onContinueShopping();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={handleClose}></div>

      <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl relative z-10 overflow-hidden animate-slide-in my-8">
        {/* Header */}
        <div className="bg-emerald-600 text-white p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="ph ph-check text-4xl text-white"></i>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Đặt hàng thành công!</h2>
          <p className="text-emerald-100 text-xs md:text-sm mt-1">
            Cảm ơn bạn đã mua sắm tại PhuAnh Sneaker. Mã đơn hàng của bạn là:
          </p>
          <div className="inline-block bg-white text-emerald-800 font-mono font-black text-lg px-4 py-1.5 rounded mt-3 shadow-inner">
            {lastOrder.id}
          </div>
        </div>

        {/* Order Details Body */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Receiver Info */}
          <div className="bg-gray-50 p-4 rounded border border-gray-200 text-xs md:text-sm space-y-1">
            <h4 className="font-black text-black uppercase text-xs mb-2">Thông tin người nhận:</h4>
            <p><span className="text-gray-500">Họ và tên:</span> <strong>{lastOrder.customer.fullName}</strong></p>
            <p><span className="text-gray-500">Số điện thoại:</span> <strong>{lastOrder.customer.phone}</strong></p>
            <p><span className="text-gray-500">Địa chỉ giao:</span> {lastOrder.customer.address}, {lastOrder.customer.city}</p>
            {lastOrder.customer.notes && (
              <p><span className="text-gray-500">Ghi chú:</span> {lastOrder.customer.notes}</p>
            )}
            <p><span className="text-gray-500">Phương thức thanh toán:</span> <strong className="uppercase">{lastOrder.paymentMethod}</strong></p>
          </div>

          {/* Transfer Bank Info if transfer */}
          {lastOrder.paymentMethod === 'transfer' && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded text-xs text-amber-900 space-y-2">
              <h4 className="font-bold uppercase flex items-center">
                <i className="ph ph-bank mr-1.5 text-base"></i> Hướng dẫn chuyển khoản:
              </h4>
              <p>Ngân hàng: <strong>Vietcombank</strong> | STK: <strong className="font-mono text-brand-red">1234567890</strong></p>
              <p>Chủ TK: <strong>PHUANH SNEAKER</strong> | Số tiền: <strong>{lastOrder.total.toLocaleString('vi-VN')}₫</strong></p>
              <p>Nội dung chuyển khoản: <strong className="font-mono bg-white px-2 py-0.5 border rounded">{lastOrder.id} - {lastOrder.customer.phone}</strong></p>
            </div>
          )}

          {/* Items List */}
          <div>
            <h4 className="font-black text-xs uppercase text-gray-700 mb-2">Chi tiết sản phẩm ({lastOrder.items.length}):</h4>
            <div className="space-y-2 border border-gray-200 rounded divide-y divide-gray-100">
              {lastOrder.items.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-xs md:text-sm">
                  <div className="flex items-center space-x-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded bg-gray-100 shrink-0" />
                    <div>
                      <p className="font-bold text-black capitalize">{item.name}</p>
                      <p className="text-gray-500 text-[11px]">Size: <strong>{item.size}</strong> | SL: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-black text-black">
                    {(item.priceValue * item.quantity).toLocaleString('vi-VN')}₫
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-4 rounded text-xs md:text-sm space-y-1.5 border border-gray-200">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính</span>
              <span>{lastOrder.subtotal.toLocaleString('vi-VN')}₫</span>
            </div>
            {lastOrder.discount > 0 && (
              <div className="flex justify-between text-brand-red">
                <span>Giảm giá ({lastOrder.couponCode})</span>
                <span>-{lastOrder.discount.toLocaleString('vi-VN')}₫</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Phí vận chuyển</span>
              <span>{lastOrder.shippingFee === 0 ? 'Miễn phí' : `${lastOrder.shippingFee.toLocaleString('vi-VN')}₫`}</span>
            </div>
            <div className="flex justify-between items-center text-sm md:text-base font-black border-t border-gray-200 pt-2 text-black">
              <span>Tổng cộng thanh toán:</span>
              <span className="text-brand-red text-lg md:text-xl">{lastOrder.total.toLocaleString('vi-VN')}₫</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-100 border-t flex flex-col sm:flex-row gap-2 justify-end">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 border border-gray-300 text-xs font-bold rounded uppercase hover:bg-white transition cursor-pointer flex items-center justify-center"
          >
            <i className="ph ph-printer mr-1.5 text-base"></i> In phiếu đơn hàng
          </button>
          <button
            onClick={() => {
              setLastOrder(null);
              onViewAccountOrders();
            }}
            className="px-4 py-2.5 bg-black text-white text-xs font-bold rounded uppercase hover:bg-brand-red transition cursor-pointer flex items-center justify-center"
          >
            <i className="ph ph-package mr-1.5 text-base"></i> Xem đơn hàng của tôi
          </button>
          <button
            onClick={handleClose}
            className="px-5 py-2.5 bg-brand-red text-white text-xs font-black rounded uppercase hover:bg-black transition cursor-pointer text-center"
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    </div>
  );
};
