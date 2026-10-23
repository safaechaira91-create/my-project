﻿﻿import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Search, Globe, Menu, User, LogOut, Building2, Trees, Waves, 
  ShieldCheck, LifeBuoy, LayoutDashboard, CalendarDays, Heart, 
  MessageSquare, Bell, Sparkles, PlusSquare, Settings, ChevronRight, 
  X, BarChart3, Users 
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

const destinationsByLanguage = {
  ar: [
    { city: 'مراكش، المغرب', desc: 'وجهة تتميز بالمعالم السياحية مثل حديقة ماجوريل', icon: Building2, tone: 'text-blue-700 bg-blue-50' },
    { city: 'كازابلانكا، المغرب', desc: 'وجهة مناسبة لقضاء رحلة خارج البلاد', icon: Trees, tone: 'text-amber-700 bg-amber-50' },
    { city: 'أكادير، المغرب', desc: 'وجهة رائعة قرب الشاطئ', icon: Waves, tone: 'text-rose-600 bg-rose-50' },
    { city: 'طنجة، المغرب', desc: 'وجهة رائعة لقضاء عطلات الصيف', icon: Waves, tone: 'text-sky-700 bg-sky-50' },
    { city: 'الرباط، المغرب', desc: 'وجهة مناسبة لقضاء رحلة خارج البلاد', icon: Trees, tone: 'text-amber-700 bg-amber-50' }
  ],
  en: [
    { city: 'Marrakech, Morocco', desc: 'A destination known for landmarks like Majorelle Garden', icon: Building2, tone: 'text-blue-700 bg-blue-50' },
    { city: 'Casablanca, Morocco', desc: 'A great choice for a city break', icon: Trees, tone: 'text-amber-700 bg-amber-50' },
    { city: 'Agadir, Morocco', desc: 'A lovely destination near the beach', icon: Waves, tone: 'text-rose-600 bg-rose-50' },
    { city: 'Tangier, Morocco', desc: 'Perfect for summer holidays', icon: Waves, tone: 'text-sky-700 bg-sky-50' },
    { city: 'Rabat, Morocco', desc: 'A balanced destination for work and leisure', icon: Trees, tone: 'text-amber-700 bg-amber-50' }
  ]
};

const languageOptions = [
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' }
];

const currencyOptions = [
  { code: 'MAD', symbol: 'DH', name: 'Moroccan Dirham' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' }
];

const menuAnimation = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
};

const getMobileMenuAnimation = (isRtl) => ({
  hidden: { x: isRtl ? '100%' : '-100%' },
  visible: { x: 0, transition: { duration: 0.25, ease: 'easeInOut' } },
  exit: { x: isRtl ? '100%' : '-100%', transition: { duration: 0.2 } },
});

