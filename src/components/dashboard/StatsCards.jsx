import { motion, animate, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';

const AnimatedNumber = ({ value }) => {
  // استخراج الرقم الحقيقي إذا كان المعطى عبارة عن نص يحتوي على رموز
  const numericValue = typeof value === 'number' 
    ? value 
    : parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0;

  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) =>
    Math.round(latest).toLocaleString()
  );

  useEffect(() => {
    const controls = animate(motionValue, numericValue, {
      duration: 1,
      ease: 'easeOut',
    });

    return () => controls.stop();
  }, [numericValue, motionValue]);

  return <motion.span>{rounded}</motion.span>;
};

const StatsCards = ({ stats }) => {
  if (!stats?.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item, idx) => (
        <motion.div
          key={item.label || idx}
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className={`rounded-xl p-2.5 ${item.iconBg || 'bg-gray-100'}`}>
              {item.icon && <item.icon size={18} className={item.iconColor || 'text-gray-600'} />}
            </div>
            {item.growth !== undefined && (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  item.growth >= 0
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {item.growth >= 0 ? '+' : ''}
                {item.growth}%
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-500">{item.label}</p>
          <p className="mt-1 text-2xl font-black text-gray-900">
            <AnimatedNumber value={item.value} />
            {typeof item.value === 'string' && item.value.includes('DH') && (
              <span className="text-base font-bold text-gray-600 ms-1">DH</span>
            )}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;