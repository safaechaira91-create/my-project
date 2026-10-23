import { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import Skeleton from '../../components/Skeleton';
import { useTranslation } from '../../hooks/useTranslation';

const STATUS_BADGES = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
};

const AdminListingsPage = () => {
  const { t, isRtl } = useTranslation();
  const context = useOutletContext();
  const globalSearch = context?.globalSearch || '';

  const [status, setStatus] = useState('all');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const statusLabels = {
    pending: isRtl ? 'قيد الانتظار' : 'Pending',
    approved: isRtl ? 'مقبول' : 'Approved',
    rejected: isRtl ? 'مرفوض' : 'Rejected',
  };

  const loadListings = () => {
    setLoading(true);
    adminService
      .getListings({ q: globalSearch, status })
      .then((data) => setListings(data || []))
      .catch((err) => console.error('Failed to load listings:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadListings();
  }, [globalSearch, status]);

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await adminService.updateListing(id, { status: 'approved' });
      await loadListings();
    } catch (err) {
      console.error('Failed to approve listing:', err);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt(
      isRtl ? 'يرجى إدخال سبب رفض هذا العقار:' : 'Please enter a rejection reason:',
      isRtl ? 'عدم الالتزام بسياسة المحتوى' : 'Policy review failed'
    );
    if (!reason) return;

    setActionId(id);
    try {
      await adminService.updateListing(id, { status: 'rejected', rejectionReason: reason });
      await loadListings();
    } catch (err) {
      console.error('Failed to reject listing:', err);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      isRtl ? 'هل أنت متأكد من حذف هذا العقار نهائياً؟' : 'Are you sure you want to permanently delete this listing?'
    );
    if (!confirmDelete) return;

    setActionId(id);
    try {
      await adminService.deleteListing(id);
      await loadListings();
    } catch (err) {
      console.error('Failed to delete listing:', err);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('admin.propertyManagement') || (isRtl ? 'إدارة العقارات' : 'Property Management')}
        </h2>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
        >
          <option value="all">{isRtl ? 'جميع الحالات' : 'All status'}</option>
          <option value="pending">{statusLabels.pending}</option>
          <option value="approved">{statusLabels.approved}</option>
          <option value="rejected">{statusLabels.rejected}</option>
        </select>
      </div>

      {/* Grid List Container */}
      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
              <Skeleton className="h-6 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/3 rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-16 rounded-lg" />
                <Skeleton className="h-7 w-16 rounded-lg" />
                <Skeleton className="h-7 w-16 rounded-lg" />
              </div>
            </div>
          ))
        ) : listings.length === 0 ? (
          <div className="col-span-full py-10 text-center text-gray-500 dark:text-gray-400">
            {isRtl ? 'لا توجد عقارات مطابقة حالياً.' : 'No listings found.'}
          </div>
        ) : (
          listings.map((l) => (
            <div
              key={l._id}
              className="flex flex-col justify-between rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 p-5 transition-all hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{l.title}</h3>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      STATUS_BADGES[l.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {statusLabels[l.status] || l.status}
                  </span>
                </div>

                <p className="mt-1 text-sm font-semibold text-[#2DB4A0]">
                  {l.location?.city || (isRtl ? 'غير محدد' : 'N/A')} • {l.price} DH
                </p>

                <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                  {l.description}
                </p>
              </div>

              {/* Actions Button Group */}
              <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                {l.status !== 'approved' && (
                  <button
                    disabled={actionId === l._id}
                    onClick={() => handleApprove(l._id)}
                    className="rounded-lg bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                  >
                    {isRtl ? 'موافقة' : 'Approve'}
                  </button>
                )}

                {l.status !== 'rejected' && (
                  <button
                    disabled={actionId === l._id}
                    onClick={() => handleReject(l._id)}
                    className="rounded-lg bg-orange-100 dark:bg-orange-900/40 px-3 py-1.5 text-xs font-semibold text-orange-700 dark:text-orange-400 hover:bg-orange-200 transition-colors disabled:opacity-50"
                  >
                    {isRtl ? 'رفض' : 'Reject'}
                  </button>
                )}

                <button
                  disabled={actionId === l._id}
                  onClick={() => handleDelete(l._id)}
                  className="rounded-lg bg-rose-100 dark:bg-rose-900/40 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-200 transition-colors disabled:opacity-50"
                >
                  {isRtl ? 'حذف' : 'Delete'}
                </button>

                <Link
                  to={`/listing/${l._id}`}
                  className="ms-auto rounded-lg bg-gray-200 dark:bg-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-300 transition-colors"
                >
                  {isRtl ? 'التفاصيل' : 'Details'}
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminListingsPage;