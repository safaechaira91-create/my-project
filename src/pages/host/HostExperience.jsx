﻿import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Users, 
  CheckCircle, 
  Home, 
  DollarSign, 
  ChevronDown, 
  MessageCircle, 
  X, 
  Send, 
  Paperclip, 
  FileText 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import translations from '../../locales/i18n';

// Constants
const PRICE_PER_NIGHT = 600;
const HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80';
const AGENT_AVATAR_URL = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=64&q=80';

const AR_HOST_FALLBACK = {
  faqTitle: "الأسئلة الشائعة",
  faqSubtitle: "كل ما تحتاج معرفته عن الاستضافة فـ MyDar",
  q1: "واش التسجيل فـ MyDar فابور؟",
  a1: "إيه، التسجيل فابور 100%. كنخدو عمولة صغيرة غير من بعد الحجز المؤكد.",
  q2: "كيفاش كنحدد الثمن ديال الليلة؟",
  a2: "أنت اللي كتحكم فالثمن، وحنا كنعاونوك بتقديرات حسب السوق.",
  q3: "واش ضروري نكون فالدار فاش يوصلو الضيوف؟",
  a3: "ماشي ضروري. تقدر تستعمل الدخول الذاتي أو تكلف شي حد بالاستقبال.",
  q4: "شنو الشروط باش نحط داري فالموقع؟",
  a4: "خاص الدار تكون نقية ومجهزة وتحترم القوانين المحلية.",
  contactUs: "دردشة مباشرة",
  contactSubtitle: "عندك شي سؤال؟ هضر معانا دابا مباشرة.",
  chatTitle: "مساعد MyDar",
  chatWelcome: "مرحبا! أنا سلمى، كيفاش نقدر نعاونك اليوم بخصوص الاستضافة؟",
  chatInput: "اكتب رسالة...",
  agentStatus: "متصل الآن",
  agentName: "سلمى"
};

