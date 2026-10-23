import { Link } from 'react-router-dom';
import { Edit3, ExternalLink, Trash2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { getListingImage } from '../../utils/images';

const ListingsGrid = ({ listings, loading, onDelete }) => {
  const { t, isRtl } = useTranslation();

  const statusClasses = {
    approved: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700',
    pending: 'bg-amber-50 text-amber-700',
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
        {t('dashboardListings.loading')}
      </div>
    );
  }

  if (!listings?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
        {t('dashboardListings.empty')}
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">
          {t('dashboardListings.title')}
        </h3>
        <Link
          to="/add-property"
          className="rounded-lg bg-[#2DB4A0] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#249181]"
        >
          {t('dashboardListings.addProperty')}
        </Link>
      </div>

      <div className="space-y-3">
        {listings.map((listing) => (
          <div
            key={listing._id}
            className="rounded-xl border border-gray-100 p-3 transition-colors hover:border-gray-200"
          >
            <div className="flex gap-3">
              <img
                decoding="async"
                loading="lazy"
                src={getListingImage(listing)}
                alt={listing.title}
                className="h-20 w-20 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="truncate font-semibold text-gray-900">
                      {listing.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {listing.location?.city || listing.city || t('dashboardListings.unknownCity')}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Link
                      to={`/properties/${listing._id}`}
                      className="rounded-full p-2 text-blue-600 transition-colors hover:bg-blue-50"
                      title={t('dashboardListings.view')}
                    >
                      <ExternalLink size={16} />
                    </Link>
                    <Link
                      to={`/properties/${listing._id}/edit`}
                      className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
                      title={t('dashboardListings.edit')}
                    >
                      <Edit3 size={16} />
                    </Link>
                    <button
                      type="button"
                      aria-label={t('dashboardListings.delete')}
                      onClick={() => onDelete(listing._id)}
                      className="rounded-full p-2 text-red-600 transition-colors hover:bg-red-50"
                      title={t('dashboardListings.delete')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      statusClasses[listing.status] || statusClasses.pending
                    }`}
                  >
                    {listing.status === 'approved'
                      ? t('dashboardListings.approved')
                      : listing.status === 'rejected'
                      ? t('dashboardListings.rejected')
                      : t('dashboardListings.review')}
                  </span>

                  {listing.pricePerNight && (
                    <span className="text-xs font-bold text-gray-900">
                      {Number(listing.pricePerNight).toLocaleString()} DH / {t('dashboardListings.night')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListingsGrid;