﻿﻿import React, { useState } from 'react';
import { MessageCircleQuestion, Phone, Mail, ShieldCheck, Send, Loader2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation';

const HelpCenterPage = () => {
  const { t, isRtl } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: isRtl ? 'كيفاش نقدر نحجز دار فـ MyDar؟' : 'How can I book a home on MyDar?',
      a: isRtl ? 'تقدر تختار العقار اللي عجبك، تحدد التاريخ، وتضغط على زر "حجز". غادي تتواصل مع المضيف مباشرة.' : 'Select your desired home, pick dates, and click "Book". You can then contact the host directly.'
    },
    {
      q: isRtl ? 'واش إلغاء الحجز مجاني؟' : 'Is cancellation free?',
      a: isRtl ? 'سياسة الإلغاء كتختلف حسب المضيف. تقدر تشوف شروط الإلغاء المحددة فصفحة كل عقار.' : 'Cancellation policies vary by host. Check the specific cancellation policy listed on the property page.'
    },
    {
      q: isRtl ? 'كيفاش نقدر نرجع حسابي إلا نسيت كلمة السر؟' : 'How can I recover my account if I forgot my password?',
      a: isRtl ? 'ضغط على "نسيت كلمة السر" فصفحة الدخول وغادي نرسلو ليك رابط فـ البريد الإلكتروني لتغييرها.' : 'Click "Forgot Password" on the login page, and we will send a reset link to your email.'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({
        type: 'error',
        text: t('helpCenter.fillAllFields') || (isRtl ? 'المرجو تعبئة جميع الخانات.' : 'Please fill all fields.'),
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setStatus({
        type: 'error',
        text: t('helpCenter.invalidEmail') || (isRtl ? 'المرجو إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.'),
      });
      return;
    }

    if (form.message.trim().length > 3000) {
      setStatus({
        type: 'error',
        text: isRtl ? 'الرسالة طويلة جداً (الحد الأقصى 3000 حرف).' : 'Message is too long (max 3000 characters).',
      });
      return;
    }

    setIsSending(true);
    setStatus({ type: '', text: '' });

    try {
      await api.post('/support-requests', {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        language: isRtl ? 'ar' : 'en',
      });

      setForm({ name: '', email: '', message: '' });
      setStatus({
        type: 'success',
        text: t('helpCenter.sendSuccess') || (isRtl ? 'تم إرسال طلبك بنجاح. سنتواصل معك قريبًا.' : 'Your request was sent successfully.'),
      });
    } catch (error) {
      console.error('Support request error:', error);
      setStatus({
        type: 'error',
        text: error?.response?.data?.message || t('helpCenter.sendError') || (isRtl ? 'حدث خطأ أثناء الإرسال، يُرجى المحاولة مرة أخرى.' : 'Something went wrong. Please try again.'),
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 px-4 py-10 transition-colors" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          {t('helpCenter.title') || (isRtl ? 'مركز المساعدة' : 'Help Center')}
        </h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          {t('helpCenter.subtitle') || (isRtl ? 'كيف يمكننا مساعدتك اليوم؟' : 'How can we help you today?')}
        </p>

        {/* Support Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Phone Card */}
          <a 
            href="tel:+212600000000" 
            className="group rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:border-[#2DB4A0]/50 transition cursor-pointer"
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-xl bg-[#2DB4A0]/10 p-2.5 text-[#2DB4A0] group-hover:bg-[#2DB4A0] group-hover:text-white transition-colors">
                <Phone size={22} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('helpCenter.phoneTitle') || (isRtl ? 'الدعم الهاتفي' : 'Phone Support')}
              </h3>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400" dir="ltr">
              +212 6 00 00 00 00
            </p>
          </a>

          {/* Email Card */}
          <a 
            href="mailto:support@mydar.ma" 
            className="group rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:border-[#2DB4A0]/50 transition cursor-pointer"
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-xl bg-[#2DB4A0]/10 p-2.5 text-[#2DB4A0] group-hover:bg-[#2DB4A0] group-hover:text-white transition-colors">
                <Mail size={22} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('helpCenter.emailTitle') || (isRtl ? 'البريد الإلكتروني' : 'Email')}
              </h3>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              support@mydar.ma
            </p>
          </a>

          {/* Safety Card */}
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm md:col-span-2">
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-xl bg-[#2DB4A0]/10 p-2.5 text-[#2DB4A0]">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('helpCenter.safetyTitle') || (isRtl ? 'الأمان والحماية' : 'Safety & Protection')}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('helpCenter.safetyDesc') || (isRtl ? 'معلومات حول الحماية، الإبلاغ، واسترجاع الحساب.' : 'Info about account safety and protection.')}
            </p>
          </div>
        </div>

        {/* Interactive FAQ Accordion */}
        <div className="mt-8 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-[#2DB4A0]/10 p-2.5 text-[#2DB4A0]">
              <MessageCircleQuestion size={22} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('helpCenter.faqTitle') || (isRtl ? 'الأسئلة الشائعة' : 'FAQ')}
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="rounded-2xl border border-gray-100 dark:border-gray-800/60 overflow-hidden bg-gray-50/50 dark:bg-gray-800/30">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-start font-semibold text-gray-900 dark:text-white hover:text-[#2DB4A0] transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Form */}
        <div className="mt-8 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8 shadow-sm">
          <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            {t('helpCenter.contactTitle') || (isRtl ? 'تواصل معنا' : 'Contact us')}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t('helpCenter.namePlaceholder') || (isRtl ? 'الاسم الكامل' : 'Full name')}
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3.5 text-gray-900 dark:text-white outline-none focus:border-[#2DB4A0] dark:focus:border-[#2DB4A0] transition"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder={t('helpCenter.emailPlaceholder') || (isRtl ? 'البريد الإلكتروني' : 'Email address')}
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3.5 text-gray-900 dark:text-white outline-none focus:border-[#2DB4A0] dark:focus:border-[#2DB4A0] transition"
            />
            <textarea
              rows="4"
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              maxLength={3000}
              placeholder={t('helpCenter.messagePlaceholder') || (isRtl ? 'اكتب رسالتك هنا...' : 'Write your message...')}
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3.5 text-gray-900 dark:text-white outline-none focus:border-[#2DB4A0] dark:focus:border-[#2DB4A0] transition"
            />
            <button
              type="submit"
              disabled={isSending}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#2DB4A0] px-6 py-3.5 font-bold text-white shadow-lg shadow-[#2DB4A0]/20 transition hover:bg-[#249181] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
            >
              {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {isSending
                ? t('helpCenter.sending') || (isRtl ? 'جاري الإرسال...' : 'Sending...')
                : t('helpCenter.send') || (isRtl ? 'إرسال' : 'Send')}
            </button>
          </form>

          {status.text && (
            <div
              className={`mt-4 rounded-2xl border p-4 text-sm font-semibold ${
                status.type === 'success'
                  ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                  : 'border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
              }`}
            >
              {status.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;