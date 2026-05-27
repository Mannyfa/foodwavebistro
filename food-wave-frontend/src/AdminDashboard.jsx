import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ListOrdered, UtensilsCrossed, Settings, 
  Clock, DollarSign, Plus, CheckCircle2, XCircle, Loader2, Bell, X, ImagePlus, ChevronRight, LogOut, Trash2, Shield
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('orders');
  
  // LIVE DATA STATES
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

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

  // AUTH GUARD
  const token = localStorage.getItem('adminToken');
  useEffect(() => {
    if (!token) window.location.href = '/admin/login';
  }, [token]);

  // ADD MEAL MODAL STATES
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [newMeal, setNewMeal] = useState({
    name: '', description: '', price: '', category: 'Rice Meals', preparationTime: '', tags: ''
  });

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
    if (!imageFile) { alert("Please select an image file first."); return; }
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('name', newMeal.name);
    formData.append('description', newMeal.description);
    formData.append('price', newMeal.price);
    formData.append('category', newMeal.category);
    formData.append('preparationTime', newMeal.preparationTime);
    formData.append('tags', newMeal.tags);
    formData.append('image', imageFile);
    formData.append('addOns', JSON.stringify(selectedAddOns));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/menu`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setMenuItems([data.data, ...menuItems]);
        setNewMeal({ name: '', description: '', price: '', category: 'Rice Meals', preparationTime: '', tags: '' });
        setSelectedAddOns([]);
        setImageFile(null);
        setImagePreview(null);
        setIsAddMealOpen(false);
      } else { alert(`Error: ${data.message}`); }
    } catch (error) { alert("Network error. Is your backend running?"); } 
    finally { setIsSubmitting(false); }
  };

  // --- UPDATE CREDENTIALS LOGIC ---
  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!settingsData.currentPassword) {
      return alert("Current password is required to make changes.");
    }
    if (settingsData.newPassword && settingsData.newPassword !== settingsData.confirmPassword) {
      return alert("New passwords do not match.");
    }

    setIsUpdatingSettings(true);

    try {
      // You will need to create this route on your backend
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
        handleLogout(); // Force logout so they use the new credentials
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

  if (!token) return null; 

  return (
    <div className="min-h-screen bg-charcoal text-brand-cream flex font-sans">
      <aside className="w-64 bg-matte border-r border-white/5 flex flex-col hidden md:flex z-10">
        <div className="p-6 border-b border-white/5">
          <div className="text-xl font-bold tracking-tighter">Food Wave <span className="text-brand-orange">Admin.</span></div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <SidebarButton icon={<LayoutDashboard />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SidebarButton icon={<ListOrdered />} label="Live Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} badge={orders.filter(o => o.status === 'Pending').length} />
          <SidebarButton icon={<UtensilsCrossed />} label="Menu Manager" active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
          {/* NEW SETTINGS TAB */}
          <SidebarButton icon={<Settings />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>
        <div onClick={handleLogout} className="p-4 border-t border-white/5 text-red-500 text-sm flex items-center gap-2 hover:bg-red-500/10 cursor-pointer transition-colors"><LogOut className="w-4 h-4" /> Secure Logout</div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 bg-charcoal/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 z-10">
          <h1 className="text-2xl font-bold capitalize">{activeTab.replace('-', ' ')}</h1>
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-orange to-brand-gold p-[2px]"><div className="w-full h-full bg-matte rounded-full flex items-center justify-center font-bold text-sm">AD</div></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative z-0">
          <AnimatePresence mode="wait">
            
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard icon={<DollarSign/>} title="Today's Revenue" value="₦145,500" trend="+12.5%" />
                  <StatCard icon={<ListOrdered/>} title="Active Orders" value={orders.length} trend="Live" good />
                  <StatCard icon={<Clock/>} title="Avg. Prep Time" value="22 mins" trend="-3 mins" good />
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
                        <OrderCard key={order._id} order={order} onAccept={() => updateOrderStatus(order._id, 'Preparing')} onReject={() => updateOrderStatus(order._id, 'Cancelled')} />
                      ))}
                    </OrderColumn>
                    <OrderColumn title="In Kitchen" count={orders.filter(o => o.status === 'Preparing').length}>
                      {orders.filter(o => o.status === 'Preparing').map(order => (
                        <OrderCard key={order._id} order={order} onAction={() => updateOrderStatus(order._id, 'Out_For_Delivery')} actionLabel="Mark as Dispatched" />
                      ))}
                    </OrderColumn>
                    <OrderColumn title="Dispatched" count={orders.filter(o => o.status === 'Out_For_Delivery').length}>
                      {orders.filter(o => o.status === 'Out_For_Delivery').map(order => (
                        <OrderCard key={order._id} order={order} onAction={() => updateOrderStatus(order._id, 'Completed')} actionLabel="Mark Completed" />
                      ))}
                    </OrderColumn>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'menu' && (
              <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-matte border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-charcoal/50">
                  <h3 className="text-lg font-bold">Menu Items</h3>
                  <button onClick={() => setIsAddMealOpen(true)} className="px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 transition-colors text-sm font-medium shadow-lg shadow-brand-orange/20"><Plus className="w-4 h-4" /> Add New Meal</button>
                </div>
                {isLoadingMenu ? <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-orange" /></div> : (
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-white/5 text-gray-400 text-sm"><th className="p-4 font-medium">Item Name</th><th className="p-4 font-medium">Category</th><th className="p-4 font-medium">Price</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Actions</th></tr></thead>
                    <tbody>
                      {menuItems.map(item => (
                        <tr key={item._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 font-medium flex items-center gap-3"><img src={item.image?.url || item.image} alt="" className="w-10 h-10 rounded-md object-cover border border-white/10" />{item.name}</td>
                          <td className="p-4 text-gray-400 text-sm">{item.category}</td>
                          <td className="p-4 text-brand-orange font-medium">₦{item.price?.toLocaleString()}</td>
                          <td className="p-4"><button onClick={() => toggleMenuAvailability(item._id, item.isAvailable)} className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold transition-colors ${item.isAvailable ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}>{item.isAvailable ? 'Available' : 'Sold Out'}</button></td>
                          <td className="p-4"><button onClick={() => deleteMenuItem(item._id)} className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </motion.div>
            )}

            {/* --- NEW SETTINGS TAB --- */}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl">
                <div className="bg-matte border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-white/5 bg-charcoal/50 flex items-center gap-3">
                    <Shield className="w-6 h-6 text-brand-orange" />
                    <h3 className="text-lg font-bold">Security & Credentials</h3>
                  </div>
                  
                  <div className="p-8">
                    <p className="text-sm text-gray-400 mb-8 font-light">Update your admin login credentials here. You must provide your current password to save any changes. If you successfully change your credentials, you will be logged out automatically.</p>
                    
                    <form id="settings-form" onSubmit={handleUpdateCredentials} className="space-y-6">
                      {/* Current Password (Required for security) */}
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
                      className="px-8 py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-lg font-bold flex items-center gap-2 transition-colors text-sm shadow-lg shadow-brand-orange/20 disabled:opacity-70"
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

      <AnimatePresence>
        {isAddMealOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddMealOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full sm:w-[500px] bg-charcoal border-l border-white/10 shadow-2xl flex flex-col h-full">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-matte/50"><h2 className="text-xl font-bold">Add New Meal</h2><button onClick={() => setIsAddMealOpen(false)} className="p-2 rounded-full bg-white/5 hover:bg-white/10"><X className="w-5 h-5" /></button></div>
              <div className="flex-1 overflow-y-auto p-6">
                <form id="add-meal-form" onSubmit={handleAddMealSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Meal Image</label>
                    <div className="relative group cursor-pointer">
                      <input required type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className={`h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors overflow-hidden ${imagePreview ? 'border-brand-orange bg-matte' : 'border-white/20 bg-white/5 hover:border-brand-orange/50 hover:bg-white/10'}`}>
                        {imagePreview ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /> : <><ImagePlus className="w-8 h-8 text-gray-400 mb-2" /><span className="text-sm font-medium text-gray-400 group-hover:text-brand-orange transition-colors">Tap to browse your device</span></>}
                      </div>
                    </div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-400 mb-1.5">Meal Name</label><input required type="text" value={newMeal.name} onChange={e => setNewMeal({...newMeal, name: e.target.value})} className="w-full bg-matte border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-orange outline-none" /></div>
                  <div><label className="block text-sm font-medium text-gray-400 mb-1.5">Description</label><textarea required rows="2" value={newMeal.description} onChange={e => setNewMeal({...newMeal, description: e.target.value})} className="w-full bg-matte border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-orange outline-none resize-none" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-400 mb-1.5">Price (₦)</label><input required type="number" value={newMeal.price} onChange={e => setNewMeal({...newMeal, price: e.target.value})} className="w-full bg-matte border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-orange outline-none" /></div>
                    <div><label className="block text-sm font-medium text-gray-400 mb-1.5">Category</label><select value={newMeal.category} onChange={e => setNewMeal({...newMeal, category: e.target.value})} className="w-full bg-matte border border-white/10 rounded-xl px-4 py-3 text-white outline-none"><option>Rice Meals</option><option>Pasta</option><option>Grills</option><option>Small Chops</option><option>Drinks</option><option>Specials</option></select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-400 mb-1.5">Prep Time</label><input required type="text" value={newMeal.preparationTime} onChange={e => setNewMeal({...newMeal, preparationTime: e.target.value})} className="w-full bg-matte border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-orange outline-none" /></div>
                    <div><label className="block text-sm font-medium text-gray-400 mb-1.5">Tags (Comma separated)</label><input type="text" value={newMeal.tags} onChange={e => setNewMeal({...newMeal, tags: e.target.value})} className="w-full bg-matte border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-orange outline-none" /></div>
                  </div>
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
              <div className="p-6 bg-matte border-t border-white/10 mt-auto"><button form="add-meal-form" type="submit" disabled={isSubmitting} className="w-full py-4 rounded-xl bg-brand-orange text-white font-bold">{isSubmitting ? 'Uploading...' : 'Publish Meal'}</button></div>
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

function OrderCard({ order, onAccept, onReject, onAction, actionLabel }) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-charcoal p-4 rounded-xl border border-white/10 shadow-lg hover:border-brand-orange/50 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div><h4 className="font-bold text-white text-sm">{order._id.substring(order._id.length - 6).toUpperCase()}</h4><p className="text-xs text-gray-500">{order.time}</p></div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${order.payment.status === 'Paid' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'}`}>{order.payment.method}</span>
      </div>
      <div className="mb-4">
        <p className="text-sm font-medium">{order.customer.name}</p>
        <p className="text-xs text-gray-400 mt-1">{order.customer.address}</p>
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