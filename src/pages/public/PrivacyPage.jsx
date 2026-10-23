import React from 'react';
import { ShieldCheck, Mail } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const PrivacyPage = ({ language: propLanguage }) => {
  const { language: contextLanguage } = useAppContext();
  const activeLanguage = propLanguage || contextLanguage || 'ar';
  const isRtl = activeLanguage === 'ar';

  const sections = isRtl
    ? [
        {
          title: '1. المعلومات التي نجمعها',
          body: 'نقوم بجمع المعلومات التي تقدمها لنا مباشرة مثل الاسم والبريد الإلكتروني وتفاصيل الحجز، كما نجمع بيانات تقنية أساسية مثل نوع الجهاز والمتصفح.'
        },
        {
          title: '2. كيفية استخدام البيانات',
          body: 'نستخدم بياناتك لمعالجة الحجوزات، التواصل بشأن الطلبات، تحسين تجربة الاستخدام، وتقديم دعم أفضل لكل من الضيوف والمضيفين.'
        },
        {
          title: '3. مشاركة البيانات',
          body: 'لا نقوم ببيع بياناتك. قد تتم مشاركة جزء محدود من المعلومات مع مزودي الخدمة أو الجهات القانونية عند الحاجة وفق القانون.'
        },
        {
          title: '4. حماية البيانات',
          body: 'نطبق إجراءات تقنية وتنظيمية لحماية بياناتك من الوصول غير المصرح به أو التعديل أو الفقدان.'
        },
        {
          title: '5. حقوقك',
          body: 'يمكنك طلب الاطلاع على بياناتك أو تعديلها أو حذفها، كما يمكنك الاعتراض على بعض أنواع المعالجة وفق القوانين المعمول بها.'
        },
        {
          title: '6. التواصل',
          body: 'لأي استفسار متعلق بالخصوصية، يمكنك مراسلتنا عبر البريد الإلكتروني المباشر:'
        }
      ]
    : [
        {
          title: '1. Information We Collect',
          body: 'We collect information you provide directly, such as name, email, and booking details. We also collect basic technical data like device and browser type.'
        },
        {
          title: '2. How We Use Your Data',
          body: 'Your data is used to process bookings, communicate about requests, improve user experience, and provide better support for guests and hosts.'
        },
        {
          title: '3. Data Sharing',
          body: 'We do not sell your data. Limited information may be shared with service providers or legal authorities when required by law.'
        },
        {
          title: '4. Data Protection',
          body: 'We apply technical and organizational safeguards to protect data against unauthorized access, alteration, or loss.'
        },
        {
          title: '5. Your Rights',
          body: 'You may request access, correction, or deletion of your data, and object to certain processing activities.'
        },
        {
          title: '6. Contact',
          body: 'For privacy-related questions, contact us at:'
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
                <ShieldCheck size={28} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isRtl ? 'سياسة الخصوصية' : 'Privacy Policy'}
              </h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isRtl ? 'آخر تحديث: 3 مايو 2026' : 'Last updated: May 3, 2026'}
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-4">
          {sections.map((section, i) => (
            <section 
              key={i} 
              className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm transition hover:border-gray-200 dark:hover:border-gray-700"
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{section.title}</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                {section.body}
              </p>
              
              {/* Special link for the contact section */}
              {i === sections.length - 1 && (
                <a
                  href="mailto:support@mydar.ma"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#2DB4A0] hover:underline"
                >
                  <Mail size={16} />
                  support@mydar.ma
                </a>
              )}
            </section>
          ))}
        </div>

      </div>
    </div>
  );
};

export default PrivacyPage;