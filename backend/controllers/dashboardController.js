import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import asyncHandler from 'express-async-handler';

const toMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

// @desc    Get Host Analytics
export const getHostStats = asyncHandler(async (req, res) => {
    // Security check: only hosts and admins can access host statistics
    if (!req.user || (req.user.role !== 'host' && req.user.role !== 'admin')) {
        res.status(403);
        throw new Error('Access denied: hosts only');
    }

    const currentUserId = req.user._id;

    // 1. جلب معرفات العقارات التي يملكها المضيف الحالي فقط
    const hostProperties = await Property.find({ host: currentUserId }).select('_id').lean();

    // تحويل المعرفات إلى ObjectIds لضمان دقة استعلام التجميع
    const hostPropertyIds = hostProperties.map((p) => new mongoose.Types.ObjectId(p._id));

    if (hostPropertyIds.length === 0) {
        return res.json({
            totals: { totalEarnings: 0, totalBookings: 0, activeListings: 0, pendingBookings: 0, confirmedBookings: 0 },
            charts: [],
            recentActivity: []
        });
    }

    // 2. جلب كافة الحجوزات المرتبطة بعقارات هذا المضيف حصرياً
    const allHostBookings = await Booking.find({ listing: { $in: hostPropertyIds } })
        .populate('listing', 'host title price')
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .lean();

    let manualRevenueSum = 0;
    let pendingBookings = 0;
    let confirmedBookings = 0;

    // 3. Initialize 6-month historical map for charts (Safe date calculation)
    const monthlyMap = new Map();
    const now = new Date();

    for (let i = 5; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = toMonthKey(d);
        monthlyMap.set(key, { month: key, revenue: 0, bookings: 0 });
    }

    // 4. Process bookings for detailed stats and charts
    allHostBookings.forEach((b) => {
        const isConfirmedOrCompleted = ['confirmed', 'completed'].includes(b.status);

        if (b.status === 'pending') pendingBookings++;
        if (b.status === 'confirmed') confirmedBookings++;
        if (b.status === 'completed') confirmedBookings++;

        // التحقق الجوهري: هل المضيف الحالي هو صاحب العقار المسجل في الحجز؟
        const propertyOwnerId = b.listing?.host?._id?.toString() || b.listing?.host?.toString();
        const isActualOwner = propertyOwnerId === currentUserId.toString();

        // الأرباح تضاف فقط إذا كان المستخدم الحالي هو المالك الفعلي للعقار
        if ((isConfirmedOrCompleted || b.paymentStatus === 'paid') && isActualOwner) {
            const price = typeof b.totalPrice === 'string'
                ? parseFloat(b.totalPrice.replace(/[^0-9.]/g, ''))
                : Number(b.totalPrice || 0);

            const revenue = isNaN(price) ? 0 : price;

            manualRevenueSum += revenue;

            // Add to monthly chart if within range
            const monthKey = toMonthKey(new Date(b.createdAt || b.startDate));
            if (monthlyMap.has(monthKey)) {
                const row = monthlyMap.get(monthKey);
                row.revenue += revenue;
                row.bookings += 1;
                monthlyMap.set(monthKey, row);
            }
        }
    });

    // 5. Get Recent Activity (Specific to this host's properties)
    const recentActivity = allHostBookings.slice(0, 5).map((b) => ({
        id: b._id,
        type: 'booking',
        status: b.status,
        totalPrice: b.totalPrice,
        createdAt: b.createdAt
    }));

    // 6. إحصائيات العقارات المملوكة
    const totalListingsCount = hostPropertyIds.length;

    res.json({
        totals: {
            totalEarnings: manualRevenueSum,
            totalBookings: allHostBookings.length,
            activeListings: totalListingsCount,
            pendingBookings,
            confirmedBookings,
        },
        charts: Array.from(monthlyMap.values()),
        recentActivity
    });
});