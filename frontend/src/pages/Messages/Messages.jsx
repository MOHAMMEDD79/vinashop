import { useState, useEffect } from 'react';
import { FiMessageSquare, FiTrash2, FiEye, FiX, FiMail, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

const Messages = () => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [filters, setFilters] = useState({ status: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  useEffect(() => {
    fetchMessages();
  }, [filters, pagination.page]);

  const fetchMessages = async () => {
    try {
      const res = await api.get('/test/messages', { params: { ...filters, page: pagination.page, limit: pagination.limit } });
      setMessages(res.data.data?.messages || []);
      setPagination(prev => ({ ...prev, total: res.data.data?.total || 0 }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error(t('app.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (message) => {
    try {
      await api.put(`/test/messages/${message.message_id}/read`);
      toast.success(t('messages.markAsRead'));
      fetchMessages();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('messages.deleteConfirm'))) return;
    try {
      await api.delete(`/test/messages/${id}`);
      toast.success(t('app.success'));
      fetchMessages();
      if (selectedMessage?.message_id === id) setSelectedMessage(null);
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const viewMessage = (message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      handleMarkRead(message);
    }
  };

  const getStatusText = (status) => {
    return t(`messages.statuses.${status}`) || status?.replace('_', ' ');
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('messages.title')}</h1>
      </div>

      <div className="filters">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">{t('messages.allMessages')}</option>
          <option value="pending">{t('messages.statuses.pending')}</option>
          <option value="in_progress">{t('messages.statuses.inProgress')}</option>
          <option value="resolved">{t('messages.statuses.resolved')}</option>
          <option value="closed">{t('messages.statuses.closed')}</option>
        </select>
      </div>

      <div className="card">
        {messages.length === 0 ? (
          <div className="empty-state">
            <FiMessageSquare style={{ fontSize: '3rem', marginBottom: '15px' }} />
            <p>{t('messages.noMessages')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>{t('messages.from')}</th>
                  <th>{t('messages.subject')}</th>
                  <th>{t('messages.date')}</th>
                  <th>{t('app.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {messages.map(message => (
                  <tr
                    key={message.message_id}
                    style={{
                      background: !message.is_read ? '#f0f9ff' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => viewMessage(message)}
                  >
                    <td style={{ width: '30px' }}>
                      <FiMail style={{ color: message.is_read ? '#94a3b8' : 'var(--primary)' }} />
                    </td>
                    <td>
                      <strong style={{ fontWeight: message.is_read ? 'normal' : 'bold' }}>
                        {message.name || message.sender_name || 'Unknown'}
                      </strong>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {message.email || message.sender_email}
                      </div>
                    </td>
                    <td style={{ fontWeight: message.is_read ? 'normal' : 'bold' }}>
                      {message.subject || t('messages.subject')}
                    </td>
                    <td>{new Date(message.created_at).toLocaleDateString('en-GB')}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="action-btns">
                        {!message.is_read && (
                          <button className="btn-icon view" onClick={() => handleMarkRead(message)} title={t('messages.markAsRead')}>
                            <FiCheck />
                          </button>
                        )}
                        <button className="btn-icon delete" onClick={() => handleDelete(message.message_id)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.total > pagination.limit && (
          <div className="pagination">
            {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }, (_, i) => (
              <button
                key={i + 1}
                className={pagination.page === i + 1 ? 'active' : ''}
                onClick={() => setPagination({ ...pagination, page: i + 1 })}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedMessage && (
        <div className="modal-overlay" onClick={() => setSelectedMessage(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('messages.messageDetails')}</h3>
              <button className="btn-icon" onClick={() => setSelectedMessage(null)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '15px' }}>
                <strong>{t('messages.from')}:</strong> {selectedMessage.name}
                <br />
                <strong>{t('orders.email')}:</strong> {selectedMessage.email}
                {selectedMessage.phone_number && (
                  <>
                    <br />
                    <strong>{t('orders.phone')}:</strong> {selectedMessage.phone_number}
                  </>
                )}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>{t('messages.subject')}:</strong> {selectedMessage.subject || t('messages.subject')}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>{t('messages.date')}:</strong> {new Date(selectedMessage.created_at).toLocaleString('en-GB')}
                <br />
                <strong>{t('messages.status')}:</strong> <span className={`badge ${selectedMessage.status === 'resolved' ? 'badge-success' : selectedMessage.status === 'pending' ? 'badge-warning' : 'badge-info'}`}>{getStatusText(selectedMessage.status)}</span>
              </div>
              <div style={{
                background: '#f8fafc',
                padding: '15px',
                borderRadius: '8px',
                whiteSpace: 'pre-wrap',
                marginBottom: '15px'
              }}>
                {selectedMessage.message || t('app.noData')}
              </div>
              {selectedMessage.admin_reply && (
                <div style={{ marginTop: '15px' }}>
                  <strong>{t('messages.adminReply')}:</strong>
                  <div style={{
                    background: '#e0f2fe',
                    padding: '15px',
                    borderRadius: '8px',
                    whiteSpace: 'pre-wrap',
                    marginTop: '5px'
                  }}>
                    {selectedMessage.admin_reply}
                  </div>
                  {selectedMessage.replied_at && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '5px' }}>
                      {new Date(selectedMessage.replied_at).toLocaleString('en-GB')}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => handleDelete(selectedMessage.message_id)}>{t('app.delete')}</button>
              <button className="btn btn-secondary" onClick={() => setSelectedMessage(null)}>{t('app.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
