import React from 'react';
import { Link } from 'react-router-dom';
import { Network, ExternalLink, ShieldCheck, Home, User, HelpCircle, FileText, Building2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const SitemapPage = ({ language: propLanguage }) => {
  const { language: contextLanguage } = useAppContext();
  const activeLanguage = propLanguage || contextLanguage || 'ar';
  const isRtl = activeLanguage === 'ar';

  const sections = [
    {
      categoryAr: 'الصفحات الرئيسية',
      categoryEn: 'Main Pages',
      links: [
        { to: '/', labelAr: 'الرئيسية', labelEn: 'Home', icon: Home },
        { to: '/help-center', labelAr: 'مركز المساعدة', labelEn: 'Help Center', icon: HelpCircle },
        { to: '/sitemap', labelAr: 'خريطة الموقع', labelEn: 'Sitemap', icon: Network },
      ]
    },
    {
      categoryAr: 'للمضيفين والشركاء',
      categoryEn: 'For Hosts & Partners',
      links: [
        { to: '/host', labelAr: 'أجر منزلك', labelEn: 'Host', icon: Building2 },
        { to: '/host/setup', labelAr: 'إعداد الإعلان', labelEn: 'List Property Setup', icon: Building2 },
      ]
    },
    {
      categoryAr: 'الحساب والسياسات',
      categoryEn: 'Account & Legal',
      links: [
        { to: '/profile', labelAr: 'الملف الشخصي', labelEn: 'Profile', icon: User },
        { to: '/privacy', labelAr: 'الخصوصية', labelEn: 'Privacy', icon: ShieldCheck },
        { to: '/terms', labelAr: 'الشروط والأحكام', labelEn: 'Terms', icon: FileText },
        { to: '/admin/support-requests', labelAr: 'طلبات الدعم (الإدارة)', labelEn: 'Support Requests (Admin)', icon: ShieldCheck },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 px-4 py-10 transition-colors" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-xl bg-[#2DB4A0]/10 p-2.5 text-[#2DB4A0]">
              <Network size={28} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isRtl ? 'خريطة الموقع' : 'Sitemap'}
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isRtl ? 'آخر تحديث: 3 مايو 2026' : 'Last updated: May 3, 2026'}
          </p>
        </div>

        {/* Categories & Links */}
        <div className="space-y-8">
          {sections.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {isRtl ? section.categoryAr : section.categoryEn}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {section.links.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="group flex items-center justify-between rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-gray-800 dark:text-gray-200 font-medium shadow-xs hover:border-[#2DB4A0] dark:hover:border-[#2DB4A0] hover:text-[#2DB4A0] dark:hover:text-[#2DB4A0] transition"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className="text-gray-400 group-hover:text-[#2DB4A0] transition" />
                        <span>{isRtl ? item.labelAr : item.labelEn}</span>
                      </div>
                      <ExternalLink size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition" />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default SitemapPage;