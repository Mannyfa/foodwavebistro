import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Star, Clock, MessageCircle, X, Plus, Minus, 
  CreditCard, Loader2, ArrowLeft, CheckCircle2, MapPin, Phone,
  Sun, Moon, Info, ShieldCheck, Zap, User, LogOut, Menu
} from 'lucide-react';
import emailjs from '@emailjs/browser'; // --- NEW: EmailJS Import ---

import ownerImage from './assets/images/ownerimg.jpeg';
import logoImage from './assets/logo.png'; 
import AdminDashboard from './AdminDashboard';
import SlideToOrder from './components/SlideToOrder';

const MENU_CATEGORIES = ['All', 'Rice Meals', 'Pasta', 'Grills', 'Small Chops', 'Drinks'];

// --- THEME ENGINE ---
const getTheme = (isDark) => ({
  bg: isDark ? 'bg-[#0a0a0a]' : 'bg-[#f2f0eb]', 
  text: isDark ? 'text-brand-cream' : 'text-[#111111]',
  heading: isDark ? 'text-white' : 'text-black',
  textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
  textMutedLight: isDark ? 'text-gray-500' : 'text-gray-400',
  border: isDark ? 'border-white/20' : 'border-black/20',
  borderSubtle: isDark ? 'border-white/10' : 'border-black/10',
  cardBg: isDark ? 'bg-white/5' : 'bg-black/5',
  navBg: isDark ? 'bg-[#0a0a0a]/90' : 'bg-[#f2f0eb]/90',
  modalBg: isDark ? 'bg-[#0a0a0a]' : 'bg-[#f2f0eb]',
  overlay: isDark ? 'bg-black/90' : 'bg-[#f2f0eb]/90',
  invertOnLight: isDark ? '' : 'invert'
});

// --- ANIMATION VARIANTS ---
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function FilmGrain() {
  return (
    <div 
      className="fixed inset-0 z-50 pointer-events-none opacity-[0.03] mix-blend-overlay"
      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
    />
  );
}

