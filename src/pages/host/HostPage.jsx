import React, { useState } from 'react';
import HostExperience from './HostExperience';

const HostPage = ({ isLoggedIn = false, language = 'ar' }) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <main className="w-full min-h-screen bg-white">
      {/* 
        هنا تقدر تزيد Header أو Navbar خفيف خاص بالمضيفين إلا كان عندك، 
        أولا تخلي HostExperience ياخد المساحة الكاملة.
      */}

      <HostExperience 
        setIsLoginOpen={setIsLoginOpen}
        isLoggedIn={isLoggedIn}
        language={language}
      />

      {/* 
        إلا كان عندك Modal ديال Login مفرّق، 
        تقدر تحط المكون ديالو هنا وتاخد isLoginOpen كـ state:
        
        {isLoginOpen && (
          <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        )}
      */}
    </main>
  );
};

export default HostPage;