import React from 'react';
import { FileText, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const TermsPage = ({ language: propLanguage }) => {
  const { language: contextLanguage } = useAppContext();
  const activeLanguage = propLanguage || contextLanguage || 'ar';
  const isRtl = activeLanguage === 'ar';

  const sections = isRtl
    ? [
        {
          title: '1. قبول الشروط',
          body: 'باستخدامك لمنصة MyDar فإنك توافق على هذه الشروط وتتعهد باستعمال المنصة بشكل قانوني ومسؤول.'
        },
        {
          title: '2. الحسابات',
          body: 'المستخدم مسؤول عن صحة معلومات الحساب وحماية بيانات تسجيل الدخول. يحق لنا تعليق الحسابات في حالة إساءة الاستخدام.'
        },
        {
          title: '3. الحجوزات والمدفوعات',
          body: 'الأسعار وسياسات الإلغاء يحددها المضيفون وقد تختلف من إعلان لآخر. يصبح الحجز مؤكداً بعد إتمام عملية التأكيد.'
        },
        {
          title: '4. سلوك المستخدم',
          body: 'يُمنع نشر محتوى مسيء أو مضلل أو استخدام المنصة لأي نشاط غير قانوني أو احتيالي.'
        },
        {
          title: '5. المسؤولية',
          body: 'نسعى لتقديم خدمة مستقرة، لكن MyDar غير مسؤول عن الأضرار غير المباشرة الناتجة عن ظروف خارجة عن نطاقنا.'
        },
        {
          title: '6. التعديلات',
          body: 'قد نقوم بتحديث هذه الشروط عند الحاجة. استمرارك في استخدام المنصة بعد التحديث يعني موافقتك على النسخة الجديدة.'
        }
      ]
    : [
        {
          title: '1. Acceptance of Terms',
          body: 'By using MyDar, you agree to these terms and to use the platform lawfully and responsibly.'
        },
        {
          title: '2. Accounts',
          body: 'Users are responsible for accurate account information and login security. We may suspend accounts in case of abuse.'
        },
        {
          title: '3. Bookings and Payments',
          body: 'Prices and cancellation policies are set by hosts and may vary. A booking becomes binding once confirmed.'
        },
        {
          title: '4. User Conduct',
          body: 'Posting abusive or misleading content and using the platform for illegal or fraudulent activities is prohibited.'
        },
        {
          title: '5. Liability',
          body: 'We aim to provide reliable service, but MyDar is not liable for indirect damages caused by events beyond our control.'
        },
        {
          title: '6. Changes',
          body: 'We may update these terms when needed. Continued use after updates means you accept the revised version.'
        }
      ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 px-4 py-10 transition-colors" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-xl bg-[#2DB4A0]/10 p-2.5 text-[#2DB4A0]">
                <FileText size={28} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isRtl ? 'شروط الاستخدام' : 'Terms of Service'}
              </h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isRtl ? 'آخر تحديث: 3 مايو 2026' : 'Last updated: May 3, 2026'}
            </p>
          </div>
        </div>

        {/* Sections Grid */}
        <div className="space-y-4">
          {sections.map((section, i) => (
            <section
              key={i}
              className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-xs transition hover:border-gray-200 dark:hover:border-gray-700"
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{section.title}</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                {section.body}
              </p>
            </section>
          ))}
        </div>

      </div>
    </div>
  );
};

export default TermsPage;