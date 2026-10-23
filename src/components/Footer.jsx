import React from 'react';
import { Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

const Footer = ({ currency }) => {
  const { t, isRtl } = useTranslation();

  const supportLinks = t('footer.supportLinks', { returnObjects: true });
  const hostingLinks = t('footer.hostingLinks', { returnObjects: true });
  const aboutLinks = t('footer.aboutLinks', { returnObjects: true });

  // TODO: These sections currently all point to the same HelpCenterPage.
  // Consider building dedicated pages (or anchored sections within
  // HelpCenterPage) for Safety, Cancellation, Accessibility, Hosting
  // resources, Careers, etc. once content is available. Pointing 4
  // differently-labeled links to the identical page is misleading UX.
  const sections = [
    {
      id: 'support',
      title: t('footer.support') || 'Support',
      links: Array.isArray(supportLinks) ? supportLinks : [],
      routes: ['/help-center', '/help-center', '/help-center', '/help-center'],
    },
    {
      id: 'hosting',
      title: t('footer.hosting') || 'Hosting',
      links: Array.isArray(hostingLinks) ? hostingLinks : [],
      routes: ['/host', '/host', '/host', '/host'],
    },
    {
      id: 'about',
      title: t('footer.about') || 'About',
      links: Array.isArray(aboutLinks) ? aboutLinks : [],
      routes: ['/help-center', '/help-center', '/help-center', '/help-center'],
    },
  ];

  const getCurrencyLabel = () => {
    if (!currency) return 'MAD';
    if (currency.code === 'MAD') return 'MAD';
    return `${currency.code} ${currency.symbol || ''}`.trim();
  };

  return (
    <footer
      dir={isRtl ? 'rtl' : 'ltr'}
      className="mt-12 border-t border-gray-200 bg-bg-gray pb-8 pt-12 text-gray-700"
    >
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10">
        <div className="grid grid-cols-1 gap-8 border-b border-gray-300/60 pb-12 md:grid-cols-3">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`flex flex-col gap-4 ${
                isRtl ? 'text-right' : 'text-left'
              }`}
            >
              <h3 className="text-sm font-bold text-gray-900">
                {section.title}
              </h3>

              <ul className="flex flex-col gap-3">
                {section.links.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={section.routes[index] || '/'}
                      className="text-sm text-gray-600 transition hover:text-[#2DB4A0] hover:underline"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-sm font-medium lg:flex-row">
          <div
            className={`flex flex-wrap items-center justify-center gap-2 ${
              isRtl ? 'text-right' : 'text-left'
            }`}
          >
            <span>
              © {new Date().getFullYear()} MyDar, Inc.{' '}
              {t('footer.copyright') || 'All rights reserved.'}
            </span>

            <span className="hidden sm:inline">·</span>

            <Link
              to="/privacy"
              className="transition hover:text-[#2DB4A0] hover:underline"
            >
              {t('footer.privacy') || 'Privacy'}
            </Link>

            <span>·</span>

            <Link
              to="/terms"
              className="transition hover:text-[#2DB4A0] hover:underline"
            >
              {t('footer.terms') || 'Terms'}
            </Link>

            <span>·</span>

            <Link
              to="/sitemap"
              className="transition hover:text-[#2DB4A0] hover:underline"
            >
              {t('footer.sitemap') || 'Sitemap'}
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <Link
              to="/help-center"
              className="flex items-center gap-2 transition hover:text-[#2DB4A0] hover:underline"
            >
              <Globe size={18} />
              <span>{t('footer.lang') || 'Language'}</span>
            </Link>

            <span className="font-bold text-gray-900">
              {getCurrencyLabel()}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;