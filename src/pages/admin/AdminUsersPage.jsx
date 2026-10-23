import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminService from '../../services/adminService';
import Skeleton from '../../components/Skeleton';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/errorMessage';

const ROLE_BADGES = {
  admin: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  host: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800',
  user: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  guest: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
};

const AdminUsersPage = () => {
  const { t, isRtl } = useTranslation();
  const context = useOutletContext();
  const globalSearch = context?.globalSearch || '';

  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await adminService.getUsers({ q: globalSearch, role });
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setErrorMessage(
        isRtl
          ? 'تعذر تحميل قائمة المستخدمين. يرجى المحاولة مرة أخرى.'
          : 'Failed to load users list. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [globalSearch, role, isRtl]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleBan = async (user) => {
    const actionText = user.isBanned
      ? isRtl ? 'إلغاء حظر' : 'unban'
      : isRtl ? 'حظر' : 'ban';
    
    if (!window.confirm(isRtl ? `هل أنت تأكد من ${actionText} هذا المستخدم؟` : `Are you sure you want to ${actionText} this user?`)) return;

    setActionId(user._id);
    try {
      await adminService.updateUser(user._id, { isBanned: !user.isBanned });
      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isBanned: !u.isBanned } : u))
      );
    } catch (err) {
      console.error('Failed to update ban status:', err);
      alert(getErrorMessage(err, isRtl ? 'حدث خطأ أثناء تعديل حالة الحظر' : 'Failed to update ban status'));
    } finally {
      setActionId(null);
    }
  };

  const handleToggleHostRole = async (user) => {
    const newRole = user.role === 'host' ? 'user' : 'host';
    setActionId(user._id);
    try {
      await adminService.updateUser(user._id, { role: newRole });
      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error('Failed to toggle host role:', err);
      alert(getErrorMessage(err, isRtl ? 'حدث خطأ أثناء تغيير الدور' : 'Failed to change role'));
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm(isRtl ? 'هل أنت تأكد من حذف هذا الحساب نهائياً؟' : 'Are you sure you want to permanently delete this user?')) return;

    setActionId(id);
    try {
      await adminService.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert(getErrorMessage(err, isRtl ? 'حدث خطأ أثناء حذف الحساب' : 'Failed to delete user'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm transition-all" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('admin.userManagement') || (isRtl ? 'إدارة المستخدمين' : 'User Management')}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {isRtl ? `إجمالي المستخدمين: ${users.length}` : `Total users: ${users.length}`}
          </p>
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-[#2DB4A0] focus:ring-1 focus:ring-[#2DB4A0] transition-colors"
        >
          <option value="all">{isRtl ? 'جميع الأدوار' : 'All roles'}</option>
          <option value="user">{isRtl ? 'مستخدم' : 'User'}</option>
          <option value="host">{isRtl ? 'مضيف' : 'Host'}</option>
          <option value="guest">{isRtl ? 'ضيف' : 'Guest'}</option>
          <option value="admin">{isRtl ? 'مسؤول' : 'Admin'}</option>
        </select>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
          {errorMessage}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-start">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 text-start text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              <th className="pb-3 text-start">{isRtl ? 'الاسم' : 'Name'}</th>
              <th className="pb-3 text-start">{isRtl ? 'البريد الإلكتروني' : 'Email'}</th>
              <th className="pb-3 text-start">{isRtl ? 'الدور' : 'Role'}</th>
              <th className="pb-3 text-start">{isRtl ? 'الحالة' : 'Status'}</th>
              <th className="pb-3 text-end">{isRtl ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="py-3.5"><Skeleton className="h-5 w-28 rounded-md" /></td>
                  <td className="py-3.5"><Skeleton className="h-5 w-36 rounded-md" /></td>
                  <td className="py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="py-3.5 text-end"><Skeleton className="ms-auto h-7 w-32 rounded-lg" /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  {isRtl ? 'لا يوجد مستخدمون مطابقون للبحث.' : 'No users found matching query.'}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                  <td className="py-3.5 font-semibold text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 font-bold text-gray-600 dark:text-gray-300 text-xs uppercase">
                        {u.name?.charAt(0) || 'U'}
                      </div>
                      <span>{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-gray-600 dark:text-gray-300 font-mono text-xs">{u.email}</td>
                  <td className="py-3.5">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${ROLE_BADGES[u.role] || 'bg-gray-100 text-gray-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.isBanned ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.isBanned ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                      {u.isBanned ? (isRtl ? 'محظور' : 'Banned') : (isRtl ? 'نشط' : 'Active')}
                    </span>
                  </td>
                  <td className="py-3.5 text-end">
                    <div className="flex items-center justify-end gap-2">
                      {u.role !== 'admin' && (
                        <button
                          disabled={actionId === u._id}
                          onClick={() => handleToggleBan(u)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${u.isBanned ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200'}`}
                        >
                          {actionId === u._id ? '...' : u.isBanned ? (isRtl ? 'فك الحظر' : 'Unban') : (isRtl ? 'حظر' : 'Ban')}
                        </button>
                      )}

                      {u.role !== 'admin' && (
                        <button
                          disabled={actionId === u._id}
                          onClick={() => handleToggleHostRole(u)}
                          className="rounded-lg bg-teal-100 dark:bg-teal-900/30 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:bg-teal-200 transition-colors disabled:opacity-50"
                        >
                          {actionId === u._id ? '...' : u.role === 'host' ? (isRtl ? 'تحويل لمستخدم' : 'Make User') : (isRtl ? 'ترقية لمضيف' : 'Make Host')}
                        </button>
                      )}

                      {u.role !== 'admin' && (
                        <button
                          disabled={actionId === u._id}
                          onClick={() => handleDeleteUser(u._id)}
                          className="rounded-lg bg-rose-100 dark:bg-rose-900/30 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-200 transition-colors disabled:opacity-50"
                        >
                          {actionId === u._id ? '...' : isRtl ? 'حذف' : 'Delete'}
                        </button>
                      )}

                      {u.role === 'admin' && (
                        <span className="text-xs italic text-gray-400 dark:text-gray-500">
                          {isRtl ? 'محمي' : 'Protected'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersPage;