import { useState, useEffect, useCallback } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useProducts, useTransactions, useEarnings, useAdmin } from './hooks/useDatabase'
import { createWithdrawal } from './lib/paypal'
import './index.css'

// Types
interface Product {
  id: string
  name: string
  price: number
  commission_rate: number
  affiliate_link: string
  category: string
  trending: boolean
  sales_count: number
  is_active: boolean
}

interface Transaction {
  id: string
  type: 'commission' | 'withdrawal' | 'deposit'
  amount: number
  status: 'pending' | 'completed' | 'failed'
  description?: string
  created_at: string
}

// Particle component
const ViralParticle = ({ delay }: { delay: number }) => (
  <div
    className="viral-particle animate-sparkle"
    style={{
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${delay}s`
    }}
  />
)

// Product Card Component
const ProductCard = ({ product, onShare }: { product: Product; onShare: (p: Product) => void }) => (
  <div className="product-card glass glass-hover rounded-2xl p-5 cursor-pointer relative overflow-hidden">
    {product.trending && (
      <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold">
        🔥 رائج
      </div>
    )}

    <div className="flex items-start justify-between mb-4">
      <div>
        <span className="text-purple-400 text-xs bg-purple-500/20 px-2 py-1 rounded-full">
          {product.category}
        </span>
      </div>
      <span className="text-2xl">
        {product.category === 'أدوات' ? '🔐' :
          product.category === 'تصميم' ? '🎨' :
          product.category === 'أعمال' ? '💼' :
          product.category === 'تجارة' ? '🛍️' :
          product.category === 'تطوير' ? '💻' :
          product.category === 'تعليم' ? '📚' :
          product.category === 'تسويق' ? '📢' : '⚡'}
      </span>
    </div>

    <h3 className="text-white font-bold text-lg mb-2">{product.name}</h3>

    <div className="flex items-center justify-between mb-4">
      <div className="text-gray-400 text-sm">
        <span className="text-green-400 font-bold">${product.price}</span>
        <span className="mx-2">•</span>
        <span className="text-yellow-400">عمولة {product.commission_rate}%</span>
      </div>
    </div>

    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
      <span>📈 {product.sales_count.toLocaleString()} عملية بيع</span>
      <span>💵 ربحك: ${(product.price * product.commission_rate / 100).toFixed(2)}/بيع</span>
    </div>

    <button
      onClick={() => onShare(product)}
      className="btn-viral w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2"
    >
      <span>📤</span>
      <span>شارك و اربح</span>
    </button>
  </div>
)

// Stats Card Component
const StatCard = ({ icon, value, label, change, color }: { icon: string; value: string; label: string; change?: string; color: string }) => (
  <div className="stat-card rounded-2xl p-5 border border-purple-500/20">
    <div className="flex items-center justify-between mb-3">
      <span className="text-3xl">{icon}</span>
      {change && (
        <span className={`text-sm font-bold ${color}`}>{change}</span>
      )}
    </div>
    <div className="text-white text-2xl font-bold mb-1">{value}</div>
    <div className="text-gray-400 text-sm">{label}</div>
  </div>
)

// Auth Modal Component
const AuthModal = ({ isOpen, onClose, mode, setMode }: { isOpen: boolean; onClose: () => void; mode: 'login' | 'signup' | 'reset'; setMode: (m: 'login' | 'signup' | 'reset') => void }) => {
  const { signIn, signUp, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'login') {
      const result = await signIn(email, password)
      if (result.success) {
        onClose()
      } else {
        setError(result.error || 'خطأ في تسجيل الدخول')
      }
    } else if (mode === 'signup') {
      if (!fullName || !username) {
        setError('يرجى ملء جميع الحقول')
        setLoading(false)
        return
      }
      const result = await signUp(email, password, fullName, username)
      if (result.success) {
        onClose()
      } else {
        setError(result.error || 'خطأ في إنشاء الحساب')
      }
    } else {
      const result = await resetPassword(email)
      if (result.success) {
        setSuccess('تم إرسال رابط استعادة كلمة المرور')
      } else {
        setError(result.error || 'خطأ')
      }
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass rounded-3xl p-6 w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">
            {mode === 'login' ? 'تسجيل الدخول' : mode === 'signup' ? 'إنشاء حساب' : 'استعادة كلمة المرور'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode !== 'reset' && (
            <>
              {mode === 'signup' && (
                <>
                  <input
                    type="text"
                    placeholder="الاسم الكامل"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400"
                    required
                  />
                  <input
                    type="text"
                    placeholder="اسم المستخدم"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400"
                    required
                  />
                </>
              )}
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400"
                required
              />
              <input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400"
                required
              />
            </>
          )}

          {mode === 'reset' && (
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400"
              required
            />
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          {success && <p className="text-green-400 text-sm text-center">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-viral w-full py-3 rounded-xl font-bold text-white disabled:opacity-50"
          >
            {loading ? 'جاري التحميل...' : mode === 'login' ? 'دخول' : mode === 'signup' ? 'إنشاء حساب' : 'إرسال'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-400">
          {mode === 'login' ? (
            <>
              <span>نسيت كلمة المرور؟ </span>
              <button onClick={() => setMode('reset')} className="text-purple-400">استعادة</button>
              <span> | </span>
              <button onClick={() => setMode('signup')} className="text-purple-400">حساب جديد</button>
            </>
          ) : mode === 'signup' ? (
            <>
              <span>لديك حساب؟ </span>
              <button onClick={() => setMode('login')} className="text-purple-400">دخول</button>
            </>
          ) : (
            <button onClick={() => setMode('login')} className="text-purple-400">العودة لتسجيل الدخول</button>
          )}
        </div>

        <div className="mt-4 p-3 bg-blue-500/20 rounded-xl text-sm text-blue-300">
          💡 للمعاينة، أدخل أي بريد وكلمة مرور
        </div>
      </div>
    </div>
  )
}

// Admin Dashboard Component
const AdminDashboard = ({ onClose }: { onClose: () => void }) => {
  const { addProduct, updateProduct, deleteProduct } = useAdmin()
  const { products } = useProducts()
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    commission_rate: 10,
    affiliate_link: '',
    category: 'أدوات',
    trending: false,
  })
  const [loading, setLoading] = useState(false)

  const handleAddProduct = async () => {
    setLoading(true)
    const result = await addProduct({
      ...newProduct,
      is_active: true,
    })
    if (result.success) {
      alert('تم إضافة المنتج بنجاح!')
      setNewProduct({ name: '', price: 0, commission_rate: 10, affiliate_link: '', category: 'أدوات', trending: false })
    } else {
      alert(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90">
      <div className="min-h-screen p-4">
        <div className="glass rounded-2xl p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text">⚙️ لوحة التحكم</h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">✕</button>
          </div>

          {/* Add Product */}
          <div className="mb-8 p-4 bg-purple-500/10 rounded-xl">
            <h3 className="text-lg font-bold mb-4">➕ إضافة منتج جديد</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="اسم المنتج"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
              />
              <input
                type="number"
                placeholder="السعر ($)"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
              />
              <input
                type="number"
                placeholder="نسبة العمولة (%)"
                value={newProduct.commission_rate}
                onChange={(e) => setNewProduct({ ...newProduct, commission_rate: Number(e.target.value) })}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
              />
              <input
                type="text"
                placeholder="رابط الأفلييت"
                value={newProduct.affiliate_link}
                onChange={(e) => setNewProduct({ ...newProduct, affiliate_link: e.target.value })}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
              />
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
              >
                <option value="أدوات">أدوات</option>
                <option value="تصميم">تصميم</option>
                <option value="أعمال">أعمال</option>
                <option value="تجارة">تجارة</option>
                <option value="تطوير">تطوير</option>
                <option value="تعليم">تعليم</option>
                <option value="تسويق">تسويق</option>
              </select>
              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={newProduct.trending}
                  onChange={(e) => setNewProduct({ ...newProduct, trending: e.target.checked })}
                  className="w-5 h-5"
                />
                <span>رائج</span>
              </label>
            </div>
            <button
              onClick={handleAddProduct}
              disabled={loading || !newProduct.name}
              className="btn-viral w-full mt-4 py-3 rounded-xl font-bold text-white disabled:opacity-50"
            >
              {loading ? 'جاري الإضافة...' : 'إضافة المنتج'}
            </button>
          </div>

          {/* Products List */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">📦 المنتجات ({products.length})</h3>
            <div className="space-y-2">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div>
                    <p className="font-bold">{product.name}</p>
                    <p className="text-sm text-gray-400">${product.price} | {product.commission_rate}%</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm">تعديل</button>
                    <button className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm">حذف</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div className="p-4 bg-green-500/10 rounded-xl">
            <h3 className="text-lg font-bold mb-4">📊 إحصائيات سريعة</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{products.length}</p>
                <p className="text-sm text-gray-400">المنتجات</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">1,284</p>
                <p className="text-sm text-gray-400">المستخدمين</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">847</p>
                <p className="text-sm text-gray-400">المبيعات</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">$3,694</p>
                <p className="text-sm text-gray-400">الإجمالي</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Withdrawal Modal Component
const WithdrawalModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { user, updateProfile } = useAuth()
  const { stats } = useEarnings(user?.id)
  const [paypalEmail, setPaypalEmail] = useState(user?.paypal_email || '')
  const [amount, setAmount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleWithdraw = async () => {
    if (!paypalEmail || amount <= 0) {
      setError('يرجى ملء جميع الحقول')
      return
    }

    if (amount > stats.total_earnings) {
      setError('المبلغ يتجاوز الرصيد المتاح')
      return
    }

    if (amount < 5) {
      setError('الحد الأدنى للسحب هو $5')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    // Update PayPal email
    await updateProfile({ paypal_email: paypalEmail })

    // Create withdrawal
    const result = await createWithdrawal(user!.id, paypalEmail, amount)

    if (result.success) {
      setSuccess(`تم إرسال طلب السحب بنجاح! رقم المعاملة: ${result.transactionId}`)
    } else {
      setError(result.error || 'فشل في عملية السحب')
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass rounded-3xl p-6 w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">💵 سحب الأرباح</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">✕</button>
        </div>

        <div className="mb-4 p-4 bg-green-500/20 rounded-xl text-center">
          <p className="text-sm text-gray-400">الرصيد المتاح للسحب</p>
          <p className="text-3xl font-bold text-green-400">${stats.total_earnings.toFixed(2)}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">بريد PayPal</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">المبلغ ($)</label>
            <input
              type="number"
              placeholder="أدخل المبلغ"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          {success && <p className="text-green-400 text-sm text-center">{success}</p>}

          <button
            onClick={handleWithdraw}
            disabled={loading}
            className="btn-viral w-full py-3 rounded-xl font-bold text-white disabled:opacity-50"
          >
            {loading ? 'جاري المعالجة...' : 'طلب السحب'}
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          ⏱️ يستغرق السحب 1-3 أيام عمل
        </div>
      </div>
    </div>
  )
}

// Main App Component
function AppContent() {
  const { user, signOut, isAdmin } = useAuth()
  const { products } = useProducts()
  const { transactions } = useTransactions(user?.id)
  const { stats } = useEarnings(user?.id)

  const [activeTab, setActiveTab] = useState<'home' | 'products' | 'network' | 'wallet'>('home')
  const [copied, setCopied] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(!user)
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [showAdmin, setShowAdmin] = useState(false)
  const [showWithdrawal, setShowWithdrawal] = useState(false)

  // Get current domain dynamically
  const baseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'https://referralchain.com'
  const userReferralLink = user ? `${baseUrl}?ref=${user.referral_code}` : baseUrl

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(userReferralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [userReferralLink])

  const handleShareProduct = (product: Product) => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    setSelectedProduct(product)
    setShowShareModal(true)
  }

  const shareToSocial = (platform: string) => {
    const productLink = selectedProduct ? `${userReferralLink}?product=${selectedProduct.id}` : userReferralLink
    const text = selectedProduct
      ? `🚀 اكتشف ${selectedProduct.name} واربح عمولة ${selectedProduct.commission_rate}%!`
      : '🚀 انضم لـ ReferralChain واربح من تسويق المنتجات!'

    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + productLink)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(productLink)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(productLink)}&text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productLink)}`,
    }

    window.open(urls[platform] || urls.whatsapp, '_blank')
  }

  const handleSignOut = async () => {
    await signOut()
    setShowAuthModal(true)
    setAuthMode('login')
  }

  // Check URL for referral code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const refCode = params.get('ref')
    if (refCode) {
      localStorage.setItem('referral_ref_code', refCode)
    }
  }, [])

  return (
    <div className="min-h-screen text-white pb-24">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="glass sticky top-0 z-50 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse-glow">
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <h1 className="font-bold text-lg gradient-text">ReferralChain</h1>
              <p className="text-xs text-gray-400">{user ? `مرحباً ${user.full_name || user.username}` : 'شبكتك = دخلك'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button onClick={() => setShowAdmin(true)} className="p-2 glass rounded-xl">
                ⚙️
              </button>
            )}
            {user ? (
              <button onClick={handleSignOut} className="p-2 glass rounded-xl text-red-400">
                🚪
              </button>
            ) : (
              <button onClick={() => { setShowAuthModal(true); setAuthMode('login') }} className="btn-viral px-4 py-2 rounded-xl text-sm">
                دخول
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
          {[
            { id: 'home', label: 'الرئيسية', icon: '🏠' },
            { id: 'products', label: 'المنتجات', icon: '🛍️' },
            { id: 'network', label: 'شبكتك', icon: '🌐' },
            { id: 'wallet', label: 'المحفظة', icon: '💰' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'btn-viral text-white' : 'glass glass-hover text-gray-400'
              }`}
            >
              <span className="ml-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-slide-up">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard icon="💰" value={`$${stats.total_earnings.toFixed(2)}`} label="إجمالي الأرباح" change="+12.5%" color="text-green-400" />
              <StatCard icon="🛒" value="847" label="المبيعات" change="+28%" color="text-green-400" />
              <StatCard icon="🌐" value={stats.total_referrals.toString()} label="شبكتك" change="+156" color="text-green-400" />
              <StatCard icon="📊" value="15%" label="متوسط العمولة" color="text-yellow-400" />
            </div>

            {/* Referral Link */}
            <div className="glass rounded-2xl p-5">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🚀</span><span>رابط الإحالة الخاص بك</span>
              </h2>
              <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={userReferralLink}
                    readOnly
                    className="flex-1 bg-black/30 border border-purple-500/30 rounded-lg px-4 py-3 text-white text-sm"
                  />
                  <button
                    onClick={copyLink}
                    className={`px-5 py-3 rounded-lg font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-purple-600 hover:bg-purple-500'}`}
                  >
                    {copied ? '✓ تم' : 'نسخ'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">كل عملية شراء من رابطك = ربح تلقائي 💰</p>
              </div>

              {/* Share Buttons */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { name: 'واتساب', icon: '💬', color: 'bg-green-500', platform: 'whatsapp' },
                  { name: 'تويتر', icon: '🐦', color: 'bg-sky-500', platform: 'twitter' },
                  { name: 'تيليجرام', icon: '✈️', color: 'bg-blue-500', platform: 'telegram' },
                  { name: 'فيسبوك', icon: '📘', color: 'bg-blue-600', platform: 'facebook' },
                ].map(platform => (
                  <button
                    key={platform.platform}
                    onClick={() => shareToSocial(platform.platform)}
                    className={`${platform.color} py-3 rounded-xl flex flex-col items-center gap-1 transition-transform hover:scale-105`}
                  >
                    <span className="text-xl">{platform.icon}</span>
                    <span className="text-xs font-bold">{platform.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Products */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>🔥</span><span>المنتجات الأكثر طلباً</span>
                </h2>
                <button onClick={() => setActiveTab('products')} className="text-purple-400 text-sm font-bold">عرض الكل ←</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {products.filter(p => p.trending).slice(0, 4).map(product => (
                  <ProductCard key={product.id} product={product} onShare={handleShareProduct} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-slide-up">
            <div className="glass rounded-2xl p-5">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <span>🛍️</span><span>المنتجات الأعلى مبيعاً</span>
              </h2>
              <p className="text-gray-400 mb-6">شارك أي منتج واربح عمولة من كل عملية بيع</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(product => (
                <ProductCard key={product.id} product={product} onShare={handleShareProduct} />
              ))}
            </div>
          </div>
        )}

        {/* Network Tab */}
        {activeTab === 'network' && (
          <div className="space-y-6 animate-slide-up">
            <div className="grid grid-cols-3 gap-4">
              <div className="stat-card rounded-2xl p-4 text-center border border-purple-500/20">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-white text-2xl font-bold">{stats.total_referrals.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">إجمالي الإحالات</div>
              </div>
              <div className="stat-card rounded-2xl p-4 text-center border border-green-500/20">
                <div className="text-3xl mb-2">🛒</div>
                <div className="text-green-400 text-2xl font-bold">{stats.active_referrals}</div>
                <div className="text-gray-400 text-sm">المبيعات</div>
              </div>
              <div className="stat-card rounded-2xl p-4 text-center border border-yellow-500/20">
                <div className="text-3xl mb-2">⏳</div>
                <div className="text-yellow-400 text-2xl font-bold">{stats.pending_earnings.toFixed(0)}</div>
                <div className="text-gray-400 text-sm">معلق</div>
              </div>
            </div>

            {/* Network Visualization */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>🌐</span><span>شبكتك التسويقية</span>
              </h3>
              <div className="relative h-64 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/20 to-pink-900/20">
                <div className="network-node absolute w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center z-10 animate-pulse-glow">
                  <span className="text-2xl">👤</span>
                </div>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="absolute w-8 h-8 rounded-full bg-purple-600/60 border-2 border-purple-400 animate-network" style={{
                    top: `${20 + Math.sin(i) * 30}%`,
                    right: `${10 + i * 10}%`,
                    animationDelay: `${i * 0.2}s`
                  }}>
                    <span className="text-xs">🌟</span>
                  </div>
                ))}
                {[...Array(15)].map((_, i) => (
                  <div key={i} className="absolute w-5 h-5 rounded-full bg-pink-600/40" style={{
                    top: `${10 + i * 6}%`,
                    right: `${25 + (i % 5) * 12}%`,
                  }}>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" /><span className="text-gray-400">أنت</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-600/60 border border-purple-400" /><span className="text-gray-400">المستوى 1</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-pink-600/40" /><span className="text-gray-400">المستوى 2+</span></div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>📊</span><span>آخر النشاطات</span>
              </h3>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((txn, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        {txn.type === 'commission' ? '💰' : '💸'}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{txn.description || txn.type}</p>
                        <p className="text-xs text-gray-400">{new Date(txn.created_at).toLocaleDateString('ar')}</p>
                      </div>
                    </div>
                    <p className={`font-bold text-sm ${txn.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {txn.amount > 0 ? '+' : ''}{txn.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="space-y-6 animate-slide-up">
            <div className="glass rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-600/10 to-pink-600/10" />
              <div className="relative z-10">
                <p className="text-gray-400 mb-2">الرصيد المتاح</p>
                <div className="text-5xl font-bold gradient-text mb-4">
                  ${stats.total_earnings.toFixed(2)}
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setShowWithdrawal(true)} className="btn-viral flex-1 py-4 rounded-xl font-bold text-white">
                    💵 سحب
                  </button>
                  <button className="glass glass-hover flex-1 py-4 rounded-xl font-bold">
                    🔄 تحويل
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-green-400 font-bold">${stats.paid_earnings.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">تم السحب</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-yellow-400 font-bold">${stats.pending_earnings.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">معلق</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-purple-400 font-bold">${stats.total_earnings.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">إجمالي</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>💳</span><span>طرق الدفع</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🅿️</span>
                    <p className="font-bold">PayPal</p>
                  </div>
                  <span className="bg-green-500/20 text-green-400 text-sm px-3 py-1 rounded-full">
                    {user?.paypal_email || 'غير مضاف'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏦</span>
                    <p className="font-bold">تحويل بنكي</p>
                  </div>
                  <span className="bg-blue-500/20 text-blue-400 text-sm px-3 py-1 rounded-full">قريباً</span>
                </div>
              </div>
            </div>

            {/* Earnings History */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>📜</span><span>سجل الأرباح</span>
              </h3>
              <div className="space-y-3">
                {transactions.map((txn, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        📅
                      </div>
                      <div>
                        <p className="font-bold">{txn.description || txn.type}</p>
                        <p className="text-xs text-gray-400">{new Date(txn.created_at).toLocaleDateString('ar')}</p>
                      </div>
                    </div>
                    <p className="text-green-400 font-bold text-lg">{txn.amount > 0 ? '+' : ''}{txn.amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Share Modal */}
      {showShareModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass rounded-3xl p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">شارك و اربح</h3>
              <button onClick={() => setShowShareModal(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">✕</button>
            </div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl mb-4">📦</div>
              <h4 className="font-bold text-lg">{selectedProduct.name}</h4>
              <p className="text-gray-400">عمولتك: <span className="text-green-400 font-bold">${(selectedProduct.price * selectedProduct.commission_rate / 100).toFixed(2)}</span></p>
            </div>
            <div className="bg-black/30 rounded-xl p-3 mb-4">
              <p className="text-xs text-gray-400 mb-2">رابط الإحالة</p>
              <div className="flex items-center gap-2">
                <input type="text" value={`${userReferralLink}?product=${selectedProduct.id}`} readOnly className="flex-1 bg-transparent text-sm text-white" />
                <button onClick={copyLink} className="text-purple-400 font-bold">{copied ? '✓' : 'نسخ'}</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => shareToSocial('whatsapp')} className="bg-green-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                <span>💬</span>واتساب
              </button>
              <button onClick={() => shareToSocial('telegram')} className="bg-blue-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                <span>✈️</span>تيليجرام
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-around py-4">
          {[
            { id: 'home', icon: '🏠', label: 'الرئيسية' },
            { id: 'products', icon: '🛍️', label: 'المنتجات' },
            { id: 'network', icon: '🌐', label: 'شبكتي' },
            { id: 'wallet', icon: '💰', label: 'المحفظة' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-purple-400' : 'text-gray-500'}`}
            >
              <span className="text-2xl">{tab.icon}</span>
              <span className="text-xs font-bold">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        setMode={setAuthMode}
      />

      {/* Admin Dashboard */}
      {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}

      {/* Withdrawal Modal */}
      <WithdrawalModal isOpen={showWithdrawal} onClose={() => setShowWithdrawal(false)} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
