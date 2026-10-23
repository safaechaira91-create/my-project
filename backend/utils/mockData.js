// ملاحظة: تم إزالة استيراد lucide-react لتفادي الأخطاء في بيئة Node.js Backend

export const moroccanCities = [
  'الدار البيضاء', 'الرباط', 'مراكش', 'طنجة', 'أكادير', 'فاس', 'مكناس', 'وجدة', 
  'القنيطرة', 'تطوان', 'تمارة', 'آسفي', 'سلا', 'بني ملال', 'الجديدة', 'تازة', 
  'الناظور', 'سطات', 'القصر الكبير', 'العرائش', 'الخميسات', 'تيزنيت', 'برشيد', 
  'الفقيه بن صالح', 'تاوريرت', 'بركان', 'سيدي سليمان', 'سيدي قاسم', 
  'خنيفرة', 'إفران', 'الصويرة', 'الفنيدق', 'المضيق', 'سوق الأربعاء', 'أزرو', 
  'أزمور', 'كلميم', 'الداخلة', 'العيون', 'خريبكة'
];

export const suggestedDestinations = [
  { 
    name: 'مراكش', 
    nameEn: 'Marrakech', 
    desc: 'المدينة الحمراء وسحر ساحة جامع الفنا', 
    iconName: 'MapPin', 
    color: 'bg-teal-100 text-teal-600' 
  },
  { 
    name: 'الدار البيضاء', 
    nameEn: 'Casablanca', 
    desc: 'العاصمة الاقتصادية والعمارة الحديثة', 
    iconName: 'Building', 
    color: 'bg-blue-100 text-blue-600' 
  },
  { 
    name: 'طنجة', 
    nameEn: 'Tangier', 
    desc: 'عروس الشمال وملتقى البحرين', 
    iconName: 'Compass', 
    color: 'bg-purple-100 text-purple-600' 
  },
  { 
    name: 'أكادير', 
    nameEn: 'Agadir', 
    desc: 'الشواطئ الذهبية والطقس المعتدل', 
    iconName: 'Sun', 
    color: 'bg-yellow-100 text-yellow-600' 
  }
];

export const getSoftColor = (index) => {
  const colors = [
    'bg-blue-100 text-blue-600', 
    'bg-teal-100 text-teal-600', 
    'bg-yellow-100 text-yellow-600', 
    'bg-emerald-100 text-emerald-600', 
    'bg-purple-100 text-purple-600'
  ];
  return colors[index % colors.length];
};

export const listingsData = [
  {
    id: 1,
    title: "شقة فاخرة بمارينا سلا - إطلالة على النهر",
    titleEn: "Luxury Apartment in Salé Marina - River View",
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    ],
    rating: "4.9",
    location: "مارينا سلا، سلا",
    price: "1,200",
    category: "تصميم",
    maxGuests: 4,
    amenities: ["wifi", "kitchen", "tv", "ac", "coffee", "parking"],
    host: { name: "Ahmed", joined: "2021" }
  },
  {
    id: 2,
    title: "شقة عصرية بحي الرياض - هدوء وراحة",
    titleEn: "Modern Apartment in Hay Riad - Quiet & Comfy",
    images: [
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80",
    ],
    rating: "4.8",
    location: "حي الرياض، الرباط",
    price: "950",
    category: "ريف",
    maxGuests: 2,
    amenities: ["wifi", "kitchen", "workspace", "parking"],
    host: { name: "Sanaa", joined: "2019" }
  }
];