function Preloader({ onComplete, theme }) {
  const boxPath = "M20 40 L80 40 L80 60 L20 60 Z";
  const wavePath = "M10 20 L35 80 L50 40 L65 80 L90 20 Z";

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => {
      document.body.style.overflow = 'auto';
      onComplete();
    }, 2800);
    return () => { clearTimeout(timer); document.body.style.overflow = 'auto'; };
  }, [onComplete]);

  return (
    <motion.div
      exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.8, ease: [0.85, 0, 0.15, 1] } }}
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center ${theme.bg} ${theme.text}`}
    >
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="flex flex-col items-center">
        <svg width="120" height="120" viewBox="0 0 100 100" className="mb-6">
          <motion.path fill="none" stroke="#ea580c" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" animate={{ d: [boxPath, wavePath, boxPath] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
        </svg>
        <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="text-[10px] font-mono tracking-[0.4em] uppercase text-brand-gold">
          Preparing Experience
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

// --- PUBLIC STOREFRONT COMPONENT ---
function Storefront({ isDark, setIsDark }) {
  const theme = getTheme(isDark);
  const [isPreloading, setIsPreloading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredMenuId, setHoveredMenuId] = useState(null); 
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false); 
  const [activeMeal, setActiveMeal] = useState(null); 
  const [cartAddOns, setCartAddOns] = useState([]); 
  const [scrolled, setScrolled] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // AUTHENTICATION STATES
  const [loggedInCustomer, setLoggedInCustomer] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 
  const [authData, setAuthData] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // ORDER HISTORY STATES
  const [myOrders, setMyOrders] = useState([]);
  const [isLoadingMyOrders, setIsLoadingMyOrders] = useState(false);

  // CHECKOUT STATES
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [finalTotal, setFinalTotal] = useState(0);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '', notes: '' }); // --- UPDATED: Added email ---

  // CHECK SESSION ON MOUNT
  useEffect(() => {
    const storedCustomer = localStorage.getItem('customerData');
    if (storedCustomer) {
      const data = JSON.parse(storedCustomer);
      setLoggedInCustomer(data);
      // --- UPDATED: Prefill email ---
      setCustomer({ name: data.name, email: data.email || '', phone: data.phone || '', address: data.address || '', notes: '' });
    }
  }, []);

  // FETCH MENU
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/menu`);
        const data = await response.json();
        if (data.success) {
          const formattedMenu = data.data.map(item => ({ ...item, id: item._id }));
          setMenuItems(formattedMenu);
        }
      } catch (error) { console.error("Failed to fetch menu:", error); } 
      finally { setIsLoading(false); }
    };
    fetchMenu();
  }, []);

  // CENTRALIZED ORDER HISTORY FETCH
  const fetchMyOrders = async () => {
    if (!loggedInCustomer) return;
    setIsLoadingMyOrders(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/orders/history/${loggedInCustomer.email}`);
      const data = await res.json();
      if (data.success) {
        setMyOrders(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch order history:", error);
    } finally {
      setIsLoadingMyOrders(false);
    }
  };

  // Fetch immediately when logged in
  useEffect(() => {
    fetchMyOrders();
  }, [loggedInCustomer]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // AUTHENTICATION LOGIC
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    const endpoint = authMode === 'login' ? '/api/v1/auth/customer/login' : '/api/v1/auth/customer/register';

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData)
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('customerToken', data.token);
        localStorage.setItem('customerData', JSON.stringify(data.customer));
        setLoggedInCustomer(data.customer);
        setCustomer({ name: data.customer.name, email: data.customer.email || '', phone: data.customer.phone || '', address: data.customer.address || '', notes: '' });
        setAuthData({ name: '', email: '', password: '', phone: '', address: '' });
      } else {
        alert(data.message || 'Authentication failed');
      }
    } catch (error) {
      alert('Network error connecting to backend.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCustomerLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerData');
    setLoggedInCustomer(null);
    setMyOrders([]);
    setCustomer({ name: '', email: '', phone: '', address: '', notes: '' });
    setIsAuthOpen(false);
  };

  const handleOpenCustomization = (item) => {
    if (!item.addOns || item.addOns.length === 0) {
      addToCart(item, []);
    } else {
      setActiveMeal(item);
      setCartAddOns([]);
    }
  };

  const addToCart = (item, selectedAddOns = []) => {
    const addOnsPrice = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
    const hasDiscount = item.discountPercentage > 0;
    const basePrice = hasDiscount ? item.price - (item.price * (item.discountPercentage / 100)) : item.price;
    const finalPrice = basePrice + addOnsPrice;
    
    const addOnsString = selectedAddOns.map(a => a.name).sort().join(',');
    const cartItemId = `${item.id}-${addOnsString}`;

    setCart(prev => {
      const existing = prev.find(i => i.cartItemId === cartItemId);
      if (existing) return prev.map(i => i.cartItemId === cartItemId ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, cartItemId, price: finalPrice, basePrice, selectedAddOns, qty: 1 }];
    });

    setActiveMeal(null);
    setCartAddOns([]);
    setIsCartOpen(true);
  };

  const updateQty = (cartItemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const deliveryFee = 1500;
  const grandTotal = cartTotal + deliveryFee;

  const filteredMenu = activeCategory === 'All' ? menuItems : menuItems.filter(item => item.category === activeCategory);
  const hoveredItem = menuItems.find(item => item.id === hoveredMenuId) || (filteredMenu.length > 0 ? filteredMenu[0] : null);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFinalTotal(grandTotal);

    const itemsWithAddOns = cart.filter(i => i.selectedAddOns && i.selectedAddOns.length > 0);
    let addOnsSummary = '';
    if (itemsWithAddOns.length > 0) {
      addOnsSummary = itemsWithAddOns.map(i => `${i.name} (+${i.selectedAddOns.map(a => a.name).join(', ')})`).join(' | ');
    }
    const finalNotes = customer.notes 
      ? `${customer.notes} ${addOnsSummary ? `|| Add-ons: ${addOnsSummary}` : ''}`
      : (addOnsSummary ? `Add-ons: ${addOnsSummary}` : '');

    // Payload ensures email is passed
    const orderPayload = {
      customer: { ...customer, email: customer.email || loggedInCustomer?.email || '', notes: finalNotes },
      items: cart.map(item => ({ 
        menuItem: item.id, 
        quantity: item.qty, 
        priceAtOrder: item.price,
        addOns: item.selectedAddOns 
      })),
      pricing: { subtotal: cartTotal, deliveryFee: deliveryFee, total: grandTotal },
      payment: { method: 'Transfer', status: 'Pending' }
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await response.json();

      if (data.success) {
        setOrderSuccess(true);
        setCart([]);
        
        // Auto-refresh history so their new order shows up immediately
        if (loggedInCustomer) fetchMyOrders();

        // --- NEW: SEND EMAIL TO ADMIN ---
        try {
          await emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_ADMIN_TEMPLATE_ID,
            {
              customer_name: customer.name,
              customer_phone: customer.phone,
              order_total: grandTotal.toLocaleString(),
              order_notes: finalNotes || 'No notes provided'
            },
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY
          );
        } catch (mailErr) {
          console.error("Admin notification email failed to send", mailErr);
        }
        // --------------------------------

        setTimeout(() => {
          setIsCheckoutOpen(false);
          setOrderSuccess(false);
          if (!loggedInCustomer) {
            setCustomer({ name: '', email: '', phone: '', address: '', notes: '' });
          } else {
             setCustomer({ ...customer, notes: '' });
          }
        }, 15000);
      } else alert('Something went wrong. Please try again.');
    } catch (error) { alert('Network error. Please ensure your backend is running.'); } 
    finally { setIsSubmitting(false); }
  };

  return (
    <>
      <FilmGrain />
      <AnimatePresence>
        {isPreloading && <Preloader onComplete={() => setIsPreloading(false)} theme={theme} />}
      </AnimatePresence>

      <div className={`min-h-screen w-full ${theme.bg} ${theme.text} font-sans selection:bg-brand-orange selection:text-white transition-colors duration-500`}>
        
        {/* --- EDITORIAL NAVIGATION --- */}
        <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? `${theme.navBg} backdrop-blur-xl border-b ${theme.borderSubtle} py-4` : 'bg-transparent py-8'}`}>
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <Link to="/" className={`text-lg md:text-2xl font-black tracking-tighter uppercase ${theme.heading}`}>
              Food Wave <span className="text-brand-orange font-normal italic">Bistro.</span>
            </Link>

            {/* DESKTOP NAV */}
            <div className={`hidden md:flex items-center gap-8 text-xs font-bold tracking-[0.2em] uppercase ${theme.textMuted}`}>
              <button onClick={() => setIsDark(!isDark)} className={`hover:${theme.heading} transition-colors`}>
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              <a href="#menu" className={`hover:${theme.heading} transition-colors`}>MENU</a>
              
              {loggedInCustomer && (
                <button onClick={() => setIsAuthOpen(true)} className={`hover:${theme.heading} transition-colors`}>
                  ORDERS
                </button>
              )}
              
              <button onClick={() => setIsAuthOpen(true)} className={`${theme.heading} hover:text-brand-orange transition-colors flex items-center gap-2`}>
                <User className="w-4 h-4" />
                <span>{loggedInCustomer ? loggedInCustomer.name.split(' ')[0] : 'SIGN IN'}</span>
              </button>

              <button onClick={() => setIsCartOpen(true)} className={`${theme.heading} hover:text-brand-orange transition-colors`}>
                [ BAG : {cart.reduce((acc, item) => acc + item.qty, 0)} ]
              </button>
            </div>

            {/* MOBILE NAV */}
            <div className={`flex md:hidden items-center gap-4 text-[10px] font-bold tracking-[0.2em] uppercase ${theme.textMuted}`}>
              <button onClick={() => setIsDark(!isDark)} className={`hover:${theme.heading} transition-colors`}>
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              <button onClick={() => setIsCartOpen(true)} className={`${theme.heading} hover:text-brand-orange transition-colors`}>
                [ BAG: {cart.reduce((acc, item) => acc + item.qty, 0)} ]
              </button>
              
              <button onClick={() => setIsMobileNavOpen(true)} className={`${theme.heading} hover:text-brand-orange transition-colors ml-1 p-1`}>
                <Menu className="w-6 h-6" />
              </button>
            </div>

          </div>
        </nav>

        {/* --- MOBILE NAVIGATION DRAWER --- */}
        <AnimatePresence>
          {isMobileNavOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileNavOpen(false)} className={`fixed inset-0 ${theme.overlay} backdrop-blur-md z-[100] md:hidden`} />
              <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className={`fixed top-0 left-0 h-full w-[280px] ${theme.modalBg} border-r ${theme.borderSubtle} z-[100] flex flex-col shadow-2xl md:hidden`}>
                <div className={`p-8 border-b ${theme.borderSubtle} flex justify-between items-center`}>
                  <h2 className={`text-xl font-black uppercase tracking-tighter ${theme.heading}`}>Menu</h2>
                  <button onClick={() => setIsMobileNavOpen(false)} className={`${theme.textMuted} hover:${theme.heading} transition-colors`}><X className="w-6 h-6" /></button>
                </div>
                <div className="flex flex-col p-8 space-y-8 text-sm font-bold tracking-widest uppercase">
                  <a href="#menu" onClick={() => setIsMobileNavOpen(false)} className={`${theme.textMuted} hover:${theme.heading} transition-colors`}>Menu</a>
                  <a href="#info" onClick={() => setIsMobileNavOpen(false)} className={`${theme.textMuted} hover:${theme.heading} transition-colors`}>Info</a>
                  
                  {loggedInCustomer && (
                    <button onClick={() => {setIsMobileNavOpen(false); setIsAuthOpen(true);}} className={`text-left ${theme.textMuted} hover:${theme.heading} transition-colors`}>
                      Orders
                    </button>
                  )}
                  
                  <button onClick={() => {setIsMobileNavOpen(false); setIsAuthOpen(true);}} className={`text-left flex items-center gap-3 ${theme.textMuted} hover:${theme.heading} transition-colors`}>
                    <User className="w-4 h-4" /> {loggedInCustomer ? 'Profile' : 'Sign In'}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* --- HERO SECTION --- */}
        <section className={`relative min-h-[90vh] flex items-center justify-center overflow-hidden border-b ${theme.borderSubtle} pt-24 pb-12`}>
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-orange/10 rounded-full blur-[150px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 w-full relative z-10 flex flex-row items-center justify-between gap-6 md:gap-16 h-full">
            <div className="w-1/2 h-[45vh] md:h-[700px] relative rounded-[1rem] md:rounded-[2rem] overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-brand-orange/20 mix-blend-overlay z-10" />
              <img src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=1000&auto=format&fit=crop" alt="Premium Dish" className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-700" />
            </div>

            <div className="w-1/2 flex flex-col items-end text-right">
              <motion.p initial="hidden" animate="show" variants={fadeUp} className="font-mono text-[8px] md:text-xs text-brand-orange tracking-widest uppercase mb-4 md:mb-8">[ Now delivering in Abuja ]</motion.p>
              <motion.h1 initial="hidden" animate="show" variants={fadeUp} className={`text-2xl sm:text-5xl md:text-7xl lg:text-[7rem] font-black leading-[1] tracking-tighter mb-4 md:mb-8 uppercase ${theme.heading}`}>
                Premium <br/>Comfort <br/><span className="text-transparent bg-clip-text bg-gradient-to-l from-brand-orange to-brand-gold italic font-medium pr-1 md:pr-4">Delivered.</span>
              </motion.h1>
              <motion.p initial="hidden" animate="show" variants={fadeUp} className={`text-[10px] md:text-xl ${theme.textMuted} mb-8 md:mb-12 font-light max-w-sm`}>
                Elevating the cloud kitchen experience.
              </motion.p>
              <motion.div initial="hidden" animate="show" variants={fadeUp}>
                <button onClick={() => document.getElementById('menu').scrollIntoView()} className={`text-[8px] md:text-sm font-bold tracking-[0.2em] uppercase border-b border-brand-orange text-brand-orange hover:${theme.heading} transition-colors pb-1 md:pb-2`}>
                  Explore Collection
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- WELCOME SECTION --- */}
        <section className={`py-12 md:py-32 relative border-b ${theme.borderSubtle}`}>
          <div className="max-w-7xl mx-auto px-6 w-full flex flex-row items-center justify-between gap-6 md:gap-16">
            
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="w-1/2 relative h-[35vh] md:h-[600px] rounded-[1rem] md:rounded-[2rem] overflow-hidden shadow-2xl">
              <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop" alt="Detailed Food Illustration" className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            </motion.div>

            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer} className="w-1/2 flex flex-col items-start text-left">
              <motion.h2 variants={fadeUp} className={`text-xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 md:mb-8 ${theme.heading}`}>Welcome to Food Wave Bistro</motion.h2>
              <motion.div variants={fadeUp} className={`space-y-2 md:space-y-6 ${theme.textMuted} font-light leading-relaxed text-[8px] sm:text-[10px] md:text-lg max-w-lg`}>
                <p>Welcome to Food wave Bistro where great food, quality service, and unforgettable taste come together.</p>
                <p>We are passionate about serving freshly prepared meals made with quality ingredients, rich flavors, and the perfect touch of satisfaction. Whether you’re craving something delicious for yourself, your family, your workplace, or special occasions, we are here to give you a seamless and enjoyable food experience.</p>
                <p>At Food Wave Bistro we believe food should not only taste good but also create comfort, happiness, and memorable moments. Our goal is to provide our customers with tasty meals, excellent service, and a smooth ordering process from start to finish.</p>
              </motion.div>
              
              <div className={`flex flex-col gap-4 md:gap-8 mt-6 md:mt-10 pt-6 md:pt-10 border-t ${theme.borderSubtle} w-full`}>
                <motion.div variants={fadeUp}>
                  <h4 className="font-mono text-[8px] md:text-[10px] tracking-widest uppercase text-brand-orange mb-1 md:mb-2">Our Mission</h4>
                  <p className={`text-[8px] sm:text-[10px] md:text-sm ${theme.textMutedLight} font-light max-w-sm`}>To provide tasty, quality meals and exceptional service that leave our customers happy and satisfied.</p>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <h4 className="font-mono text-[8px] md:text-[10px] tracking-widest uppercase text-brand-orange mb-1 md:mb-2">Our Vision</h4>
                  <p className={`text-[8px] sm:text-[10px] md:text-sm ${theme.textMutedLight} font-light max-w-sm`}>To become a trusted food brand known for quality, creativity, and outstanding customer experience.</p>
                </motion.div>
              </div>

              <motion.p variants={fadeUp} className={`mt-6 md:mt-10 text-[8px] sm:text-[10px] md:text-sm italic ${theme.textMuted} border-l-2 border-brand-orange pl-3 md:pl-4`}>
                Order easily through our website and enjoy fast, reliable, and stress-free delivery right to your doorstep. Thank you for choosing us we look forward to serving you.
              </motion.p>
            </motion.div>

          </div>
        </section>

        {/* --- LOOKBOOK MENU SECTION --- */}
        <section id="menu" className="py-20 md:py-32 relative">
          <div className="max-w-7xl mx-auto px-6">
            
            <div className={`flex flex-row justify-between items-end mb-12 md:mb-16 gap-6 border-b ${theme.borderSubtle} pb-6 md:pb-8`}>
              <div className="flex flex-row overflow-x-auto w-1/2 hide-scrollbar gap-4 font-mono text-[8px] md:text-xs uppercase tracking-widest items-end">
                {MENU_CATEGORIES.map(category => (
                  <button key={category} onClick={() => setActiveCategory(category)} className={`whitespace-nowrap transition-colors pb-1 border-b-2 text-center ${activeCategory === category ? 'border-brand-orange text-brand-orange' : `border-transparent ${theme.textMuted} hover:${theme.heading}`}`}>
                    {category}
                  </button>
                ))}
              </div>
              <h2 className={`text-2xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter text-right w-1/2 ${theme.heading}`}>The Menu</h2>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center py-32"><Loader2 className="w-8 h-8 md:w-12 md:h-12 animate-spin text-brand-orange mb-4" /><p className={`font-mono text-[10px] md:text-xs ${theme.textMuted} uppercase tracking-widest`}>Loading Collection</p></div>
            ) : menuItems.length === 0 ? (
              <div className={`py-32 text-center font-mono text-[10px] md:text-xs ${theme.textMuted} uppercase tracking-widest`}>No items available.</div>
            ) : (
              <div className="flex flex-row gap-6 md:gap-16 relative min-h-[80vh]">
                
                {/* LEFT: Sticky Image Reveal */}
                <div className="w-1/2 relative">
                  <div className={`sticky top-24 md:top-32 w-full h-[40vh] md:h-[700px] rounded-[1rem] md:rounded-[2rem] overflow-hidden ${theme.cardBg} ${theme.borderSubtle} shadow-2xl`}>
                    <AnimatePresence mode="wait">
                      {hoveredItem && (
                        <motion.img
                          key={hoveredItem.id}
                          src={hoveredItem.image?.url || hoveredItem.image}
                          initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                    </AnimatePresence>
                    <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-black/80' : 'from-white/40'} via-transparent to-transparent pointer-events-none`} />
                  </div>
                </div>

                {/* RIGHT: Typography Menu List */}
                <div className="w-1/2 flex flex-col items-end text-right">
                  {filteredMenu.map((item) => {
                    const hasDiscount = item.discountPercentage > 0;
                    const discountedPrice = hasDiscount 
                      ? item.price - (item.price * (item.discountPercentage / 100)) 
                      : item.price;

                    return (
                      <motion.div 
                        key={item.id} 
                        onMouseEnter={() => setHoveredMenuId(item.id)}
                        onViewportEnter={() => setHoveredMenuId(item.id)}
                        viewport={{ amount: 0.5, margin: "-10% 0px -10% 0px" }}
                        className={`w-full flex flex-col items-end justify-center py-8 md:py-12 border-b ${theme.borderSubtle} hover:${theme.border} transition-colors group`}
                      >
                        <h3 className={`text-lg sm:text-3xl md:text-5xl font-black uppercase tracking-tighter group-hover:text-brand-orange transition-colors duration-300 ${theme.heading}`}>
                          {item.name}
                        </h3>
                        <p className={`${theme.textMuted} text-[9px] md:text-sm mt-2 md:mt-3 font-light leading-relaxed max-w-[250px] md:max-w-sm`}>{item.description}</p>
                        
                        <div className={`flex items-center gap-2 md:gap-4 mt-3 md:mt-4 font-mono text-[8px] md:text-[10px] ${theme.textMutedLight} uppercase tracking-widest`}>
                          <span className="flex items-center gap-1"><Star className="w-2 h-2 md:w-3 md:h-3 text-brand-gold" /> {item.rating || '5.0'}</span>
                          <span>|</span>
                          <span className="flex items-center gap-1"><Clock className="w-2 h-2 md:w-3 md:h-3" /> {item.preparationTime} min</span>
                        </div>
                        
                        <div className="mt-4 md:mt-8 flex flex-col items-end gap-3 md:gap-4">
                          {hasDiscount ? (
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-2">
                                <span className={`text-base md:text-2xl font-bold text-brand-orange`}>
                                  ₦{discountedPrice.toLocaleString()}
                                </span>
                                <span className="text-[10px] font-bold bg-brand-orange/10 text-brand-orange px-1.5 py-0.5 rounded">
                                  -{item.discountPercentage}%
                                </span>
                              </div>
                              <span className={`text-[10px] md:text-xs font-medium ${theme.textMutedLight} line-through mt-1`}>
                                ₦{item.price.toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span className={`text-base md:text-2xl font-light ${theme.text}`}>
                              ₦{item.price.toLocaleString()}
                            </span>
                          )}

                          <button 
                            onClick={() => handleOpenCustomization(item)} 
                            className={`text-[8px] md:text-[10px] font-bold tracking-widest uppercase border ${theme.border} hover:border-brand-orange hover:bg-brand-orange hover:text-white px-4 py-2 md:px-6 md:py-3 rounded-full transition-all ${theme.text}`}
                          >
                            + Add to Bag
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

              </div>
            )}
          </div>
        </section>

        {/* --- HOW IT WORKS --- */}
        <section className={`py-16 md:py-32 relative border-b ${theme.borderSubtle} ${theme.cardBg}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className={`text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 ${theme.heading}`}>The Process</h2>
              <p className={`${theme.textMuted} font-light text-sm md:text-lg`}>Zero friction from kitchen to doorstep.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center relative">
              <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-[1px] bg-brand-orange/30 -z-10" />
              {[
                { icon: <Info />, title: '1. Explore', desc: 'Browse our curated collection of premium cloud-kitchen meals.' },
                { icon: <ShieldCheck />, title: '2. Customize', desc: 'Add extra proteins, sides, and notes to make the order yours.' },
                { icon: <Zap />, title: '3. Experience', desc: 'Relax. Our swift delivery network handles the rest.' }
              ].map((step, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.2 }} className={`${theme.bg} border ${theme.borderSubtle} p-8 rounded-2xl shadow-xl flex flex-col items-center`}>
                  <div className="w-16 h-16 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center mb-6">{React.cloneElement(step.icon, { className: 'w-8 h-8' })}</div>
                  <h3 className={`text-xl font-bold uppercase tracking-tight mb-3 ${theme.heading}`}>{step.title}</h3>
                  <p className={`${theme.textMuted} text-sm font-light`}>{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- ESSENTIAL INFO --- */}
        <section id="info" className={`py-16 md:py-32 relative border-b ${theme.borderSubtle}`}>
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-12 md:gap-20">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="w-full md:w-1/2">
              <h2 className={`text-3xl md:text-5xl font-black uppercase tracking-tighter mb-8 md:mb-12 ${theme.heading}`}>Operating Hours</h2>
              <div className={`p-8 rounded-2xl ${theme.cardBg} border ${theme.borderSubtle} space-y-6`}>
                <div className="flex justify-between items-center border-b border-brand-orange/20 pb-4">
                  <span className={`font-bold ${theme.heading}`}>Monday – Saturday</span>
                  <span className="text-brand-orange font-mono">8:00 AM – 9:00 PM</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className={`font-bold ${theme.heading}`}>Sunday</span>
                  <span className="text-brand-orange font-mono">11:00 AM – 8:00 PM</span>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="w-full md:w-1/2">
              <h2 className={`text-3xl md:text-5xl font-black uppercase tracking-tighter mb-8 md:mb-12 ${theme.heading}`}>Delivery Logistics</h2>
              <div className={`p-8 rounded-2xl ${theme.cardBg} border ${theme.borderSubtle} space-y-8`}>
                <div>
                  <h4 className="font-mono text-[10px] tracking-widest uppercase text-brand-orange mb-3">Fee Structure</h4>
                  <p className={`${theme.textMuted} text-sm font-light`}>Standard Base Delivery: <span className={`${theme.heading} font-bold`}>₦1,500</span></p>
                  <p className="text-[10px] text-gray-500 mt-1 italic">*Fees may vary slightly depending on exact distance from our hub.</p>
                </div>
                <div className="space-y-4">
                  <h4 className="font-mono text-[10px] tracking-widest uppercase text-brand-orange mb-3">Time Estimates</h4>
                  <div className={`flex justify-between text-sm ${theme.textMuted}`}><span className="font-medium">Standard Delivery</span><span>30–60 mins</span></div>
                  <div className={`flex justify-between text-sm ${theme.textMuted}`}><span className="font-medium">Peak Hours/Weekends</span><span>45–90 mins</span></div>
                  <div className={`flex justify-between text-sm ${theme.textMuted}`}><span className="font-medium">Large/Custom Orders</span><span>1–3 hours</span></div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- FAQ SECTION --- */}
        <section className={`py-16 md:py-32 relative border-b ${theme.borderSubtle}`}>
          <div className="max-w-4xl mx-auto px-6">
            <h2 className={`text-3xl md:text-5xl font-black uppercase tracking-tighter mb-12 text-center ${theme.heading}`}>Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: "Do you offer dine-in services?", a: "Currently, Food Wave Bistro operates as a premium cloud kitchen focused entirely on bringing high-quality meals directly to your doorstep with zero friction." },
                { q: "Can I customize my meals?", a: "Absolutely. When you click 'Add to Bag', our customization modal allows you to add extra proteins, sides, and specific notes for the kitchen." },
                { q: "Do you cater for large events?", a: "Yes, we handle large and custom orders. Please place your order well in advance (1-3 hours minimum depending on quantity) or contact our WhatsApp support for event bookings." }
              ].map((faq, idx) => (
                <div key={idx} className={`p-6 md:p-8 rounded-2xl ${theme.cardBg} border ${theme.borderSubtle}`}>
                  <h3 className={`text-lg md:text-xl font-bold mb-3 ${theme.heading}`}>{faq.q}</h3>
                  <p className={`${theme.textMuted} font-light text-sm md:text-base leading-relaxed`}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- THE VISIONARY (Owner Image) --- */}
        <section className={`py-16 md:py-32 relative border-b ${theme.borderSubtle} ${theme.bg}`}>
          <div className="max-w-7xl mx-auto px-6 flex flex-row gap-6 md:gap-20 items-center">
            <motion.div initial={{ clipPath: 'inset(100% 0 0 0)' }} whileInView={{ clipPath: 'inset(0% 0 0 0)' }} viewport={{ once: true }} transition={{ duration: 1.2, ease: [0.85, 0, 0.15, 1] }} className="w-1/2 relative h-[30vh] md:h-[600px] rounded-[1rem] md:rounded-[2rem] overflow-hidden shadow-2xl">
              <img src={ownerImage} alt="Owner of Food Wave Bistro" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
              <div className="absolute inset-0 bg-brand-orange/20 mix-blend-overlay" />
            </motion.div>
            <div className="w-1/2 flex flex-col items-end text-right">
              <h2 className={`text-2xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 md:mb-10 ${theme.heading}`}>The Visionary</h2>
              <p className={`font-mono text-[8px] md:text-xs text-brand-orange tracking-widest uppercase mb-4`}>Founder & Head Chef</p>
              <p className={`${theme.textMuted} font-light leading-relaxed text-[10px] md:text-lg max-w-sm`}>Crafting the perfect balance of local flavor and modern culinary technique. Every dish that leaves our kitchen is a testament to quality, cleanliness, and consistency.</p>
            </div>
          </div>
        </section>

        {/* --- AUTHENTICATION & PROFILE DRAWER --- */}
        <AnimatePresence>
          {isAuthOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAuthOpen(false)} className={`fixed inset-0 ${theme.overlay} backdrop-blur-md z-[100]`} />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className={`fixed top-0 right-0 h-full w-full sm:w-[450px] ${theme.modalBg} border-l ${theme.borderSubtle} z-[100] flex flex-col shadow-2xl`}>
                <div className={`p-8 border-b ${theme.borderSubtle} flex justify-between items-center`}>
                  <h2 className={`text-2xl font-black uppercase tracking-tighter ${theme.heading}`}>
                    {loggedInCustomer ? 'Profile' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
                  </h2>
                  <button onClick={() => setIsAuthOpen(false)} className={`${theme.textMuted} hover:${theme.heading} transition-colors`}><X className="w-6 h-6" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                  {loggedInCustomer ? (
                    <div className="space-y-8">
                      <div className={`p-6 rounded-2xl ${theme.cardBg} border ${theme.borderSubtle}`}>
                        <div className="w-16 h-16 bg-brand-orange/20 text-brand-orange rounded-full flex items-center justify-center mb-4"><User className="w-8 h-8"/></div>
                        <h3 className={`text-xl font-bold uppercase ${theme.heading}`}>{loggedInCustomer.name}</h3>
                        <p className={`${theme.textMuted} text-sm mt-1`}>{loggedInCustomer.email}</p>
                        <p className={`${theme.textMuted} text-sm mt-1`}>{loggedInCustomer.phone}</p>
                      </div>

                      {/* ORDER HISTORY SECTION */}
                      <div>
                        <h3 className={`text-lg font-black uppercase tracking-tighter mb-4 ${theme.heading}`}>Order History</h3>
                        {isLoadingMyOrders ? (
                          <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-brand-orange" /></div>
                        ) : myOrders.length === 0 ? (
                          <div className={`p-4 text-center ${theme.textMuted} font-mono text-[10px] uppercase tracking-widest border ${theme.borderSubtle} rounded-xl`}>No past orders found.</div>
                        ) : (
                          <div className="space-y-4">
                            {myOrders.map(order => (
                              <div key={order._id} className={`p-4 rounded-xl border ${theme.borderSubtle} ${theme.cardBg}`}>
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${order.status === 'Completed' ? 'bg-green-500/20 text-green-500' : order.status === 'Cancelled' ? 'bg-red-500/20 text-red-500' : 'bg-brand-orange/20 text-brand-orange'}`}>
                                      {order.status.replace('_', ' ')}
                                    </span>
                                    <p className={`text-xs ${theme.textMutedLight} mt-2`}>
                                      {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                  </div>
                                  <span className="font-bold text-brand-orange text-sm">₦{order.pricing?.total.toLocaleString()}</span>
                                </div>
                                <div className={`mt-3 pt-3 border-t ${theme.borderSubtle}`}>
                                  {order.items.map((item, i) => (
                                    <p key={i} className={`text-xs ${theme.textMuted} mb-1`}><span className="font-bold text-brand-orange">{item.quantity}x</span> {item.menuItem?.name || 'Meal Item'}</p>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button onClick={handleCustomerLogout} className="w-full py-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-black uppercase tracking-widest text-xs transition-colors rounded-xl flex items-center justify-center gap-2">
                        <LogOut className="w-4 h-4"/> Sign Out
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleAuthSubmit} className="space-y-6">
                      {authMode === 'register' && (
                        <div><label className={`block font-mono text-[10px] tracking-widest uppercase ${theme.textMutedLight} mb-2`}>Full Name *</label><input required type="text" value={authData.name} onChange={e => setAuthData({...authData, name: e.target.value})} className={`w-full bg-transparent border-b ${theme.borderSubtle} px-0 py-3 ${theme.heading} focus:border-brand-orange outline-none transition-colors`} /></div>
                      )}
                      <div><label className={`block font-mono text-[10px] tracking-widest uppercase ${theme.textMutedLight} mb-2`}>Email Address *</label><input required type="email" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} className={`w-full bg-transparent border-b ${theme.borderSubtle} px-0 py-3 ${theme.heading} focus:border-brand-orange outline-none transition-colors`} /></div>
                      <div><label className={`block font-mono text-[10px] tracking-widest uppercase ${theme.textMutedLight} mb-2`}>Password *</label><input required type="password" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} className={`w-full bg-transparent border-b ${theme.borderSubtle} px-0 py-3 ${theme.heading} focus:border-brand-orange outline-none transition-colors`} /></div>

                      {authMode === 'register' && (
                        <>
                          <div><label className={`block font-mono text-[10px] tracking-widest uppercase ${theme.textMutedLight} mb-2`}>Phone Number</label><input type="tel" value={authData.phone} onChange={e => setAuthData({...authData, phone: e.target.value})} className={`w-full bg-transparent border-b ${theme.borderSubtle} px-0 py-3 ${theme.heading} focus:border-brand-orange outline-none transition-colors`} /></div>
                          <div><label className={`block font-mono text-[10px] tracking-widest uppercase ${theme.textMutedLight} mb-2`}>Delivery Address</label><textarea rows="2" value={authData.address} onChange={e => setAuthData({...authData, address: e.target.value})} className={`w-full bg-transparent border-b ${theme.borderSubtle} px-0 py-3 ${theme.heading} focus:border-brand-orange outline-none resize-none transition-colors`} /></div>
                        </>
                      )}

                      <button type="submit" disabled={isAuthLoading} className={`w-full py-5 ${isDark ? 'bg-white text-black' : 'bg-black text-white'} hover:bg-brand-orange hover:text-white font-black uppercase tracking-widest text-xs transition-colors rounded-xl disabled:opacity-50 mt-8`}>
                        {isAuthLoading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
                      </button>

                      <div className="text-center mt-6">
                        <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className={`font-mono text-[10px] uppercase tracking-widest text-brand-orange border-b border-brand-orange pb-1 hover:opacity-70 transition-opacity`}>
                          {authMode === 'login' ? 'Create an account' : 'Already have an account? Sign In'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* --- CUSTOMIZATION MODAL (ADD-ONS) --- */}
        <AnimatePresence>
          {activeMeal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveMeal(null)} className={`absolute inset-0 ${theme.overlay} backdrop-blur-md`} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`relative w-full max-w-md ${theme.modalBg} border ${theme.borderSubtle} shadow-2xl p-8 flex flex-col rounded-2xl`}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl font-black uppercase tracking-tighter ${theme.heading}`}>Customize</h2>
                  <button onClick={() => setActiveMeal(null)} className={`${theme.textMuted} hover:${theme.heading}`}><X className="w-6 h-6" /></button>
                </div>
                <p className={`${theme.textMuted} font-light mb-6 text-sm`}>Add extras to your {activeMeal.name}.</p>
                <div className="space-y-3 mb-8 max-h-[40vh] overflow-y-auto pr-2">
                  {activeMeal.addOns?.length > 0 ? (
                    activeMeal.addOns.map(addon => (
                      <label key={addon.name} className={`flex items-center justify-between p-4 ${theme.cardBg} border ${theme.borderSubtle} hover:border-brand-orange/50 transition-colors cursor-pointer group rounded-lg`}>
                        <span className={`font-mono text-xs uppercase tracking-widest ${theme.textMuted} group-hover:${theme.heading}`}>{addon.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-brand-orange font-light">+₦{addon.price}</span>
                          <input type="checkbox" className="accent-brand-orange w-4 h-4" onChange={(e) => { if (e.target.checked) setCartAddOns([...cartAddOns, addon]); else setCartAddOns(cartAddOns.filter(a => a.name !== addon.name)); }} />
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className={`text-gray-500 font-mono text-xs uppercase tracking-widest`}>No add-ons available for this item.</p>
                  )}
                </div>
                
                {/* DYNAMIC BASE PRICE FOR CUSTOMIZATION MODAL */}
                <button 
                  onClick={() => addToCart(activeMeal, cartAddOns)} 
                  className={`w-full py-5 ${isDark ? 'bg-white text-black' : 'bg-black text-white'} hover:bg-brand-orange hover:text-white font-black uppercase tracking-widest text-xs transition-colors rounded-xl`}
                >
                  Add to Bag • ₦{
                    (
                      (activeMeal.discountPercentage > 0 
                        ? activeMeal.price - (activeMeal.price * (activeMeal.discountPercentage / 100)) 
                        : activeMeal.price) 
                      + cartAddOns.reduce((sum, a) => sum + a.price, 0)
                    ).toLocaleString()
                  }
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- CART DRAWER --- */}
        <AnimatePresence>
          {isCartOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className={`fixed inset-0 ${theme.overlay} backdrop-blur-md z-[100]`} />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className={`fixed top-0 right-0 h-full w-full sm:w-[450px] ${theme.modalBg} border-l ${theme.borderSubtle} z-[100] flex flex-col shadow-2xl`}>
                <div className={`p-8 border-b ${theme.borderSubtle} flex justify-between items-center`}>
                  <h2 className={`text-2xl font-black uppercase tracking-tighter ${theme.heading}`}>Your Bag</h2>
                  <button onClick={() => setIsCartOpen(false)} className={`${theme.textMuted} hover:${theme.heading} transition-colors`}><X className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {cart.length === 0 ? (
                    <div className={`h-full flex flex-col items-center justify-center ${theme.textMuted} font-mono text-xs uppercase tracking-widest`}><p>Bag is empty.</p></div>
                  ) : (
                    cart.map(item => (
                      <div key={item.cartItemId} className="flex gap-6 group">
                        <div className={`w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border ${theme.borderSubtle} grayscale group-hover:grayscale-0 transition-all`}><img src={item.image?.url || item.image} alt={item.name} className="w-full h-full object-cover" /></div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <h4 className={`font-bold uppercase tracking-tight text-sm ${theme.heading}`}>{item.name}</h4>
                            {item.selectedAddOns?.length > 0 && (<p className={`text-[10px] ${theme.textMutedLight} font-mono uppercase tracking-widest mt-1`}>+ {item.selectedAddOns.map(a => a.name).join(', ')}</p>)}
                            <p className="text-brand-orange font-light mt-1">₦{item.price.toLocaleString()}</p>
                          </div>
                          <div className={`flex items-center gap-4 text-sm font-mono ${theme.heading}`}>
                            <button onClick={() => updateQty(item.cartItemId, -1)} className="hover:text-brand-orange">-</button>
                            <span>{item.qty}</span>
                            <button onClick={() => updateQty(item.cartItemId, 1)} className="hover:text-brand-orange">+</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {cart.length > 0 && (
                  <div className={`p-8 border-t ${theme.borderSubtle} ${theme.cardBg}`}>
                    <div className={`flex justify-between mb-4 ${theme.textMuted} font-light`}><span>Subtotal</span><span>₦{cartTotal.toLocaleString()}</span></div>
                    <div className={`flex justify-between mb-8 ${theme.textMuted} font-light`}><span>Delivery</span><span>₦{deliveryFee.toLocaleString()}</span></div>
                    <div className={`flex justify-between mb-8 text-2xl font-bold uppercase tracking-tighter ${theme.heading}`}><span>Total</span><span className="text-brand-orange">₦{grandTotal.toLocaleString()}</span></div>
                    <button onClick={() => { setFinalTotal(grandTotal); setIsCartOpen(false); setIsCheckoutOpen(true); }} className={`w-full py-5 ${isDark ? 'bg-white text-black' : 'bg-black text-white'} hover:bg-brand-orange hover:text-white font-black uppercase tracking-widest text-xs transition-colors rounded-xl`}>Proceed to Checkout</button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* --- CHECKOUT MODAL --- */}
        <AnimatePresence>
          {isCheckoutOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !orderSuccess && setIsCheckoutOpen(false)} className={`absolute inset-0 ${theme.overlay} backdrop-blur-md`} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`relative w-full max-w-lg ${theme.modalBg} border ${theme.borderSubtle} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
                {orderSuccess ? (
                  <div className="p-12 flex flex-col items-center text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="w-20 h-20 bg-brand-orange/20 text-brand-orange rounded-full flex items-center justify-center mb-8"><CheckCircle2 className="w-10 h-10" /></motion.div>
                    <h2 className={`text-4xl font-black uppercase tracking-tighter mb-4 ${theme.heading}`}>Order Secured</h2>
                    <p className={`${theme.textMuted} font-light mb-10`}>Your order is now on our live board.</p>
                    <div className={`${theme.cardBg} border ${theme.borderSubtle} p-8 w-full mb-8 text-left rounded-xl`}>
                      <p className="font-mono text-[10px] text-brand-orange tracking-widest uppercase mb-4">Transfer Details</p>
                      <p className={`font-bold text-xl mb-1 ${theme.heading}`}>Guaranty Trust Bank</p>
                      <p className={`text-3xl tracking-widest font-mono font-light mb-2 ${theme.heading}`}>0123456789</p>
                      <p className={`text-sm ${theme.textMutedLight} mb-6`}>Food Wave Bistro Ltd.</p>
                      <div className={`pt-6 border-t ${theme.borderSubtle} flex justify-between items-end`}>
                        <span className={`${theme.textMutedLight} font-light`}>Amount Due:</span><span className="font-black text-2xl text-brand-orange">₦{finalTotal.toLocaleString()}</span>
                      </div>
                    </div>
                    <button onClick={() => { setIsCheckoutOpen(false); setOrderSuccess(false); }} className={`font-mono text-xs tracking-widest uppercase ${theme.textMuted} hover:${theme.heading} transition-colors border-b ${theme.borderSubtle} pb-1`}>Back to Home</button>
                  </div>
                ) : (
                  <>
                    <div className={`p-8 border-b ${theme.borderSubtle} flex items-center justify-between`}>
                      <div className="flex items-center gap-4">
                        <button onClick={() => { setIsCheckoutOpen(false); setIsCartOpen(true); }} className={`${theme.textMuted} hover:${theme.heading} transition-colors`}><ArrowLeft className="w-6 h-6" /></button>
                        <h2 className={`text-2xl font-black uppercase tracking-tighter ${theme.heading}`}>Delivery Details</h2>
                      </div>
                      {!loggedInCustomer && (
                        <span className={`text-[10px] font-mono uppercase tracking-widest bg-brand-orange/10 text-brand-orange px-2 py-1 rounded`}>Guest Checkout</span>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-8">
                      {!loggedInCustomer && (
                        <div className={`mb-8 p-4 border border-brand-orange/30 bg-brand-orange/5 rounded-xl`}>
                          <p className={`text-xs ${theme.text} font-light`}>Want to checkout faster next time? <button type="button" onClick={() => {setIsCheckoutOpen(false); setAuthMode('register'); setIsAuthOpen(true);}} className="text-brand-orange font-bold uppercase tracking-widest text-[10px] border-b border-brand-orange ml-1 hover:opacity-70">Create an account</button></p>
                        </div>
                      )}
                      <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-6">
                        <div><label className={`block font-mono text-[10px] tracking-widest uppercase ${theme.textMutedLight} mb-2`}>Full Name</label><input required type="text" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className={`w-full bg-transparent border-b ${theme.borderSubtle} px-0 py-3 ${theme.heading} focus:border-brand-orange outline-none transition-colors`} /></div>
                        
                        {/* --- NEW EMAIL INPUT FOR CHECKOUT --- */}
                        <div><label className={`block font-mono text-[10px] tracking-widest uppercase ${theme.textMutedLight} mb-2`}>Email Address</label><input required type="email" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} className={`w-full bg-transparent border-b ${theme.borderSubtle} px-0 py-3 ${theme.heading} focus:border-brand-orange outline-none transition-colors`} /></div>
                        
                        <div><label className={`block font-mono text-[10px] tracking-widest uppercase ${theme.textMutedLight} mb-2`}>Phone Number</label><input required type="tel" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className={`w-full bg-transparent border-b ${theme.borderSubtle} px-0 py-3 ${theme.heading} focus:border-brand-orange outline-none transition-colors`} /></div>
                        <div><label className={`block font-mono text-[10px] tracking-widest uppercase ${theme.textMutedLight} mb-2`}>Delivery Address</label><textarea required rows="2" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className={`w-full bg-transparent border-b ${theme.borderSubtle} px-0 py-3 ${theme.heading} focus:border-brand-orange outline-none resize-none transition-colors`} /></div>
                        <div><label className={`block font-mono text-[10px] tracking-widest uppercase ${theme.textMutedLight} mb-2`}>Order Notes</label><input type="text" value={customer.notes} onChange={e => setCustomer({...customer, notes: e.target.value})} className={`w-full bg-transparent border-b ${theme.borderSubtle} px-0 py-3 ${theme.heading} focus:border-brand-orange outline-none transition-colors`} /></div>
                      </form>
                    </div>
                    
                    <div className={`p-8 ${theme.cardBg} border-t ${theme.borderSubtle}`}>
                      <div className="flex justify-between items-center mb-8">
                        <span className={`${theme.textMuted} font-light`}>Total to pay:</span>
                        <span className="text-3xl font-black tracking-tighter text-brand-orange">₦{finalTotal.toLocaleString()}</span>
                      </div>
                      
                      <div className="w-full">
                        <div className="hidden md:block">
                          <button form="checkout-form" type="submit" disabled={isSubmitting} className={`w-full py-5 ${isDark ? 'bg-white text-black' : 'bg-black text-white'} hover:bg-brand-orange hover:text-white font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50 rounded-xl`}>
                            {isSubmitting ? 'Processing...' : 'Confirm Order'}
                          </button>
                        </div>
                        <div className="md:hidden">
                          <SlideToOrder 
                            onConfirm={() => document.getElementById('checkout-form').requestSubmit()} 
                            isSubmitting={isSubmitting} 
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- FOOTER --- */}
        <footer className={`border-t ${theme.borderSubtle} pt-20 pb-10 mt-20 relative z-10 ${theme.bg}`}>
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16">
            <div className="col-span-2">
              <h2 className={`text-xl md:text-3xl font-black uppercase tracking-tighter mb-4 ${theme.heading}`}>Food Wave Bistro.</h2>
              <p className={`${theme.textMutedLight} font-light mb-8 max-w-xs md:max-w-sm text-xs md:text-base`}>Premium comfort food delivered fast. Experience chef-crafted, high-end Nigerian cuisine at your doorstep.</p>
              <div className="flex gap-4 md:gap-6 text-[10px] md:text-xs">
                <a href="https://www.instagram.com/food_wave_bistro?igsh=Z2U1emt5dHV4ano0&utm_source=qr" target="_blank" rel="noreferrer" className={`${theme.textMutedLight} hover:text-brand-orange transition-colors`}>INSTAGRAM</a>
                <a href="https://wa.me/message/Y7GFAFXGPN7SE1" target="_blank" rel="noreferrer" className={`${theme.textMutedLight} hover:text-brand-orange transition-colors`}>WHATSAPP</a>
                <a href="https://www.tiktok.com/@foodwavebistro?_r=1&_t=ZS-96XYXN4URWv" target="_blank" rel="noreferrer" className={`${theme.textMutedLight} hover:text-brand-orange transition-colors`}>TIKTOK</a>
              </div>
            </div>
            <div>
              <h4 className={`font-mono text-[8px] md:text-[10px] tracking-widest uppercase ${theme.heading} mb-4 md:mb-6`}>Legal</h4>
              <ul className={`space-y-3 md:space-y-4 ${theme.textMutedLight} text-xs md:text-sm font-light`}>
                <li><Link to="/refund-policy" className="hover:text-brand-orange transition-colors">Refund Policy</Link></li>
                <li><Link to="/terms" className="hover:text-brand-orange transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>
            <div>
              <h4 className={`font-mono text-[8px] md:text-[10px] tracking-widest uppercase ${theme.heading} mb-4 md:mb-6`}>Contact</h4>
              <p className={`${theme.textMutedLight} text-xs md:text-sm font-light hover:text-brand-orange`}>09061491340</p>
            </div>
          </div>
          <div className={`max-w-7xl mx-auto px-6 pt-8 border-t ${theme.borderSubtle} flex flex-col md:flex-row justify-between items-center text-[8px] md:text-xs font-mono ${theme.textMuted} uppercase tracking-widest`}>
            <p>&copy; {new Date().getFullYear()} Food Wave Bistro.</p>
            <p className="mt-4 md:mt-0">Designed for taste & speed.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

// --- LEGAL PAGES COMPONENTS ---
function RefundPolicy({ isDark }) {
  const theme = getTheme(isDark);
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans pt-32 pb-24 px-6 transition-colors duration-500`}>
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-block font-mono text-[10px] tracking-widest uppercase text-brand-orange border-b border-brand-orange pb-1 hover:opacity-70 transition-opacity mb-12">Back to Home</Link>
        <h1 className={`text-3xl md:text-5xl font-black uppercase tracking-tighter mb-12 ${theme.heading}`}>Refund Policy</h1>
        <div className={`space-y-6 ${theme.textMuted} font-light leading-relaxed text-sm md:text-lg`}>
          <p>At Food Wave Bistro customer satisfaction is very important to us. Due to the nature of food products, refunds may only be considered under specific circumstances.</p>
          <p className={`font-bold ${theme.heading} mt-12 mb-4`}>Refunds or replacements may be provided if:</p>
          <ul className="list-disc pl-6 space-y-4"><li>The wrong order was delivered</li><li>The food arrived damaged or incomplete</li><li>There was a major issue with the quality of the order</li></ul>
          <p className="mt-12">Customers are encouraged to report any issues immediately after receiving their order by contacting our support team with clear details and proof where necessary.</p>
        </div>
      </div>
    </div>
  );
}

function TermsConditions({ isDark }) {
  const theme = getTheme(isDark);
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans pt-32 pb-24 px-6 transition-colors duration-500`}>
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-block font-mono text-[10px] tracking-widest uppercase text-brand-orange border-b border-brand-orange pb-1 hover:opacity-70 transition-opacity mb-12">Back to Home</Link>
        <h1 className={`text-3xl md:text-5xl font-black uppercase tracking-tighter mb-12 ${theme.heading}`}>Terms & Conditions</h1>
        <div className={`space-y-6 ${theme.textMuted} font-light leading-relaxed text-sm md:text-lg`}>
          <p>By using our website and placing an order with Food Wave Bistro, you agree to the following terms and conditions:</p>
          <ul className="list-disc pl-6 space-y-4 mt-8"><li>All orders placed through our website are subject to availability and confirmation.</li><li>Customers are responsible for providing accurate delivery details and contact information during checkout.</li><li>Delivery times may vary depending on location, traffic, weather conditions, or unforeseen circumstances.</li><li>Payments made through our website are secure and processed through trusted payment platforms.</li><li>Once an order has been confirmed and prepared, cancellations may not be possible.</li><li>We reserve the right to refuse or cancel any order if necessary.</li></ul>
        </div>
      </div>
    </div>
  );
}

// --- ADMIN LOGIN COMPONENT ---
function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (data.success) { localStorage.setItem('adminToken', data.token); window.location.href = '/admin'; } else alert(data.message || 'Login failed');
    } catch (error) { alert('Network error connecting to backend.'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-brand-cream flex items-center justify-center font-sans px-4">
      <FilmGrain />
      <div className="w-full max-w-md bg-white/5 p-8 md:p-12 border border-white/10 backdrop-blur-lg relative z-10 rounded-2xl">
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-center mb-2 text-white">Admin Portal</h2>
        <p className="text-gray-500 text-center mb-10 font-mono text-[8px] md:text-[10px] tracking-widest uppercase">Secure Access Only</p>
        <form onSubmit={handleLogin} className="space-y-8">
          <div><input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:border-brand-orange outline-none transition-colors" /></div>
          <div><input required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:border-brand-orange outline-none transition-colors" /></div>
          <button type="submit" disabled={loading} className="w-full py-4 md:py-5 bg-brand-orange text-white font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-white hover:text-black transition-colors disabled:opacity-50 rounded-xl">{loading ? 'Authenticating...' : 'Secure Login'}</button>
        </form>
      </div>
    </div>
  );
}

// --- APP ROUTER ---
export default function App() {
  const [isDark, setIsDark] = useState(true);

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Storefront isDark={isDark} setIsDark={setIsDark} />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/refund-policy" element={<RefundPolicy isDark={isDark} />} />
        <Route path="/terms" element={<TermsConditions isDark={isDark} />} />
      </Routes>
    </Router>
  );
}