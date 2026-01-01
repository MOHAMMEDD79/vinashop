import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';

const AdminUsers = () => {
  const { t } = useLanguage();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', full_name: '', role: 'admin', is_active: true
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/test/admin-users');
      setAdmins(res.data.data?.admins || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error(t('app.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      if (editingAdmin && !data.password) {
        delete data.password;
      }

      if (editingAdmin) {
        await api.put(`/test/admin-users/${editingAdmin.admin_id}`, data);
        toast.success(t('app.success'));
      } else {
        await api.post('/test/admin-users', data);
        toast.success(t('app.success'));
      }
      setShowModal(false);
      resetForm();
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('adminUsers.deleteConfirm'))) return;
    try {
      await api.delete(`/test/admin-users/${id}`);
      toast.success(t('app.success'));
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleToggleStatus = async (admin) => {
    try {
      await api.patch(`/test/admin-users/${admin.admin_id}/toggle-status`);
      toast.success(t('app.success'));
      fetchAdmins();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username || '',
      email: admin.email || '',
      password: '',
      full_name: admin.full_name || '',
      role: admin.role || 'admin',
      is_active: admin.is_active ?? true
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingAdmin(null);
    setFormData({
      username: '', email: '', password: '', full_name: '', role: 'admin', is_active: true
    });
  };

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: 'badge-danger',
      admin: 'badge-info',
      moderator: 'badge-secondary'
    };
    return badges[role] || 'badge-secondary';
  };

  const getRoleLabel = (role) => {
    const roles = {
      super_admin: t('adminUsers.roles.superAdmin'),
      admin: t('adminUsers.roles.admin'),
      moderator: t('adminUsers.roles.moderator')
    };
    return roles[role] || role;
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('adminUsers.title')}</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <FiPlus /> {t('adminUsers.addAdmin')}
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t('adminUsers.admin')}</th>
                <th>{t('adminUsers.email')}</th>
                <th>{t('adminUsers.role')}</th>
                <th>{t('adminUsers.status')}</th>
                <th>{t('adminUsers.lastLogin')}</th>
                <th>{t('app.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr><td colSpan="6" className="empty-state">{t('adminUsers.noAdmins')}</td></tr>
              ) : (
                admins.map(admin => (
                  <tr key={admin.admin_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="admin-avatar">
                          {(admin.full_name || admin.username || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{admin.full_name || admin.username}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>@{admin.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>{admin.email}</td>
                    <td>
                      <span className={`badge ${getRoleBadge(admin.role)}`}>
                        {getRoleLabel(admin.role)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${admin.is_active ? 'badge-success' : 'badge-danger'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleToggleStatus(admin)}
                      >
                        {admin.is_active ? t('app.active') : t('app.inactive')}
                      </span>
                    </td>
                    <td>
                      {admin.last_login ? new Date(admin.last_login).toLocaleDateString('en-GB') : t('adminUsers.never')}
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon edit" onClick={() => openEditModal(admin)}><FiEdit2 /></button>
                        <button className="btn-icon delete" onClick={() => handleDelete(admin.admin_id)}><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingAdmin ? t('adminUsers.editAdmin') : t('adminUsers.addAdmin')}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('adminUsers.username')} *</label>
                    <input type="text" className="form-control" value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>{t('adminUsers.fullName')}</label>
                    <input type="text" className="form-control" value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('adminUsers.email')} *</label>
                  <input type="email" className="form-control" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>{editingAdmin ? t('adminUsers.passwordHint') : t('adminUsers.password') + ' *'}</label>
                  <input type="password" className="form-control" value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingAdmin} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('adminUsers.role')}</label>
                    <select className="form-control" value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                      <option value="admin">{t('adminUsers.roles.admin')}</option>
                      <option value="moderator">{t('adminUsers.roles.moderator')}</option>
                      <option value="super_admin">{t('adminUsers.roles.superAdmin')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('adminUsers.status')}</label>
                    <select className="form-control" value={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}>
                      <option value="true">{t('app.active')}</option>
                      <option value="false">{t('app.inactive')}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('app.cancel')}</button>
                <button type="submit" className="btn btn-primary">{editingAdmin ? t('app.save') : t('app.add')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
