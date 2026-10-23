﻿import React, { useEffect } from 'react';
import {
  Waves,
  Palmtree,
  Tent,
  Warehouse,
  Castle,
  Mountain,
  Snowflake,
  TreePine,
  Landmark,
  LayoutGrid,
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const CATEGORIES = [
  {
    id: 'all',
    ar: 'الكل',
    en: 'All',
    fr: 'Tout',
    es: 'Todo',
    de: 'Alle',
    icon: LayoutGrid,
    color: '#2DB4A0',
    dark: '#249181',
  },
  {
    id: 'pools',
    ar: 'مسابح',
    en: 'Pools',
    fr: 'Piscines',
    es: 'Piscinas',
    de: 'Pools',
    icon: Waves,
    color: '#2DB4A0',
    dark: '#249181',
  },
  {
    id: 'islands',
    ar: 'جزيرة',
    en: 'Islands',
    fr: 'Îles',
    es: 'Islas',
    de: 'Inseln',
    icon: Palmtree,
    color: '#2DB4A0',
    dark: '#249181',
  },
  {
    id: 'camping',
    ar: 'تخييم',
    en: 'Camping',
    fr: 'Camping',
    es: 'Camping',
    de: 'Camping',
    icon: Tent,
    color: '#2DB4A0',
    dark: '#249181',
  },
  {
    id: 'cabins',
    ar: 'أكواخ',
    en: 'Cabins',
    fr: 'Cabanes',
    es: 'Cabañas',
    de: 'Hütten',
    icon: Warehouse,
    color: '#2DB4A0',
    dark: '#249181',
  },
  {
    id: 'castles',
    ar: 'قلاع',
    en: 'Castles',
    fr: 'Châteaux',
    es: 'Castillos',
    de: 'Schlösser',
    icon: Castle,
    color: '#2DB4A0',
    dark: '#249181',
  },
  {
    id: 'mountains',
    ar: 'جبال',
    en: 'Mountains',
    fr: 'Montagnes',
    es: 'Montañas',
    de: 'Berge',
    icon: Mountain,
    color: '#2DB4A0',
    dark: '#249181',
  },
  {
    id: 'arctic',
    ar: 'القطب الشمالي',
    en: 'Arctic',
    fr: 'Arctique',
    es: 'Ártico',
    de: 'Arktis',
    icon: Snowflake,
    color: '#2DB4A0',
    dark: '#249181',
  },
  {
    id: 'countryside',
    ar: 'ريف',
    en: 'Countryside',
    fr: 'Campagne',
    es: 'Campo',
    de: 'Landschaft',
    icon: TreePine,
    color: '#2DB4A0',
    dark: '#249181',
  },
  {
    id: 'design',
    ar: 'تصميم',
    en: 'Design',
    fr: 'Design',
    es: 'Diseño',
    de: 'Design',
    icon: Landmark,
    color: '#2DB4A0',
    dark: '#249181',
  },
];

const Categories = ({ selectedCategory, setSelectedCategory, language }) => {
  const { language: currentLang, isRtl } = useTranslation();
  const activeLang = language || currentLang || 'ar';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const activeCategory =
      CATEGORIES.find((cat) => cat.id === selectedCategory) || CATEGORIES[0];

    document.documentElement.style.setProperty(
      '--color-primary',
      activeCategory.color
    );

    document.documentElement.style.setProperty(
      '--color-primary-dark',
      activeCategory.dark
    );
  }, [selectedCategory]);

  const getLabel = (cat) => cat[activeLang] || cat.en;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      role="tablist"
      aria-label="Categories"
      className="sticky top-16 z-30 flex items-center justify-start gap-6 overflow-x-auto border-b border-gray-200 bg-white/95 px-4 pt-4 pb-2 backdrop-blur-md shadow-xs scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:px-8 lg:px-12"
    >
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isSelected = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => setSelectedCategory?.(cat.id)}
            className={`group flex min-w-16 shrink-0 cursor-pointer flex-col items-center gap-2 border-b-2 pb-2 transition-all duration-200 outline-none ${
              isSelected
                ? 'border-[#2DB4A0] text-[#2DB4A0]'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            <Icon
              size={22}
              className={`transition-transform duration-200 ${
                isSelected ? 'scale-110' : 'group-hover:scale-105'
              }`}
            />

            <span
              className={`whitespace-nowrap text-xs ${
                isSelected ? 'font-bold' : 'font-medium'
              }`}
            >
              {getLabel(cat)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default Categories;