const HostExperience = ({ setIsLoginOpen, isLoggedIn, language = 'ar' }) => {
  const navigate = useNavigate();
  const isRtl = language === 'ar';

  // Merge translations cleanly
  const t = useMemo(() => {
    const raw = translations.host?.[language] || translations.host?.ar || {};
    return isRtl ? { ...AR_HOST_FALLBACK, ...raw } : raw;
  }, [language, isRtl]);

  // State
  const [nights, setNights] = useState(7);
  const [activeFaq, setActiveFaq] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Refs
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const timeoutRef = useRef(null);

  const estimatedEarnings = useMemo(() => (nights * PRICE_PER_NIGHT).toLocaleString(), [nights]);

  const faqs = useMemo(() => [
    { q: t.q1, a: t.a1 },
    { q: t.q2, a: t.a2 },
    { q: t.q3, a: t.a3 },
    { q: t.q4, a: t.a4 },
  ], [t]);

  // Handle Initial Welcome Message
  useEffect(() => {
    if (isContactModalOpen && messages.length === 0) {
      setMessages([{ id: Date.now(), text: t.chatWelcome, sender: 'agent', time: new Date(), type: 'text' }]);
    }
  }, [isContactModalOpen, t.chatWelcome, messages.length]);

  // Auto Scroll Chat to Bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  // Cleanup Timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleStartNow = useCallback(() => {
    if (!isLoggedIn) {
      setIsLoginOpen(true);
    } else {
      navigate('/host/setup');
    }
  }, [isLoggedIn, setIsLoginOpen, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const fileMsg = { 
        id: Date.now(),
        type: file.type.startsWith('image/') ? 'image' : 'file',
        fileUrl: reader.result,
        fileName: file.name,
        sender: 'user', 
        time: new Date() 
      };
      setMessages(prev => [...prev, fileMsg]);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const cleanInput = inputValue.trim();
    if (!cleanInput) return;

    const userMsg = { id: Date.now(), text: cleanInput, sender: 'user', time: new Date(), type: 'text' };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      const agentReply = { 
        id: Date.now(),
        text: isRtl 
          ? "شكراً على رسالتك! غادي نربطوك بواحد من الخبراء ديالنا باش يجاوب على الطلب ديالك." 
          : "Thanks for your message! Connecting you to one of our experts to assist with your request.", 
        sender: 'agent', 
        time: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, agentReply]);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-airbnb-dark" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="relative h-auto md:h-[90vh] min-h-150 md:min-h-175 flex items-center overflow-hidden py-12 md:py-0">
        <img 
          src={HERO_IMAGE_URL} 
          className="absolute inset-0 w-full h-full object-cover" 
          alt="Modern Moroccan House"
          loading="eager"
        />
        <div className="absolute inset-0 bg-black/10 md:bg-transparent md:bg-linear-to-l md:from-black/40 md:to-transparent" />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex justify-start">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-8 md:p-12 rounded-4xl shadow-2xl max-w-lg w-full text-center md:text-right border border-gray-100" 
          >
            <h1 className="text-2xl md:text-4xl font-bold mb-2">أجر منزلك على MyDar</h1>
            <div className="text-primary-green text-4xl sm:text-5xl md:text-6xl font-extrabold my-4 md:my-6">
              {estimatedEarnings} MAD
              <span className="text-base md:text-lg text-gray-500 block font-medium mt-1">تقدير لما يمكن أن تكسبه شهرياً</span>
            </div>
            <button 
              onClick={handleStartNow}
              className="w-full bg-primary-green hover:bg-[#258873] text-white py-4 rounded-xl text-xl font-bold transition-all shadow-lg hover:shadow-primary-green/20 active:scale-95 cursor-pointer"
            >
              ابدأ الآن
            </button>
          </motion.div>
        </div>
      </section>

      {/* Interactive Estimator Section */}
      <section id="estimator-section" className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">شحال تقدر تصور مع MyDar؟</h2>
            <p className="text-gray-500 text-xl font-medium">تقدير الأرباح بناءً على موقع دارك ونوع السكن</p>
          </motion.div>

          <div className="max-w-4xl mx-auto bg-gray-50 p-6 sm:p-10 md:p-16 rounded-4xl md:rounded-[48px] border border-gray-100">
            <div className="flex flex-col items-center gap-8 md:gap-12">
              <div className="text-center">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={nights}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-5xl sm:text-7xl md:text-9xl font-extrabold text-primary-green"
                  >
                    {estimatedEarnings} MAD
                  </motion.div>
                </AnimatePresence>
                <div className="text-lg sm:text-2xl font-bold mt-2 md:mt-4 text-gray-800">
                  تقدير الدخل الشهري في الرباط (لمدة {nights} {nights === 1 ? 'ليلة' : 'ليالٍ'})
                </div>
              </div>

              <div className="w-full max-w-2xl px-2">
                <input 
                  type="range" 
                  min="1" 
                  max="30" 
                  value={nights} 
                  onChange={(e) => setNights(Number(e.target.value))} 
                  aria-label="عدد الليالي"
                  className="w-full h-2.5 md:h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary-green"
                />
                <div className="flex justify-between mt-4 md:mt-6 text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-widest">
                  <span>ليلة واحدة</span>
                  <span>30 ليلة</span>
                </div>
              </div>

              <p className="text-gray-400 text-sm italic max-w-md text-center leading-relaxed">
                هذه مجرد تقديرات تعتمد على أسعار السوق الحالية في الرباط.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Step-by-Step Guide Section */}
      <section className="py-24 md:py-32 bg-white border-t border-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">كيفاش تبدا الاستضافة</h2>
            <p className="text-gray-500 text-xl">خطوات سهلة باش تحط دارك فـ MyDar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-primary-green/10 text-primary-green rounded-full flex items-center justify-center mb-8 transition-transform group-hover:scale-110">
                <Home size={36} /> 
              </div>
              <h3 className="text-2xl font-bold mb-4">المرحلة 1: وصف دارك</h3>
              <p className="text-gray-500 text-lg">عطينا معلومات على الموقع وفين جات الدار بالتحديد.</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-primary-green/10 text-primary-green rounded-full flex items-center justify-center mb-8 transition-transform group-hover:scale-110">
                <DollarSign size={36} /> 
              </div>
              <h3 className="text-2xl font-bold mb-4">المرحلة 2: حدد الثمن</h3>
              <p className="text-gray-500 text-lg">أنت اللي كتحكم فالثمن، وحنا كنعاونوك بتقديرات حسب السوق.</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-primary-green/10 text-primary-green rounded-full flex items-center justify-center mb-8 transition-transform group-hover:scale-110">
                <Users size={36} /> 
              </div>
              <h3 className="text-2xl font-bold mb-4">المرحلة 3: استقبل الضيوف</h3>
              <p className="text-gray-500 text-lg">تواصل مع الضيوف وحنا معاك فكل خطوة باش تضمن نجاحك.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          > 
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-4 text-primary-green">
              MyDar<span className="text-black">Cover</span>
            </h2>
            <p className="text-2xl font-bold text-gray-800">حماية شاملة لكل مضيف فـ MyDar</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'حماية من الأضرار', desc: 'كنغطيو بزاف ديال الحالات اللي تقدر توقع لدارك أو ممتلكاتك.' }, 
              { title: 'دعم فني 24/7', desc: 'فريقنا موجود باش يجاوب على تساؤلاتك فكل وقت.' },
              { title: 'التحقق من الضيوف', desc: 'كنتأكدو من هوية كل واحد كيحجز عندك لضمان أمانك.' }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group"
              > 
                <div className="bg-primary-green/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-primary-green group-hover:bg-primary-green group-hover:text-white transition-colors">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed text-lg">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="mb-16 text-center md:text-right">
            <h2 className="text-4xl font-bold mb-4">{t.faqTitle}</h2>
            <p className="text-gray-500 text-lg">{t.faqSubtitle}</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="border-b border-gray-200 pb-4">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="w-full flex justify-between items-center py-4 text-right hover:text-primary-green transition-colors focus:outline-none cursor-pointer"
                  > 
                    <span className="text-xl font-medium">{faq.q}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown size={24} className="text-gray-400" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="pb-4 text-gray-600 text-lg leading-relaxed">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Contact Support Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 p-8 rounded-4xl bg-gray-50 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <h3 className="text-2xl font-bold mb-2">{t.contactUs}</h3>
              <p className="text-gray-500 font-medium">{t.contactSubtitle}</p>
            </div>
            <button 
              onClick={() => setIsContactModalOpen(true)}
              className="flex items-center gap-3 bg-primary-green text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#258873] transition active:scale-95 shadow-lg cursor-pointer" 
            >
              <MessageCircle size={20} />
              {t.contactUs}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Quick Contact Modal */}
      <AnimatePresence>
        {isContactModalOpen && (
          <div className="fixed inset-0 z-300 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContactModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-4xl shadow-2xl overflow-hidden z-10"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {/* Chat Header */}
              <div className="p-4 bg-primary-green text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={AGENT_AVATAR_URL} 
                      className="w-10 h-10 rounded-full object-cover border-2 border-green-500" 
                      alt="Agent Avatar" 
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-primary-green rounded-full" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{t.chatTitle}</h3>
                    <p className="text-[10px] text-white/70 font-medium">{t.agentStatus}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsContactModalOpen(false)} 
                  aria-label="إغلاق الدردشة"
                  className="p-2 text-white hover:bg-white/20 rounded-full transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className="h-100 overflow-y-auto p-6 bg-gray-50 space-y-4 no-scrollbar">
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`} 
                  >
                    <div className={`max-w-[80%] ${msg.type === 'image' ? 'p-1' : 'p-4'} rounded-2xl text-sm shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-primary-green text-white rounded-br-none' 
                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                    }`}>
                      {msg.type === 'image' ? (
                        <img src={msg.fileUrl} alt="Attachment" className="rounded-xl max-h-60 w-full object-cover" />
                      ) : msg.type === 'file' ? (
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${msg.sender === 'user' ? 'bg-white/20' : 'bg-gray-100'}`}>
                            <FileText size={20} />
                          </div>
                          <span className="font-medium underline truncate max-w-37.5">{msg.fileName}</span>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="إرفاق ملف"
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition cursor-pointer"
                >
                  <Paperclip size={20} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*,.pdf" 
                />
                <input 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={t.chatInput}
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-green text-sm"
                />
                <button 
                  type="submit" 
                  aria-label="إرسال"
                  className="p-3 bg-primary-green text-white rounded-xl hover:bg-[#258873] transition active:scale-95 shadow-md shadow-primary-green/20 cursor-pointer"
                >
                  <Send size={18} /> 
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Final CTA Section */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="bg-white p-12 md:p-24 rounded-[48px] shadow-sm border border-gray-200">
            <h2 className="text-4xl md:text-6xl font-extrabold mb-8 text-gray-900 leading-tight">واش واجد تبدا الاستضافة؟</h2>
            <p className="text-xl md:text-2xl text-gray-500 mb-12 max-w-2xl mx-auto font-medium">
              انضم لمجتمعنا ديال المضيفين فالمغرب وابدا دخل فلوس من دارك اليوم.
            </p>
            <button 
              onClick={handleStartNow}
              className="bg-primary-green hover:bg-[#258873] text-white px-16 py-6 rounded-2xl text-2xl font-bold transition shadow-2xl transform hover:scale-105 active:scale-95 cursor-pointer shadow-primary-green/20"
            > 
              ابدأ الآن
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HostExperience;