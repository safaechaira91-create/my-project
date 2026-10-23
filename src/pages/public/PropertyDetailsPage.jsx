import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bath, Bed, Loader2, MapPin, Star, Users, Pencil, CheckCircle2, MessageSquare, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import propertyService from '../../services/propertyService';
import reviewService from '../../services/reviewService';
import { useTranslation } from '../../hooks/useTranslation';
import { getImageUrl } from '../../utils/images';
import { format } from 'date-fns';
import { arMA, enUS } from 'date-fns/locale';
import { getErrorMessage } from '../../utils/errorMessage';

const PropertyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, isRtl } = useTranslation();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPages, setReviewsPages] = useState(1);

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const [replyDrafts, setReplyDrafts] = useState({});
  const [submittingReplyId, setSubmittingReplyId] = useState('');
  const [deletingReviewId, setDeletingReviewId] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await propertyService.getPropertyById(id);
        setListing(data);
      } catch (err) {
        console.error('Error loading property details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const fetchReviews = async (page = 1) => {
    setReviewsLoading(true);
    try {
      const data = await reviewService.getReviewsByListing(id, { page, limit: 5 });
      setReviews(data.reviews || []);
      setReviewsPage(data.page || 1);
      setReviewsPages(data.pages || 1);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(1);
  }, [id]);

  const canEdit = useMemo(() => {
    if (!user || !listing) return false;
    return user.role === 'admin' || listing.host?._id === user._id || listing.host?._id === user.uid;
  }, [user, listing]);

  const isListingHost = useMemo(() => {
    if (!user || !listing) return false;
    return user.role === 'admin' || String(listing.host?._id) === String(user._id);
  }, [user, listing]);

  const hasAlreadyReviewed = useMemo(() => {
    if (!user) return false;
    return reviews.some((r) => String(r.userId) === String(user._id));
  }, [reviews, user]);

  const formatReviewDate = (dateValue) => {
    if (!dateValue) return '';
    try {
      return format(new Date(dateValue), 'dd MMM yyyy', { locale: isRtl ? arMA : enUS });
    } catch {
      return '';
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');

    if (!user) {
      navigate('/login', { state: { from: `/properties/${id}` } });
      return;
    }

    if (!newComment.trim()) {
      setReviewError(isRtl ? 'يرجى كتابة تعليق.' : 'Please write a comment.');
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewService.createReview({
        listingId: id,
        rating: newRating,
        comment: newComment.trim(),
      });
      setNewComment('');
      setNewRating(5);
      await fetchReviews(1);
      // Refresh listing to reflect the updated average rating.
      const updatedListing = await propertyService.getPropertyById(id);
      setListing(updatedListing);
    } catch (err) {
      setReviewError(getErrorMessage(err, isRtl ? 'تعذر إرسال التقييم.' : 'Could not submit review.'));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReplySubmit = async (reviewId) => {
    const replyText = (replyDrafts[reviewId] || '').trim();
    if (!replyText) return;

    setSubmittingReplyId(reviewId);
    try {
      const updated = await reviewService.replyToReview(reviewId, replyText);
      setReviews((prev) => prev.map((r) => (r._id === reviewId ? { ...r, hostReply: updated.hostReply } : r)));
      setReplyDrafts((prev) => ({ ...prev, [reviewId]: '' }));
    } catch (err) {
      console.error('Failed to submit reply:', err);
    } finally {
      setSubmittingReplyId('');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm(isRtl ? 'هل تريد حذف هذا التقييم؟' : 'Delete this review?')) return;

    setDeletingReviewId(reviewId);
    try {
      await reviewService.deleteReview(reviewId);
      await fetchReviews(reviewsPage);
      const updatedListing = await propertyService.getPropertyById(id);
      setListing(updatedListing);
    } catch (err) {
      console.error('Failed to delete review:', err);
    } finally {
      setDeletingReviewId('');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50 dark:bg-gray-950" dir={isRtl ? 'rtl' : 'ltr'}>
        <Loader2 className="animate-spin text-[#2DB4A0]" size={48} />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="py-20 text-center text-lg font-semibold text-gray-600 dark:text-gray-400 min-h-screen bg-gray-50/50 dark:bg-gray-950" dir={isRtl ? 'rtl' : 'ltr'}>
        {t('propertyDetails.notFound') || (isRtl ? 'لم يتم العثور على العقار.' : 'Property not found.')}
      </div>
    );
  }

  const mainImage = listing.images?.[0] ? getImageUrl(listing.images[0]) : '/placeholder-property.jpg';
  const subImages = (listing.images || []).slice(1, 5);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 px-4 py-8 transition-colors" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl">
        {/* Header Title & Edit */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">{listing.title}</h1>
          {canEdit && (
            <Link
              to={`/properties/${listing._id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200 shadow-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
            >
              <Pencil size={16} />
              <span>{t('propertyDetails.edit') || (isRtl ? 'تعديل' : 'Edit')}</span>
            </Link>
          )}
        </div>

        {/* Sub-header info */}
        <div className="mb-6 flex items-center gap-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-1">
            <Star size={16} className="fill-amber-400 text-amber-400" />
            <span className="font-bold">{listing.rating || 4.8}</span>
            {listing.numReviews > 0 && (
              <span className="text-gray-500 dark:text-gray-400">
                ({listing.numReviews} {isRtl ? 'تقييم' : 'reviews'})
              </span>
            )}
          </div>
          <span>·</span>
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 underline">
            <MapPin size={16} />
            <span>{listing.location?.city || listing.city}, {t('propertyDetails.morocco') || (isRtl ? 'المغرب' : 'Morocco')}</span>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="mb-10 grid h-80 sm:h-105 grid-cols-1 gap-2 overflow-hidden rounded-3xl md:grid-cols-2">
          <div className="h-full bg-gray-200 dark:bg-gray-800">
            <img src={mainImage} className="h-full w-full object-cover transition duration-300 hover:opacity-95" alt={listing.title} />
          </div>
          <div className="hidden h-full grid-cols-2 gap-2 md:grid">
            {subImages.length > 0 ? (
              subImages.map((img, i) => (
                <div key={i} className="h-full bg-gray-200 dark:bg-gray-800">
                  <img src={getImageUrl(img)} className="h-full w-full object-cover transition duration-300 hover:opacity-95" alt={listing.title} />
                </div>
              ))
            ) : (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-full bg-gray-100 dark:bg-gray-800/50" />
              ))
            )}
          </div>
        </div>

        {/* Content & Booking Grid */}
        <div className="grid gap-12 md:grid-cols-3">
          <div className="space-y-8 md:col-span-2">
            {/* Host & Features */}
            <div className="border-b border-gray-200 dark:border-gray-800 pb-8">
              <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
                {t('propertyDetails.hostedBy') || (isRtl ? 'المضيف:' : 'Hosted by')} {listing.host?.name || listing.host?.fullName || 'MyDar Host'}
              </h2>
              <div className="flex flex-wrap items-center gap-6 text-gray-600 dark:text-gray-400 text-sm font-medium">
                <span className="inline-flex items-center gap-1.5"><Users size={18} className="text-[#2DB4A0]" /> {listing.guests || 2} {t('propertyDetails.guests') || (isRtl ? 'ضيوف' : 'guests')}</span>
                <span className="inline-flex items-center gap-1.5"><Bed size={18} className="text-[#2DB4A0]" /> {listing.bedrooms || 1} {t('propertyDetails.bedrooms') || (isRtl ? 'غرف نوم' : 'bedrooms')}</span>
                <span className="inline-flex items-center gap-1.5"><Bath size={18} className="text-[#2DB4A0]" /> {listing.bathrooms || 1} {t('propertyDetails.bathrooms') || (isRtl ? 'حمامات' : 'bathrooms')}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('propertyDetails.about') || (isRtl ? 'عن هذا المكان' : 'About this space')}
              </h3>
              <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Amenities */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
                <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                  {t('propertyDetails.amenities') || (isRtl ? 'ما يقدمه المكان' : 'What this place offers')}
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {listing.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-1.5 rounded-2xl bg-gray-100 dark:bg-gray-800 px-3.5 py-2 text-sm font-medium text-gray-800 dark:text-gray-200"
                    >
                      <CheckCircle2 size={16} className="text-[#2DB4A0]" />
                      {t(`propertyForm.amenitiesLabels.${amenity}`) || amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
              <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                <Star size={20} className="fill-amber-400 text-amber-400" />
                {listing.rating || 0} · {listing.numReviews || 0} {isRtl ? 'تقييم' : 'reviews'}
              </h3>

              {/* Add Review Form */}
              {user && !hasAlreadyReviewed && (
                <form onSubmit={handleSubmitReview} className="mb-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                  <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {isRtl ? 'شارك تجربتك مع هذا المكان' : 'Share your experience with this place'}
                  </p>

                  <div className="mb-3 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setNewRating(starValue)}
                        className="cursor-pointer"
                        aria-label={`${starValue} stars`}
                      >
                        <Star
                          size={24}
                          className={starValue <= newRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}
                        />
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder={isRtl ? 'اكتب تعليقك هنا...' : 'Write your comment here...'}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-white outline-none focus:border-[#2DB4A0]"
                  />

                  {reviewError && (
                    <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400">{reviewError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#2DB4A0] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#249181] disabled:opacity-60"
                  >
                    {submittingReview && <Loader2 size={16} className="animate-spin" />}
                    {isRtl ? 'إرسال التقييم' : 'Submit review'}
                  </button>
                </form>
              )}

              {!user && (
                <div className="mb-8 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-5 text-center text-sm text-gray-500 dark:text-gray-400">
                  <Link to="/login" className="font-semibold text-[#2DB4A0] hover:underline">
                    {isRtl ? 'سجل الدخول' : 'Log in'}
                  </Link>{' '}
                  {isRtl ? 'لإضافة تقييم لهذا المكان.' : 'to add a review for this place.'}
                </div>
              )}

              {/* Reviews List */}
              {reviewsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-[#2DB4A0]" size={28} />
                </div>
              ) : reviews.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {isRtl ? 'لا توجد تقييمات بعد. كن أول من يقيم!' : 'No reviews yet. Be the first to review!'}
                </p>
              ) : (
                <div className="space-y-5">
                  {reviews.map((review) => (
                    <div key={review._id} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={review.userImage || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                            alt={review.userName}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{review.userName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatReviewDate(review.createdAt)}</p>
                          </div>
                        </div>

                        {(String(review.userId) === String(user?._id) || user?.role === 'admin') && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(review._id)}
                            disabled={deletingReviewId === review._id}
                            className="text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition disabled:opacity-50"
                            aria-label={isRtl ? 'حذف التقييم' : 'Delete review'}
                          >
                            {deletingReviewId === review._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={14}
                            className={n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-700'}
                          />
                        ))}
                      </div>

                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>

                      {/* Host reply (existing) */}
                      {review.hostReply && (
                        <div className="mt-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3">
                          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                            <MessageSquare size={13} className="text-[#2DB4A0]" />
                            {isRtl ? 'رد المضيف' : 'Host response'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{review.hostReply}</p>
                        </div>
                      )}

                      {/* Host reply form (only for the listing owner/admin, and only if no reply yet) */}
                      {isListingHost && !review.hostReply && (
                        <div className="mt-3 flex gap-2">
                          <input
                            value={replyDrafts[review._id] || ''}
                            onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [review._id]: e.target.value }))}
                            placeholder={isRtl ? 'اكتب رداً كمضيف...' : 'Reply as host...'}
                            maxLength={1000}
                            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-[#2DB4A0]"
                          />
                          <button
                            type="button"
                            onClick={() => handleReplySubmit(review._id)}
                            disabled={submittingReplyId === review._id || !(replyDrafts[review._id] || '').trim()}
                            className="rounded-xl bg-[#2DB4A0] px-3.5 py-2 text-white transition hover:bg-[#249181] disabled:opacity-50"
                          >
                            {submittingReplyId === review._id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Pagination */}
                  {reviewsPages > 1 && (
                    <div className="flex justify-center gap-2 pt-2">
                      {Array.from({ length: reviewsPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => fetchReviews(p)}
                          className={`h-8 w-8 rounded-full text-sm font-semibold transition ${
                            p === reviewsPage
                              ? 'bg-[#2DB4A0] text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sticky Booking Sidebar */}
          <div className="md:col-span-1">
            <div className="sticky top-24 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <div className="mb-6 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{listing.price} MAD</span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400"> / {t('propertyDetails.night') || (isRtl ? 'ليلة' : 'night')}</span>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
                  <Star size={16} className="fill-amber-400 text-amber-400" />
                  <span>{listing.rating || 4.8}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate('/checkout', {
                    state: {
                      listingId: listing._id,
                      listingImage: mainImage,
                      listingTitle: listing.title,
                      listingLocation: listing.location?.city || listing.city,
                      total: listing.price,
                      nights: 1,
                      guests: 1,
                      paymentMethod: 'cash',
                    },
                  })
                }
                className="w-full rounded-2xl bg-[#2DB4A0] py-3.5 font-bold text-white shadow-lg shadow-[#2DB4A0]/20 transition hover:bg-[#249181] active:scale-95 cursor-pointer"
              >
                {t('propertyDetails.reserve') || (isRtl ? 'حجز الآن' : 'Reserve')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsPage;