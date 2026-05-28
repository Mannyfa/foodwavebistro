import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ListOrdered, UtensilsCrossed, Settings, 
  Clock, DollarSign, Plus, CheckCircle2, XCircle, Loader2, X, 
  ImagePlus, ChevronRight, ChevronLeft, LogOut, Trash2, Shield, Menu, Edit
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('orders');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // LIVE DATA STATES
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ADD-ONS STATE
  const [availableAddOns] = useState([
    { name: 'Plantain', price: 500 },
    { name: 'Egg', price: 300 },
    { name: 'Turkey', price: 1500 },
    { name: 'Chicken', price: 1200 },
    { name: 'Beef', price: 1000 }
  ]);
  const [selectedAddOns, setSelectedAddOns] = useState([]);

  // SETTINGS STATE
  const [settingsData, setSettingsData] = useState({
    currentPassword: '',
    newEmail: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  // --- LIVE REVENUE CALCULATION ---
  const { chartData, todaysRevenue } = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i)); 
      return {
        dateStr: d.toISOString().split('T')[0], 
        name: d.toLocaleDateString('en-US', { weekday: 'short' }), 
        revenue: 0
      };
    });

    orders.forEach(order => {
      if (order.status === 'Cancelled') return; 
      if (!order.createdAt) return;
      
      const orderDateStr = new Date(order.createdAt).toISOString().split('T')[0];
      const dayIndex = last7Days.findIndex(day => day.dateStr === orderDateStr);
      
      if (dayIndex !== -1 && order.pricing?.total) {
        last7Days[dayIndex].revenue += order.pricing.total;
      }
    });

    return {
      chartData: last7Days,
      todaysRevenue: last7Days[6].revenue
    };
  }, [orders]);

  // --- CUSTOMER INSIGHTS LOGIC ---
  const [customerInsight, setCustomerInsight] = useState(null);

  const handleOpenCustomerInsight = (phone) => {
    const history = orders.filter(o => o.customer.phone === phone);
    
    const totalSpent = history.reduce((sum, order) => {
      if (order.status !== 'Cancelled') {
        return sum + (order.pricing?.total || 0);
      }
      return sum;
    }, 0);

    const sortedHistory = [...history].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setCustomerInsight({
      name: history[0]?.customer.name || 'Unknown',
      phone: phone,
      address: history[0]?.customer.address || 'No address',
      orderCount: history.length,
      totalSpent: totalSpent,
      recentOrders: sortedHistory.slice(0, 5) 
    });
  };

  // AUTH GUARD
  const token = localStorage.getItem('adminToken');
  useEffect(() => {
    if (!token) window.location.href = '/admin/login';
  }, [token]);

  // MEAL MODAL STATES
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMealId, setEditingMealId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [newMeal, setNewMeal] = useState({
    name: '', description: '', price: '', category: 'Rice Meals', preparationTime: '', tags: '', discountPercentage: 0
  });

  const resetModal = () => {
    setNewMeal({ name: '', description: '', price: '', category: 'Rice Meals', preparationTime: '', tags: '', discountPercentage: 0 });
    setSelectedAddOns([]);
    setImageFile(null);
    setImagePreview(null);
    setIsEditMode(false);
    setEditingMealId(null);
    setIsAddMealOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  };

  // --- FETCH LIVE ORDERS ---
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          const formattedOrders = data.data.map(order => ({
            ...order,
            time: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setOrders(formattedOrders);
        }
      } catch (error) { console.error("Failed to fetch orders:", error); } 
      finally { setIsLoadingOrders(false); }
    };
    
    if (token) fetchOrders();
    const interval = setInterval(() => token && fetchOrders(), 10000);
    return () => clearInterval(interval);
  }, [token]);

  // --- FETCH LIVE MENU ---
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/menu`);
        const data = await response.json();
        if (data.success) setMenuItems(data.data);
      } catch (error) { console.error("Failed to fetch menu:", error); } 
      finally { setIsLoadingMenu(false); }
    };
    fetchMenu();
  }, []);

  const updateOrderStatus = async (id, newStatus) => {
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/v1/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) { alert("Warning: Failed to sync status with database."); }
  };

  const toggleMenuAvailability = async (id, currentStatus) => {
    setMenuItems(prev => prev.map(m => m._id === id ? { ...m, isAvailable: !currentStatus } : m));
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/v1/menu/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ isAvailable: !currentStatus })
      });
    } catch (error) { alert("Failed to update availability."); }
  };

  const handleEditClick = (item) => {
    setNewMeal({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      preparationTime: item.preparationTime,
      tags: item.tags || '',
      discountPercentage: item.discountPercentage || 0
    });
    setSelectedAddOns(item.addOns || []);
    setImagePreview(item.image?.url || item.image);
    setImageFile(null); 
    setIsEditMode(true);
    setEditingMealId(item._id);
    setIsAddMealOpen(true);
  };

  const deleteMenuItem = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this meal?")) return;
    setMenuItems(prev => prev.filter(m => m._id !== id));
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/v1/menu/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) { alert("Failed to delete meal."); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  const handleAddMealSubmit = async (e) => {
    e.preventDefault();
    if (!isEditMode && !imageFile) { alert("Please select an image file first."); return; }
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('name', newMeal.name);
    formData.append('description', newMeal.description);
    formData.append('price', newMeal.price);
    formData.append('category', newMeal.category);
    formData.append('preparationTime', newMeal.preparationTime);
    formData.append('tags', newMeal.tags);
    formData.append('discountPercentage', newMeal.discountPercentage);
    if (imageFile) formData.append('image', imageFile);
    formData.append('addOns', JSON.stringify(selectedAddOns));

    try {
      const url = isEditMode 
        ? `${import.meta.env.VITE_API_URL}/api/v1/menu/${editingMealId}` 
        : `${import.meta.env.VITE_API_URL}/api/v1/menu`;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        if (isEditMode) {
          setMenuItems(menuItems.map(item => item._id === editingMealId ? data.data : item));
        } else {
          setMenuItems([data.data, ...menuItems]);
        }
        resetModal();
      } else { alert(`Error: ${data.message}`); }
    } catch (error) { alert("Network error. Is your backend running?"); } 
    finally { setIsSubmitting(false); }
  };

  // --- UPDATE CREDENTIALS LOGIC ---
  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    
    if (!settingsData.currentPassword) {
      return alert("Current password is required to make changes.");
    }
    if (settingsData.newPassword && settingsData.newPassword !== settingsData.confirmPassword) {
      return alert("New passwords do not match.");
    }

    setIsUpdatingSettings(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/update-credentials`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: settingsData.currentPassword,
          newEmail: settingsData.newEmail,
          newPassword: settingsData.newPassword
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert("Credentials updated successfully! Please log in again with your new credentials.");
        handleLogout(); 
      } else {
        alert(data.message || "Failed to update credentials.");
      }
    } catch (error) {
      console.error("Settings update error:", error);
      alert("Network error while updating credentials.");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // PAGINATION LOGIC
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMenuItems = menuItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(menuItems.length / itemsPerPage);

  if (!token) return null; 

  return (
    <div className="min-h-screen bg-charcoal text-brand-cream flex font-sans">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="w-64 bg-matte border-r border-white/5 flex flex-col hidden md:flex z-10">
        <div className="p-6 border-b border-white/5">
          <div className="text-xl font-bold tracking-tighter">Food Wave <span className="text-brand-orange">Admin.</span></div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <SidebarButton icon={<LayoutDashboard />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SidebarButton icon={<ListOrdered />} label="Live Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} badge={orders.filter(o => o.status === 'Pending').length} />
          <SidebarButton icon={<UtensilsCrossed />} label="Menu Manager" active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
          <SidebarButton icon={<Settings />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>
        <div onClick={handleLogout} className="p-4 border-t border-white/5 text-red-500 text-sm flex items-center gap-2 hover:bg-red-500/10 cursor-pointer transition-colors"><LogOut className="w-4 h-4" /> Secure Logout</div>
      </aside>

      {/* MOBILE SIDEBAR MODAL */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] flex md:hidden">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ x: '-100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '-100%' }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }} 
              className="relative w-64 bg-matte border-r border-white/5 flex flex-col h-full shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <div className="text-xl font-bold tracking-tighter">Food Wave <span className="text-brand-orange">Admin.</span></div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <SidebarButton icon={<LayoutDashboard />} label="Overview" active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }} />
                <SidebarButton icon={<ListOrdered />} label="Live Orders" active={activeTab === 'orders'} onClick={() => { setActiveTab('orders'); setIsMobileMenuOpen(false); }} badge={orders.filter(o => o.status === 'Pending').length} />
                <SidebarButton icon={<UtensilsCrossed />} label="Menu Manager" active={activeTab === 'menu'} onClick={() => { setActiveTab('menu'); setIsMobileMenuOpen(false); }} />
                <SidebarButton icon={<Settings />} label="Settings" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} />
              </nav>
              <div onClick={handleLogout} className="p-4 border-t border-white/5 text-red-500 text-sm flex items-center gap-2 hover:bg-red-500/10 cursor-pointer transition-colors"><LogOut className="w-4 h-4" /> Secure Logout</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 bg-charcoal/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 md:px-8 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 md:hidden text-gray-400 hover:text-white transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold capitalize">{activeTab.replace('-', ' ')}</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-orange to-brand-gold p-[2px]"><div className="w-full h-full bg-matte rounded-full flex items-center justify-center font-bold text-sm">AD</div></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-0">
          <AnimatePresence mode="wait">
            
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                
                {/* DYNAMIC STAT CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard 
                    icon={<DollarSign/>} 
                    title="Today's Revenue" 
                    value={`₦${todaysRevenue.toLocaleString()}`} 
                    trend="Live" 
                    good 
                  />
                  <StatCard 
                    icon={<ListOrdered/>} 
                    title="Active Orders" 
                    value={orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length} 
                    trend="Live" 
                    good 
                  />
                  <StatCard 
                    icon={<Clock/>} 
                    title="Total Orders" 
                    value={orders.length} 
                    trend="All Time" 
                    good 
                  />
                </div>

                {/* LIVE REVENUE CHART */}
                <div className="bg-matte border border-white/5 rounded-2xl p-4 md:p-8 shadow-xl">
                  <h3 className="text-lg font-bold mb-8">7-Day Revenue Trend</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#666" />
                        <YAxis stroke="#666" width={60} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                          itemStyle={{ color: '#ea580c', fontWeight: 'bold' }}
                          formatter={(value) => [`₦${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Bar dataKey="revenue" fill="#ea580c" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {isLoadingOrders ? (
                  <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-orange" /></div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <OrderColumn title="New Orders" count={orders.filter(o => o.status === 'Pending').length}>
                      {orders.filter(o => o.status === 'Pending').map(order => (
                        <OrderCard 
                          key={order._id} 
                          order={order} 
                          onAccept={() => updateOrderStatus(order._id, 'Preparing')} 
                          onReject={() => updateOrderStatus(order._id, 'Cancelled')} 
                          onOpenInsight={handleOpenCustomerInsight}
                        />
                      ))}
                    </OrderColumn>
                    <OrderColumn title="In Kitchen" count={orders.filter(o => o.status === 'Preparing').length}>
                      {orders.filter(o => o.status === 'Preparing').map(order => (
                        <OrderCard 
                          key={order._id} 
                          order={order} 
                          onAction={() => updateOrderStatus(order._id, 'Out_For_Delivery')} 
                          actionLabel="Mark as Dispatched" 
                          onOpenInsight={handleOpenCustomerInsight}
                        />
                      ))}
                    </OrderColumn>
                    <OrderColumn title="Dispatched" count={orders.filter(o => o.status === 'Out_For_Delivery').length}>
                      {orders.filter(o => o.status === 'Out_For_Delivery').map(order => (
                        <OrderCard 
                          key={order._id} 
                          order={order} 
                          onAction={() => updateOrderStatus(order._id, 'Completed')} 
                          actionLabel="Mark Completed" 
                          onOpenInsight={handleOpenCustomerInsight}
                        />
                      ))}
                    </OrderColumn>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'menu' && (
              <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-matte border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center bg-charcoal/50">
                  <h3 className="text-lg font-bold">Menu Items</h3>
                  <button onClick={() => { resetModal(); setIsAddMealOpen(true); }} className="px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 transition-colors text-sm font-medium shadow-lg shadow-brand-orange/20"><Plus className="w-4 h-4" /> Add New Meal</button>
                </div>
                
                {isLoadingMenu ? <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-orange" /></div> : (
                  <div className="flex flex-col">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead><tr className="bg-white/5 text-gray-400 text-sm"><th className="p-4 font-medium">Item Name</th><th className="p-4 font-medium">Category</th><th className="p-4 font-medium">Price</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Actions</th></tr></thead>
                        <tbody>
                          {currentMenuItems.map(item => {
                            const hasDiscount = item.discountPercentage > 0;
                            const discountedPrice = hasDiscount ? item.price - (item.price * (item.discountPercentage / 100)) : item.price;
                            
                            return (
                              <tr key={item._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                <td className="p-4 font-medium flex items-center gap-3"><img src={item.image?.url || item.image} alt="" className="w-10 h-10 rounded-md object-cover border border-white/10" />{item.name}</td>
                                <td className="p-4 text-gray-400 text-sm">{item.category}</td>
                                
                                {/* Dynamic Pricing Column */}
                                <td className="p-4">
                                  {hasDiscount ? (
                                    <div className="flex flex-col">
                                      <span className="text-brand-orange font-bold">₦{discountedPrice.toLocaleString()}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-500 line-through text-xs">₦{item.price.toLocaleString()}</span>
                                        <span className="text-[10px] bg-brand-orange/20 text-brand-orange px-1 rounded font-bold">-{item.discountPercentage}%</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-brand-orange font-medium">₦{item.price?.toLocaleString()}</span>
                                  )}
                                </td>
                                
                                <td className="p-4"><button onClick={() => toggleMenuAvailability(item._id, item.isAvailable)} className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold transition-colors ${item.isAvailable ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}>{item.isAvailable ? 'Available' : 'Sold Out'}</button></td>
                                
                                <td className="p-4 flex items-center gap-2">
                                  <button onClick={() => handleEditClick(item)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                                  <button onClick={() => deleteMenuItem(item._id)} className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* PAGINATION CONTROLS */}
                    {menuItems.length > 0 && (
                      <div className="p-4 border-t border-white/5 flex justify-between items-center bg-charcoal/30">
                        <span className="text-xs text-gray-400">Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, menuItems.length)} of {menuItems.length} entries</span>
                        <div className="flex gap-2">
                          <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-1 rounded-md bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4"/></button>
                          <span className="text-xs text-gray-400 flex items-center px-2">Page {currentPage} of {totalPages}</span>
                          <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-1 rounded-md bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4"/></button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl">
                <div className="bg-matte border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-white/5 bg-charcoal/50 flex items-center gap-3">
                    <Shield className="w-6 h-6 text-brand-orange" />
                    <h3 className="text-lg font-bold">Security & Credentials</h3>
                  </div>
                  
                  <div className="p-6 md:p-8">
                    <p className="text-sm text-gray-400 mb-8 font-light">Update your admin login credentials here. You must provide your current password to save any changes. If you successfully change your credentials, you will be logged out automatically.</p>
                    
                    <form id="settings-form" onSubmit={handleUpdateCredentials} className="space-y-6">
                      <div>
                        <label className="block text-xs font-mono tracking-widest uppercase text-gray-400 mb-2">Current Password *</label>
                        <input 
                          required 
                          type="password" 
                          placeholder="Verify it's you"
                          value={settingsData.currentPassword} 
                          onChange={e => setSettingsData({...settingsData, currentPassword: e.target.value})} 
                          className="w-full bg-charcoal border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-orange outline-none transition-colors" 
                        />
                      </div>

                      <div className="pt-6 border-t border-white/5">
                        <label className="block text-xs font-mono tracking-widest uppercase text-brand-orange mb-4">New Credentials</label>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-mono tracking-widest uppercase text-gray-400 mb-2">New Email Address</label>
                            <input 
                              type="email" 
                              placeholder="Leave blank to keep current email"
                              value={settingsData.newEmail} 
                              onChange={e => setSettingsData({...settingsData, newEmail: e.target.value})} 
                              className="w-full bg-charcoal border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-orange outline-none transition-colors" 
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-mono tracking-widest uppercase text-gray-400 mb-2">New Password</label>
                              <input 
                                type="password" 
                                placeholder="Leave blank to keep current"
                                value={settingsData.newPassword} 
                                onChange={e => setSettingsData({...settingsData, newPassword: e.target.value})} 
                                className="w-full bg-charcoal border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-orange outline-none transition-colors" 
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-mono tracking-widest uppercase text-gray-400 mb-2">Confirm New Password</label>
                              <input 
                                type="password" 
                                placeholder="Repeat new password"
                                value={settingsData.confirmPassword} 
                                onChange={e => setSettingsData({...settingsData, confirmPassword: e.target.value})} 
                                className="w-full bg-charcoal border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-orange outline-none transition-colors" 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div className="p-6 bg-charcoal/50 border-t border-white/5 flex justify-end">
                    <button 
                      form="settings-form" 
                      type="submit" 
                      disabled={isUpdatingSettings} 
                      className="w-full md:w-auto px-8 py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-sm shadow-lg shadow-brand-orange/20 disabled:opacity-70"
                    >
                      {isUpdatingSettings ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* --- ADD/EDIT MEAL MODAL --- */}
      <AnimatePresence>
        {isAddMealOpen && (
          <div className="fixed inset-0 z-[110] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetModal} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full sm:w-[500px] bg-charcoal border-l border-white/10 shadow-2xl flex flex-col h-full">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-matte/50">
                <h2 className="text-xl font-bold">{isEditMode ? 'Edit Meal' : 'Add New Meal'}</h2>
                <button onClick={resetModal} className="p-2 rounded-full bg-white/5 hover:bg-white/10"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <form id="add-meal-form" onSubmit={handleAddMealSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Meal Image</label>
                    <div className="relative group cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className={`h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors overflow-hidden ${imagePreview ? 'border-brand-orange bg-matte' : 'border-white/20 bg-white/5 hover:border-brand-orange/50 hover:bg-white/10'}`}>
                        {imagePreview ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /> : <><ImagePlus className="w-8 h-8 text-gray-400 mb-2" /><span className="text-sm font-medium text-gray-400 group-hover:text-brand-orange transition-colors">Tap to browse your device</span></>}
                      </div>
                    </div>
                    {isEditMode && <p className="text-[10px] text-gray-500 mt-1">Leave empty to keep current image.</p>}
                  </div>
                  <div><label className="block text-sm font-medium text-gray-400 mb-1.5">Meal Name</label><input required type="text" value={newMeal.name} onChange={e => setNewMeal({...newMeal, name: e.target.value})} className="w-full bg-matte border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-orange outline-none" /></div>
                  <div><label className="block text-sm font-medium text-gray-400 mb-1.5">Description</label><textarea required rows="2" value={newMeal.description} onChange={e => setNewMeal({...newMeal, description: e.target.value})} className="w-full bg-matte border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-orange outline-none resize-none" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-400 mb-1.5">Original Price (₦)</label><input required type="number" value={newMeal.price} onChange={e => setNewMeal({...newMeal, price: e.target.value})} className="w-full bg-matte border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-orange outline-none" /></div>
                    <div><label className="block text-sm font-medium text-brand-orange mb-1.5">Discount (%)</label><input type="number" min="0" max="100" placeholder="e.g. 10" value={newMeal.discountPercentage} onChange={e => setNewMeal({...newMeal, discountPercentage: e.target.value})} className="w-full bg-brand-orange/5 border border-brand-orange/30 rounded-xl px-4 py-3 text-brand-orange font-bold focus:border-brand-orange outline-none" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-400 mb-1.5">Category</label><select value={newMeal.category} onChange={e => setNewMeal({...newMeal, category: e.target.value})} className="w-full bg-matte border border-white/10 rounded-xl px-4 py-3 text-white outline-none"><option>Rice Meals</option><option>Pasta</option><option>Grills</option><option>Small Chops</option><option>Drinks</option><option>Specials</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-400 mb-1.5">Prep Time</label><input required type="text" value={newMeal.preparationTime} onChange={e => setNewMeal({...newMeal, preparationTime: e.target.value})} className="w-full bg-matte border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-orange outline-none" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-400 mb-1.5">Tags (Comma separated)</label><input type="text" value={newMeal.tags} onChange={e => setNewMeal({...newMeal, tags: e.target.value})} className="w-full bg-matte border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-orange outline-none" /></div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Available Add-ons</label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableAddOns.map(addon => (
                        <label key={addon.name} className="flex items-center gap-2 text-sm text-gray-300 bg-matte p-2 rounded-lg border border-white/10 cursor-pointer hover:border-brand-orange/50 transition-colors">
                          <input type="checkbox" className="accent-brand-orange" checked={selectedAddOns.some(a => a.name === addon.name)} onChange={(e) => { if (e.target.checked) setSelectedAddOns([...selectedAddOns, addon]); else setSelectedAddOns(selectedAddOns.filter(a => a.name !== addon.name)); }} />
                          {addon.name} <span className="text-[10px] text-gray-500">(+₦{addon.price})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </form>
              </div>
              <div className="p-6 bg-matte border-t border-white/10 mt-auto"><button form="add-meal-form" type="submit" disabled={isSubmitting} className="w-full py-4 rounded-xl bg-brand-orange text-white font-bold">{isSubmitting ? 'Processing...' : isEditMode ? 'Save Changes' : 'Publish Meal'}</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CUSTOMER INSIGHT MODAL --- */}
      <AnimatePresence>
        {customerInsight && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCustomerInsight(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-charcoal border border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh]">
              
              <div className="p-6 border-b border-white/10 flex justify-between items-start bg-matte/50">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-white">{customerInsight.name}</h2>
                  <p className="text-brand-orange font-mono text-xs mt-1">{customerInsight.phone}</p>
                </div>
                <button onClick={() => setCustomerInsight(null)} className="p-2 rounded-full bg-white/5 hover:bg-white/10"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 grid grid-cols-2 gap-4 border-b border-white/10 bg-charcoal">
                <div className="bg-matte p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-white">{customerInsight.orderCount}</p>
                </div>
                <div className="bg-matte p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Lifetime Value</p>
                  <p className="text-xl font-bold text-brand-orange">₦{customerInsight.totalSpent.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-charcoal">
                <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">Recent Order History</h3>
                <div className="space-y-3">
                  {customerInsight.recentOrders.map((order, idx) => (
                    <div key={idx} className="p-3 bg-matte border border-white/5 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-white">{order.time}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{order.status.replace('_', ' ')}</p>
                      </div>
                      <span className="font-bold text-brand-orange text-sm">₦{order.pricing.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarButton({ icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${active ? 'bg-brand-orange/10 text-brand-orange font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
      <div className="flex items-center gap-3">{React.cloneElement(icon, { className: 'w-5 h-5' })}<span>{label}</span></div>
      {badge > 0 && <span className="bg-brand-orange text-white text-xs font-bold px-2 py-0.5 rounded-full">{badge}</span>}
    </button>
  );
}

function StatCard({ icon, title, value, trend, good }) {
  return (
    <div className="bg-matte p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-brand-orange/30 transition-colors">
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">{React.cloneElement(icon, { className: 'w-16 h-16' })}</div>
      <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
      <span className={`text-xs font-medium px-2 py-1 rounded-md ${good || trend.startsWith('+') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{trend}</span>
    </div>
  );
}

function OrderColumn({ title, count, children }) {
  return (
    <div className="bg-matte/50 rounded-2xl border border-white/5 p-4 flex flex-col h-[calc(100vh-140px)]">
      <div className="flex justify-between items-center mb-4 px-2"><h3 className="font-bold text-gray-300">{title}</h3><span className="bg-white/10 text-gray-300 text-xs font-bold px-2.5 py-1 rounded-full">{count}</span></div>
      <div className="flex-1 overflow-y-auto space-y-4 hide-scrollbar">{children}</div>
    </div>
  );
}

function OrderCard({ order, onAccept, onReject, onAction, actionLabel, onOpenInsight }) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-charcoal p-4 rounded-xl border border-white/10 shadow-lg hover:border-brand-orange/50 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div><h4 className="font-bold text-white text-sm">{order._id.substring(order._id.length - 6).toUpperCase()}</h4><p className="text-xs text-gray-500">{order.time}</p></div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${order.payment.status === 'Paid' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'}`}>{order.payment.method}</span>
      </div>
      <div className="mb-4">
        {/* Clickable Customer Name */}
        <button 
          onClick={() => onOpenInsight(order.customer.phone)} 
          className="text-sm font-bold text-brand-orange hover:text-white transition-colors flex items-center gap-1 text-left"
        >
          {order.customer.name}
        </button>
        <p className="text-xs text-gray-400 mt-1">{order.customer.phone} • {order.customer.address}</p>
        <div className="mt-3 pt-3 border-t border-white/5">{order.items.map((item, i) => (<p key={i} className="text-xs text-gray-300 mb-1"><span className="text-brand-orange font-bold mr-1">{item.quantity}x</span> {item.menuItem?.name || 'Meal Item'}</p>))}</div>
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-white/10">
        <span className="font-bold text-brand-orange">₦{order.pricing.total.toLocaleString()}</span>
        {order.status === 'Pending' ? (
          <div className="flex gap-2"><button onClick={onReject} className="p-1.5 bg-red-500/10 text-red-500 rounded-md"><XCircle className="w-5 h-5" /></button><button onClick={onAccept} className="p-1.5 bg-green-500/10 text-green-500 rounded-md"><CheckCircle2 className="w-5 h-5" /></button></div>
        ) : (
          <button onClick={onAction} className="px-3 py-1.5 bg-white/5 border border-white/10 text-xs font-medium rounded-md flex items-center gap-2">{actionLabel} <ChevronRight className="w-3 h-3" /></button>
        )}
      </div>
    </motion.div>
  );
}