const Navbar = () => {
  const { language, setLanguage, currency, setCurrency, unreadCount } = useAppContext();
  const { user, logout } = useAuth();
  const { t, isRtl } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === 'admin';
  const isHost = user?.role === 'host' || isAdmin;
  const isArabic = language === 'ar';

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState('where');
  const [isLocaleOpen, setIsLocaleOpen] = useState(false);
  const [activeLocaleTab, setActiveLocaleTab] = useState('language');

  const [where, setWhere] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [pets, setPets] = useState(0);

  const searchRef = useRef(null);
  const localeRef = useRef(null);
  const menuRef = useRef(null);

  const localizedDestinations = useMemo(
    () => destinationsByLanguage[language === 'ar' ? 'ar' : 'en'],
    [language]
  );

  const totalGuests = adults + children;

  const closeAllPopups = useCallback(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setIsLocaleOpen(false);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
        setActiveSearchField(null);
      }
      if (localeRef.current && !localeRef.current.contains(e.target)) {
        setIsLocaleOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeAllPopups();
    };

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [closeAllPopups]);

  useEffect(() => {
    closeAllPopups();
  }, [location.pathname, location.search, closeAllPopups]);

  const filteredDestinations = useMemo(() => {
    if (!where.trim()) return localizedDestinations;
    const q = where.trim().toLowerCase();
    return localizedDestinations.filter((d) => d.city.toLowerCase().includes(q));
  }, [where, localizedDestinations]);

  const handleSearch = useCallback(() => {
    const query = new URLSearchParams();
    if (where.trim()) query.set('q', where.trim());
    if (checkIn) query.set('checkin', checkIn);
    if (checkOut) query.set('checkout', checkOut);
    query.set('guests', String(totalGuests || 1));
    if (infants > 0) query.set('infants', String(infants));
    if (pets > 0) query.set('pets', String(pets));
    setIsSearchOpen(false);
    const qs = query.toString();
    navigate(qs ? `/listings?${qs}` : '/listings');
  }, [where, checkIn, checkOut, totalGuests, infants, pets, navigate]);

  const updateCounter = useCallback((setter, current, diff) => {
    setter(Math.max(0, current + diff));
  }, []);

  const displayName = user?.name || user?.fullName || user?.username || (isArabic ? 'ضيف MyDar' : 'MyDar Guest');
  const displayEmail = user?.email || (isArabic ? 'أكمل بيانات الحساب' : 'Complete your account details');
  const roleLabel = isAdmin ? (isArabic ? 'مدير' : 'Admin') : isHost ? (isArabic ? 'مضيف' : 'Host') : (isArabic ? 'مسافر' : 'Traveler');

  const menuSections = useMemo(() => {
    if (user) {
      const primaryMenuItems = [
        { to: '/my-bookings', label: isArabic ? 'حجوزاتي' : 'My bookings', icon: CalendarDays },
        { to: '/profile', label: isArabic ? 'المفضلة' : 'Wishlist', icon: Heart },
        { to: '/messages', label: isArabic ? 'الرسائل' : 'Messages', icon: MessageSquare },
        { to: '/notifications', label: isArabic ? 'الإشعارات' : 'Notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
      ];

      const hostMenuItems = isHost ? [
        { to: '/host-dashboard', label: isArabic ? 'لوحة التحكم' : 'Dashboard', icon: LayoutDashboard },
        { to: '/add-property', label: isArabic ? 'أضف عقارًا' : 'Add property', icon: PlusSquare },
        { to: '/listings?mine=1', label: isArabic ? 'عقاراتي' : 'My listings', icon: Building2 },
        { to: '/host-bookings', label: isArabic ? 'حجوزات المضيف' : 'Host Bookings', icon: CalendarDays },
      ] : [
        { to: '/host', label: isArabic ? 'كن مضيفًا' : 'Become a host', icon: Sparkles },
      ];

      const adminMenuItems = isAdmin ? [
        { to: '/admin', label: isArabic ? 'لوحة الإدارة' : 'Admin panel', icon: ShieldCheck },
        { to: '/admin/support-requests', label: isArabic ? 'طلبات الدعم' : 'Support requests', icon: LifeBuoy },
        { to: '/admin/users', label: isArabic ? 'إدارة المستخدمين' : 'Manage users', icon: Users },
        { to: '/admin/analytics', label: isArabic ? 'التحليلات' : 'Analytics', icon: BarChart3 },
      ] : [];

      const supportMenuItems = [
        { to: '/profile', label: isArabic ? 'الإعدادات' : 'Settings', icon: Settings },
        { to: '/help-center', label: isArabic ? 'مركز المساعدة' : 'Help center', icon: LifeBuoy },
      ];

      return [
        { key: 'primary', items: primaryMenuItems },
        { key: 'host', items: hostMenuItems },
        ...(isAdmin ? [{ key: 'admin', items: adminMenuItems }] : []),
        { key: 'support', items: supportMenuItems },
      ];
    }

    return [
      {
        key: 'auth',
        items: [
          { to: '/login', label: isArabic ? 'تسجيل الدخول' : 'Log in', icon: User },
          { to: '/register', label: isArabic ? 'إنشاء حساب' : 'Sign up', icon: Sparkles },
          { to: '/help-center', label: isArabic ? 'مركز المساعدة' : 'Help center', icon: LifeBuoy },
        ],
      },
    ];
  }, [user, isAdmin, isHost, isArabic, unreadCount]);

  const renderMenuLink = (item, mobile = false) => {
    const Icon = item.icon;
    return (
      <Link
        key={`${mobile}-${item.to}-${item.label}`}
        to={item.to}
        onClick={() => setIsMenuOpen(false)}
        className="group flex items-center justify-between rounded-2xl px-4 py-2 text-sm font-semibold text-gray-700 transition duration-200 hover:bg-[#2DB4A0]/10 hover:text-[#2DB4A0]"
      >
        <span className="flex items-center gap-3">
          <span className="relative rounded-xl bg-gray-100 p-2 text-gray-500 transition group-hover:bg-[#2DB4A0]/10 group-hover:text-[#2DB4A0]">
            <Icon size={18} />
            {item.badge && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f97316] px-1 text-[9px] font-bold text-white">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </span>
          {item.label}
        </span>
        <ChevronRight size={16} className={`text-gray-400 transition group-hover:text-[#2DB4A0] ${isRtl ? 'rotate-180' : ''}`} />
      </Link>
    );
  };

  return (
    <nav dir={isRtl ? 'rtl' : 'ltr'} className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white p-3 md:px-8 lg:px-12 md:py-4">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 md:relative md:flex-row md:items-center md:justify-between md:gap-0">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between w-full md:w-full">
          <Link to="/" className="flex items-center gap-2 outline-none md:z-10">
            <img src="/favicon.svg" alt="MyDar logo" className="h-8 w-8 sm:h-9 sm:w-9" />
            <span className="text-xl font-black tracking-tight sm:text-2xl">
              <span className="text-[#2DB4A0]">My</span><span className="text-[#f4742b]">Dar</span>
            </span>
          </Link>

          {/* Mobile Buttons */}
          <div className="flex items-center gap-1.5 md:hidden">
            <div ref={localeRef} className="relative">
              <button 
                type="button" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsLocaleOpen(!isLocaleOpen); 
                  setIsMenuOpen(false); 
                  setIsSearchOpen(false); 
                }} 
                className="rounded-full p-2 text-gray-700 hover:bg-gray-100"
              >
                <Globe size={20} />
              </button>
              {isLocaleOpen && (
                <div onClick={(e) => e.stopPropagation()} className="absolute top-full mt-2 z-50 bg-white shadow-2xl rounded-2xl border border-gray-100 p-2 w-48 inset-e-0">
                  <div className="mb-2 flex rounded-xl bg-gray-100 p-1">
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setActiveLocaleTab('language'); }} 
                      className={`flex-1 rounded-lg py-1 text-[11px] font-bold ${activeLocaleTab === 'language' ? 'bg-white shadow-sm text-[#2DB4A0]' : 'text-gray-600'}`}
                    >
                      {t('common.language')}
                    </button>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setActiveLocaleTab('currency'); }} 
                      className={`flex-1 rounded-lg py-1 text-[11px] font-bold ${activeLocaleTab === 'currency' ? 'bg-white shadow-sm text-[#2DB4A0]' : 'text-gray-600'}`}
                    >
                      {t('common.currency')}
                    </button>
                  </div>
                  <div className="space-y-0.5 max-h-55 overflow-y-auto">
                    {activeLocaleTab === 'language' ? (
                      languageOptions.map((item) => (
                        <button 
                          key={item.code} 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setLanguage(item.code); setIsLocaleOpen(false); }} 
                          className={`w-full rounded-xl px-3 py-1.5 text-xs font-bold hover:bg-gray-50 flex justify-between items-center ${language === item.code ? 'bg-[#2DB4A0]/10 text-[#2DB4A0]' : 'text-gray-700'}`}
                        >
                          {item.label}
                        </button>
                      ))
                    ) : (
                      currencyOptions.map((item) => (
                        <button 
                          key={item.code} 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setCurrency(item); setIsLocaleOpen(false); }} 
                          className={`w-full rounded-xl px-3 py-1.5 text-xs font-bold hover:bg-gray-50 flex justify-between items-center ${currency.code === item.code ? 'bg-[#2DB4A0]/10 text-[#2DB4A0]' : 'text-gray-700'}`}
                        >
                          <span className="text-gray-400 font-normal">{item.name}</span>
                          <span className="font-bold">{item.symbol}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              type="button" 
              onClick={(e) => { 
                e.stopPropagation(); 
                setIsMenuOpen(!isMenuOpen); 
                setIsLocaleOpen(false); 
                setIsSearchOpen(false); 
              }} 
              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2 py-1 hover:shadow-sm"
            >
              <div className="relative">
                <Menu size={18} className="text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#f97316]" />
                )}
              </div>
              <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-[#2DB4A0] text-white">
                {user?.image ? <img src={user.image} alt="avatar" className="h-full w-full object-cover" /> : <User size={14} fill="currentColor" />}
              </div>
            </button>
          </div>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-2 md:z-10">
            <div ref={localeRef} className="relative">
              <button 
                type="button" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsLocaleOpen(!isLocaleOpen); 
                  setIsMenuOpen(false); 
                  setIsSearchOpen(false); 
                }} 
                className="rounded-full p-2.5 transition hover:bg-gray-100 text-gray-700"
              >
                <Globe size={18} />
              </button>
              {isLocaleOpen && (
                <div onClick={(e) => e.stopPropagation()} className="absolute top-full inset-e-0 mt-2 z-50 bg-white shadow-2xl rounded-2xl border border-gray-100 p-2 w-52">
                  <div className="mb-2 flex rounded-xl bg-gray-100 p-1">
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setActiveLocaleTab('language'); }} 
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold ${activeLocaleTab === 'language' ? 'bg-white shadow-sm text-[#2DB4A0]' : 'text-gray-600'}`}
                    >
                      {t('common.language')}
                    </button>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setActiveLocaleTab('currency'); }} 
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold ${activeLocaleTab === 'currency' ? 'bg-white shadow-sm text-[#2DB4A0]' : 'text-gray-600'}`}
                    >
                      {t('common.currency')}
                    </button>
                  </div>
                  <div className="space-y-0.5 max-h-70 overflow-y-auto">
                    {activeLocaleTab === 'language' ? (
                      languageOptions.map((item) => (
                        <button 
                          key={item.code} 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setLanguage(item.code); setIsLocaleOpen(false); }} 
                          className={`w-full rounded-xl px-3 py-2 text-xs font-bold hover:bg-gray-50 flex justify-between items-center text-start ${language === item.code ? 'bg-[#2DB4A0]/10 text-[#2DB4A0]' : 'text-gray-700'}`}
                        >
                          {item.label}
                        </button>
                      ))
                    ) : (
                      currencyOptions.map((item) => (
                        <button 
                          key={item.code} 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setCurrency(item); setIsLocaleOpen(false); }} 
                          className={`w-full rounded-xl px-3 py-2 text-xs font-bold hover:bg-gray-50 flex justify-between items-center text-start ${currency.code === item.code ? 'bg-[#2DB4A0]/10 text-[#2DB4A0]' : 'text-gray-700'}`}
                        >
                          <span className="text-gray-400 font-normal">{item.name}</span>
                          <span className="font-bold">{item.symbol}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div ref={menuRef} className="relative">
              <button 
                type="button" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsMenuOpen(!isMenuOpen); 
                  setIsLocaleOpen(false); 
                  setIsSearchOpen(false); 
                }} 
                className={`flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 transition hover:shadow-md ${isMenuOpen ? 'shadow-md ring-2 ring-[#2DB4A0]/20' : ''}`}
              >
                <div className="relative">
                  <Menu size={18} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#f97316]" />
                  )}
                </div>
                <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#2DB4A0] text-white">
                  {user?.image ? <img src={user.image} alt="avatar" className="h-full w-full object-cover" /> : <User size={16} fill="currentColor" />}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div ref={searchRef} className="w-full md:w-120 lg:w-145 md:absolute md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 z-0">
          <div className="flex w-full flex-row items-center rounded-full border border-gray-200 bg-white p-1 shadow-sm transition-shadow hover:shadow-md">
            
            {/* Where Field */}
            <div className="flex-1 min-w-0 relative">
              <button 
                type="button" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsSearchOpen(true); 
                  setActiveSearchField('where'); 
                  setIsLocaleOpen(false); 
                  if (typeof window !== 'undefined' && window.innerWidth > 768) setIsMenuOpen(false); 
                }} 
                className={`w-full px-3 py-1.5 rounded-full transition text-start ${activeSearchField === 'where' && isSearchOpen ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
              >
                <p className="text-[10px] font-bold text-gray-800 truncate">{t('navbar.whereTitle')}</p>
                <p className="text-[11px] text-gray-500 truncate">{where || t('navbar.wherePlaceholder')}</p>
              </button>
              {isSearchOpen && activeSearchField === 'where' && (
                <div onClick={(e) => e.stopPropagation()} className="absolute z-50 w-[min(90vw,340px)] rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl top-full mt-2 inset-s-0">
                  <h3 className="mb-1 px-2 text-[11px] font-bold text-gray-400 text-start">{t('navbar.suggested')}</h3>
                  <div className="max-h-65 space-y-0.5 overflow-y-auto">
                    {filteredDestinations.map((d) => {
                      const Icon = d.icon;
                      return (
                        <button 
                          key={d.city} 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setWhere(d.city); setActiveSearchField('dates'); }} 
                          className="flex w-full items-center gap-2.5 rounded-xl p-2 transition hover:bg-gray-50 text-start"
                        >
                          <span className={`rounded-xl p-1.5 ${d.tone} shrink-0`}><Icon size={16} /></span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-900">{d.city}</p>
                            <p className="text-[10px] text-gray-400 truncate">{d.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-gray-200 shrink-0"></div>

            {/* Dates Field */}
            <div className="flex-1 min-w-0 relative">
              <button 
                type="button" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsSearchOpen(true); 
                  setActiveSearchField('dates'); 
                  setIsLocaleOpen(false); 
                  if (window.innerWidth > 768) setIsMenuOpen(false); 
                }} 
                className={`w-full px-3 py-1.5 rounded-full transition text-start ${activeSearchField === 'dates' && isSearchOpen ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
              >
                <p className="text-[10px] font-bold text-gray-800 truncate">{t('navbar.datesTitle')}</p>
                <p className="text-[11px] text-gray-500 truncate">{checkIn ? `${checkIn}` : t('navbar.datesPlaceholder')}</p>
              </button>
              {isSearchOpen && activeSearchField === 'dates' && (
                <div onClick={(e) => e.stopPropagation()} className="absolute z-50 w-[min(90vw,340px)] rounded-2xl border border-gray-100 bg-white p-3 shadow-2xl top-full mt-2 left-1/2 -translate-x-1/2">
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-0.5 text-start">{isRtl ? 'تاريخ الحضور' : 'Check-in'}</label>
                      <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full rounded-xl border border-gray-200 p-1.5 text-xs outline-none focus:border-[#2DB4A0]" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-0.5 text-start">{isRtl ? 'تاريخ الانصراف' : 'Check-out'}</label>
                      <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full rounded-xl border border-gray-200 p-1.5 text-xs outline-none focus:border-[#2DB4A0]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-gray-200 shrink-0"></div>

            {/* Guests Field */}
            <div className="flex-1 min-w-0 relative flex items-center justify-between">
              <button 
                type="button" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsSearchOpen(true); 
                  setActiveSearchField('guests'); 
                  setIsLocaleOpen(false); 
                  if (window.innerWidth > 768) setIsMenuOpen(false); 
                }} 
                className={`w-full rounded-full py-1.5 px-3 transition text-start ${activeSearchField === 'guests' && isSearchOpen ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
              >
                <p className="text-[10px] font-bold text-gray-800 truncate">{t('navbar.whoTitle')}</p>
                <p className="text-[11px] text-gray-500 truncate">{totalGuests > 0 ? `${totalGuests} ${t('navbar.guestsLabel')}` : t('navbar.whoPlaceholder')}</p>
              </button>
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); handleSearch(); }} 
                className="bg-[#2DB4A0] text-white p-2 rounded-full hover:bg-[#259b8a] transition shrink-0 mx-1"
              >
                <Search size={13} />
              </button>

              {isSearchOpen && activeSearchField === 'guests' && (
                <div onClick={(e) => e.stopPropagation()} className="absolute z-50 w-[min(90vw,300px)] rounded-2xl border border-gray-100 bg-white p-3 shadow-2xl top-full mt-2 inset-e-0 max-h-72.5 overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-gray-50 py-2">
                    <div className="text-start">
                      <p className="text-xs font-bold text-gray-800">{t('navbar.adults')}</p>
                      <p className="text-[10px] text-gray-400">{t('navbar.adultsDesc')}</p>
                    </div>
                    <div className="flex items-center gap-2" dir="ltr">
                      <button type="button" onClick={(e) => { e.stopPropagation(); updateCounter(setAdults, adults, -1); }} className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs">-</button>
                      <span className="w-3 text-center text-xs font-bold">{adults}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); updateCounter(setAdults, adults, 1); }} className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs">+</button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-50 py-2">
                    <div className="text-start">
                      <p className="text-xs font-bold text-gray-800">{t('navbar.children')}</p>
                    </div>
                    <div className="flex items-center gap-2" dir="ltr">
                      <button type="button" onClick={(e) => { e.stopPropagation(); updateCounter(setChildren, children, -1); }} className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs">-</button>
                      <span className="w-3 text-center text-xs font-bold">{children}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); updateCounter(setChildren, children, 1); }} className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs">+</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dropdowns & Drawers */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Desktop Menu Dropdown */}
              <motion.div
                variants={menuAnimation} 
                initial="hidden" 
                animate="visible" 
                exit="exit"
                className="absolute top-full inset-e-0 mt-2 z-50 hidden w-[320px] rounded-3xl border border-gray-100 bg-white shadow-2xl md:block"
                style={{ overflow: 'visible' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="border-b border-gray-100 bg-linear-to-br from-[#f7fbf8] via-white to-[#eef8f1] p-4 rounded-t-3xl">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[#2DB4A0] text-white shrink-0">
                      {user?.image ? <img src={user.image} alt="avatar" className="h-full w-full object-cover" /> : <User size={22} fill="currentColor" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900">{displayName}</p>
                      <p className="truncate text-xs text-gray-500">{displayEmail}</p>
                      <span className="mt-2 inline-block rounded-full bg-[#2DB4A0]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#2DB4A0]">{roleLabel}</span>
                    </div>
                  </div>
                </div>
                <div className="max-h-[calc(100vh-160px)] overflow-y-auto p-2" style={{ scrollbarWidth: 'thin' }}>
                  {menuSections.map((section, index) => (
                    <div key={section.key} className={index > 0 ? 'mt-1.5 border-t border-gray-100 pt-1.5' : ''}>
                      {section.items.map((item) => renderMenuLink(item))}
                    </div>
                  ))}
                  {user && (
                    <button 
                      type="button" 
                      onClick={logout} 
                      className="mt-1.5 flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"
                    >
                      <span className="flex items-center gap-3">
                        <span className="rounded-xl bg-red-50 p-1.5"><LogOut size={16} /></span>
                        {isArabic ? 'تسجيل الخروج' : 'Logout'}
                      </span>
                      <ChevronRight size={16} className={`${isRtl ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Mobile Drawer Overlay Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 z-999998 bg-black/40 backdrop-blur-sm md:hidden"
              />

              {/* Mobile Drawer */}
              <motion.div
                variants={getMobileMenuAnimation(isRtl)} 
                initial="hidden" 
                animate="visible" 
                exit="exit"
                className="fixed inset-y-0 inset-e-0 z-999999 flex w-full max-w-75 flex-col bg-white shadow-2xl md:hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="border-b border-gray-100 bg-linear-to-br from-[#f7fbf8] p-4 flex items-center justify-between shrink-0">
                  <span className="text-sm font-black text-gray-900">{isArabic ? 'قائمة الحساب' : 'Account menu'}</span>
                  <button type="button" onClick={() => setIsMenuOpen(false)} className="rounded-full border p-1.5 text-gray-500"><X size={16} /></button>
                </div>
                <div className="p-4 bg-gray-50/50 border-b border-gray-100 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#2DB4A0] text-white shrink-0">
                      {user?.image ? <img src={user.image} alt="avatar" className="h-full w-full object-cover" /> : <User size={20} fill="currentColor" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900">{displayName}</p>
                      <p className="truncate text-xs text-gray-500">{displayEmail}</p>
                      <span className="mt-1 inline-block rounded-full bg-[#2DB4A0]/10 px-2 py-0.5 text-[10px] font-bold text-[#2DB4A0]">{roleLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: 'thin' }}>
                  {menuSections.map((section, index) => (
                    <div key={section.key} className={index > 0 ? 'mt-1.5 border-t border-gray-100 pt-1.5' : ''}>
                      {section.items.map((item) => renderMenuLink(item, true))}
                    </div>
                  ))}
                  {user && (
                    <button 
                      type="button" 
                      onClick={logout} 
                      className="mt-1.5 flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"
                    >
                      <span className="flex items-center gap-3">
                        <span className="rounded-xl bg-red-50 p-1.5"><LogOut size={16} /></span>
                        {isArabic ? 'تسجيل الخروج' : 'Logout'}
                      </span>
                      <ChevronRight size={16} className={`${isRtl ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </nav>
  );
};

export default Navbar;