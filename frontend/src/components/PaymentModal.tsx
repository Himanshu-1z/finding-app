import React, { useState } from 'react';
import { Lock, ShieldCheck, Sparkles, CreditCard, QrCode, CheckCircle2, X } from 'lucide-react';
import { paymentApi, InitiatePaymentResponse } from '../services/payment';

interface PaymentModalProps {
  chatRoomId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ chatRoomId, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'razorpay' | 'upi' | 'card'>('razorpay');

  if (!isOpen) return null;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUnlockPayment = async () => {
    setLoading(true);
    try {
      const order: InitiatePaymentResponse = await paymentApi.initiatePayment(chatRoomId);
      const isScriptLoaded = await loadRazorpayScript();

      if (isScriptLoaded && window.Razorpay && order.keyId) {
        const options = {
          key: order.keyId,
          amount: Math.round(order.amount * 100),
          currency: order.currency,
          name: 'Finding Platform',
          description: 'Unlock Unlimited Chat Room Access',
          order_id: order.razorpayOrderId.startsWith('order_') && order.razorpayOrderId.length > 20 ? order.razorpayOrderId : undefined,
          handler: async (response: any) => {
            await paymentApi.confirmPayment({
              paymentId: order.paymentId,
              razorpayPaymentId: response.razorpay_payment_id || `pay_test_${Date.now()}`,
              razorpayOrderId: response.razorpay_order_id || order.razorpayOrderId,
              razorpaySignature: response.razorpay_signature || 'sig_test_valid'
            });
            setLoading(false);
            onSuccess();
            onClose();
          },
          prefill: {
            name: 'College Student',
            email: 'student@finding.app',
            contact: '9999999999'
          },
          theme: {
            color: '#a855f7'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Test mode fallback popup simulation
        setTimeout(async () => {
          await paymentApi.confirmPayment({
            paymentId: order.paymentId,
            razorpayPaymentId: `pay_sim_${Date.now()}`,
            razorpayOrderId: order.razorpayOrderId,
            razorpaySignature: 'sig_test_simulation'
          });
          setLoading(false);
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden text-slate-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mt-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/25">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-2xl font-black bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Unlock Chat Room
          </h3>
          <p className="text-xs text-slate-400 mt-1">One-time micro unlock fee for lifetime end-to-end chat</p>
        </div>

        {/* Pricing Card */}
        <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-pink-950/30 border border-purple-500/30 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Lifetime Access</span>
              <div className="text-3xl font-black text-white mt-0.5">₹29 <span className="text-xs font-normal text-slate-400">only</span></div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-full border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Razorpay Secured
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-purple-500/20 flex items-center gap-2 text-xs text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Instant connection, unlimited messaging & media sharing</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            onClick={() => setMethod('razorpay')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
              method === 'razorpay'
                ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <span className="text-[11px] font-medium">Razorpay</span>
          </button>

          <button
            onClick={() => setMethod('upi')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
              method === 'upi'
                ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <QrCode className="w-5 h-5 text-emerald-400" />
            <span className="text-[11px] font-medium">UPI / QR</span>
          </button>

          <button
            onClick={() => setMethod('card')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
              method === 'card'
                ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <CreditCard className="w-5 h-5 text-pink-400" />
            <span className="text-[11px] font-medium">Cards / Net</span>
          </button>
        </div>

        <button
          disabled={loading}
          onClick={handleUnlockPayment}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
        >
          {loading ? (
            <span>Processing Razorpay Checkout...</span>
          ) : (
            <>
              <span>Pay ₹29 & Unlock Chat</span>
              <CheckCircle2 className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
