'use client'
import { useState } from 'react'
import { X, Smartphone, ShieldCheck, Loader2, CheckCircle2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  booking: {
    id: number
    booking_ref: string
    fare_amount: number
  }
}

export default function PaymentModal({ isOpen, onClose, onSuccess, booking }: PaymentModalProps) {
  const [step, setStep] = useState<'method' | 'processing' | 'success'>('method')
  const [method, setMethod] = useState<'mtn' | 'airtel' | null>(null)
  const [phone, setPhone] = useState('')

  if (!isOpen) return null

  const handlePay = async () => {
    if (!phone || !method) {
      toast.error('Please enter phone number and select a provider')
      return
    }

    setStep('processing')
    
    try {
      const res = await fetch('/api/bookings/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          method: method.toUpperCase(),
          phone
        })
      })

      if (res.ok) {
        setStep('success')
        setTimeout(() => {
          onSuccess()
          onClose()
          // Reset for next time
          setStep('method')
          setMethod(null)
          setPhone('')
        }, 2500)
      } else {
        throw new Error('Payment failed')
      }
    } catch (err) {
      toast.error('Payment gateway error. Please try again.')
      setStep('method')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 pb-0 flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-900">Secure Payment</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 'method' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center border border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Amount Due</p>
                  <p className="text-2xl font-black text-gray-900">UGX {Number(booking.fare_amount).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-medium">Ref: {booking.booking_ref}</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700">Select Provider</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setMethod('mtn')}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'mtn' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-100 hover:border-yellow-200'}`}
                  >
                    <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center font-black text-xs">MTN</div>
                    <span className="text-xs font-bold">MTN MoMo</span>
                  </button>
                  <button 
                    onClick={() => setMethod('airtel')}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'airtel' ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-red-200'}`}
                  >
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center font-black text-white text-[10px]">airtel</div>
                    <span className="text-xs font-bold">Airtel Money</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700">Phone Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="tel" 
                    placeholder="07XX XXX XXX" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <button 
                onClick={handlePay}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-[0.98]"
              >
                Pay Now <ArrowRight size={18} />
              </button>
              
              <p className="text-[10px] text-center text-gray-400 flex items-center justify-center gap-1">
                <ShieldCheck size={12} /> Encrypted by AmbuLink Secure Pay
              </p>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-gray-100 border-t-red-600 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Smartphone className="text-gray-200" size={32} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Requesting Payment</h3>
                <p className="text-sm text-gray-500">Check your phone to enter your PIN</p>
              </div>
              <div className="pt-4 flex gap-1">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" />
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 fill-mode-both">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Payment Received!</h3>
                <p className="text-sm text-gray-500">Your trip has been marked as paid.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
