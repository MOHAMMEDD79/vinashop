import { useState, useEffect } from 'react';
import {
  FiPlus, FiEye, FiEdit2, FiTrash2, FiX, FiDollarSign,
  FiCalendar, FiClock, FiCheck, FiUser, FiTrendingUp,
  FiAlertCircle, FiList, FiFileText
} from 'react-icons/fi';
import { workersAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';

// Helper function to format date properly (DD/MM/YYYY)
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const Workers = () => {
  const { t } = useLanguage();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('workers');
  const [showModal, setShowModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showPaySalaryModal, setShowPaySalaryModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [statistics, setStatistics] = useState(null);

  // Worker details
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [salaryPreview, setSalaryPreview] = useState(null);

  // Past salaries tab
  const [pastSalariesData, setPastSalariesData] = useState({ salaries: [], monthlySummary: [] });
  const [pastSalariesFilters, setPastSalariesFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });
  const [periodSalaries, setPeriodSalaries] = useState({ salaries: [], summary: {} });

  // Unpaid workers
  const [unpaidWorkers, setUnpaidWorkers] = useState({ workers: [], summary: {} });

  // Forms
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    id_number: '',
    address: '',
    position: '',
    hire_date: new Date().toISOString().split('T')[0],
    base_salary: 0,
    salary_type: 'monthly',
    status: 'active',
    bank_name: '',
    bank_account: '',
    notes: ''
  });

  const [attendanceData, setAttendanceData] = useState({
    work_date: new Date().toISOString().split('T')[0],
    check_in: '09:00',
    check_out: '17:00',
    status: 'present',
    notes: ''
  });

  const [salaryData, setSalaryData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    calculation_type: 'fixed',
    working_days_in_month: 26,
    bonus: 0,
    deductions: 0,
    notes: ''
  });

  useEffect(() => {
    fetchWorkers();
    fetchStatistics();
    fetchUnpaidWorkers();
  }, [filters, pagination.page]);

  useEffect(() => {
    if (activeTab === 'past-salaries') {
      fetchPeriodSalaries();
    }
  }, [activeTab, pastSalariesFilters]);

  const fetchWorkers = async () => {
    try {
      const res = await workersAPI.getAll({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setWorkers(res.data.data || []);
      setPagination(prev => ({ ...prev, total: res.data.pagination?.total || 0 }));
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast.error(t('app.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const res = await workersAPI.getStatistics();
      setStatistics(res.data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchUnpaidWorkers = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const res = await workersAPI.getUnpaidWorkers(currentYear, currentMonth);
      setUnpaidWorkers(res.data.data || { workers: [], summary: {} });
    } catch (error) {
      console.error('Error fetching unpaid workers:', error);
    }
  };

  const fetchPeriodSalaries = async () => {
    try {
      const res = await workersAPI.getAllSalariesByPeriod(
        pastSalariesFilters.year,
        pastSalariesFilters.month
      );
      setPeriodSalaries(res.data.data || { salaries: [], summary: {} });
    } catch (error) {
      console.error('Error fetching period salaries:', error);
    }
  };

  const fetchWorkerDetails = async (workerId) => {
    try {
      // Fetch attendance
      const attendanceRes = await workersAPI.getAttendance(workerId, { limit: 30 });
      setAttendanceHistory(attendanceRes.data.data || []);

      // Fetch salary history
      const salaryRes = await workersAPI.getSalaryHistory(workerId, { limit: 12 });
      setSalaryHistory(salaryRes.data.data || []);
    } catch (error) {
      console.error('Error fetching worker details:', error);
    }
  };

  const fetchSalaryPreview = async () => {
    if (!selectedWorker) return;

    try {
      const res = await workersAPI.getSalaryPreview(
        selectedWorker.id || selectedWorker.workerId,
        {
          month: salaryData.month,
          year: salaryData.year,
          calculation_type: salaryData.calculation_type,
          working_days_in_month: salaryData.working_days_in_month
        }
      );
      setSalaryPreview(res.data.data);
    } catch (error) {
      console.error('Error fetching salary preview:', error);
    }
  };

  useEffect(() => {
    if (showSalaryModal && selectedWorker) {
      fetchSalaryPreview();
    }
  }, [showSalaryModal, salaryData.month, salaryData.year, salaryData.calculation_type, salaryData.working_days_in_month]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name) {
      toast.error('Full name is required');
      return;
    }
    if (!formData.position) {
      toast.error('Position is required');
      return;
    }

    try {
      if (editMode && selectedWorker) {
        await workersAPI.update(selectedWorker.id || selectedWorker.workerId, formData);
        toast.success('Worker updated successfully');
      } else {
        await workersAPI.create(formData);
        toast.success('Worker created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchWorkers();
      fetchStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleRecordAttendance = async (e) => {
    e.preventDefault();
    try {
      await workersAPI.recordAttendance(selectedWorker.id || selectedWorker.workerId, attendanceData);
      toast.success('Attendance recorded successfully');
      setShowAttendanceModal(false);
      setAttendanceData({
        work_date: new Date().toISOString().split('T')[0],
        check_in: '09:00',
        check_out: '17:00',
        status: 'present',
        notes: ''
      });
      fetchWorkerDetails(selectedWorker.id || selectedWorker.workerId);
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleGenerateSalary = async (e) => {
    e.preventDefault();
    try {
      await workersAPI.generateSalary(selectedWorker.id || selectedWorker.workerId, {
        ...salaryData,
        calculated_amount: salaryPreview?.calculatedAmount || selectedWorker.baseSalary || selectedWorker.base_salary
      });
      toast.success('Salary generated successfully');
      setShowSalaryModal(false);
      setSalaryData({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        calculation_type: 'fixed',
        working_days_in_month: 26,
        bonus: 0,
        deductions: 0,
        notes: ''
      });
      setSalaryPreview(null);
      fetchWorkerDetails(selectedWorker.id || selectedWorker.workerId);
      fetchStatistics();
      fetchUnpaidWorkers();
      if (activeTab === 'past-salaries') {
        fetchPeriodSalaries();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handlePaySalary = async (e) => {
    e.preventDefault();
    try {
      await workersAPI.markSalaryPaid(selectedSalary.salaryId || selectedSalary.salary_id, {
        payment_date: new Date().toISOString().split('T')[0]
      });
      toast.success('Salary marked as paid');
      setShowPaySalaryModal(false);
      setSelectedSalary(null);
      if (selectedWorker) {
        fetchWorkerDetails(selectedWorker.id || selectedWorker.workerId);
      }
      fetchStatistics();
      fetchUnpaidWorkers();
      if (activeTab === 'past-salaries') {
        fetchPeriodSalaries();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this worker?')) return;
    try {
      await workersAPI.delete(id);
      toast.success('Worker deleted successfully');
      fetchWorkers();
      fetchStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const viewWorker = async (worker) => {
    setSelectedWorker(worker);
    setActiveTab('details');
    await fetchWorkerDetails(worker.id || worker.workerId);
  };

  const editWorker = (worker) => {
    setSelectedWorker(worker);
    setFormData({
      full_name: worker.fullName || worker.full_name || '',
      phone: worker.phone || '',
      email: worker.email || '',
      id_number: worker.idNumber || worker.id_number || '',
      address: worker.address || '',
      position: worker.position || '',
      hire_date: (worker.hireDate || worker.hire_date || '').split('T')[0],
      base_salary: worker.baseSalary || worker.base_salary || 0,
      salary_type: worker.salaryType || worker.salary_type || 'monthly',
      status: worker.status || 'active',
      bank_name: worker.bankName || worker.bank_name || '',
      bank_account: worker.bankAccount || worker.bank_account || '',
      notes: worker.notes || ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  const openSalaryModal = (worker) => {
    setSelectedWorker(worker);
    setSalaryData({
      ...salaryData,
      calculation_type: worker.salaryType === 'monthly' ? 'fixed' : 'days_worked'
    });
    setShowSalaryModal(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      id_number: '',
      address: '',
      position: '',
      hire_date: new Date().toISOString().split('T')[0],
      base_salary: 0,
      salary_type: 'monthly',
      status: 'active',
      bank_name: '',
      bank_account: '',
      notes: ''
    });
    setEditMode(false);
    setSelectedWorker(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'badge-success',
      inactive: 'badge-warning',
      terminated: 'badge-danger'
    };
    return badges[status] || 'badge-secondary';
  };

  const getAttendanceStatusBadge = (status) => {
    const badges = {
      present: 'badge-success',
      absent: 'badge-danger',
      late: 'badge-warning',
      half_day: 'badge-info',
      holiday: 'badge-secondary'
    };
    return badges[status] || 'badge-secondary';
  };

  const getPaymentStatusBadge = (status) => {
    return status === 'paid' ? 'badge-success' : 'badge-warning';
  };

  const getMonthName = (month) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || '';
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('workers.title') || 'Workers Management'}</h1>
        {activeTab === 'workers' && (
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <FiPlus /> {t('workers.addWorker')}
          </button>
        )}
        {activeTab === 'details' && selectedWorker && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => { setActiveTab('workers'); setSelectedWorker(null); }}>
              {t('workers.backToWorkers')}
            </button>
            <button className="btn" style={{ background: '#3b82f6', color: 'white' }} onClick={() => setShowAttendanceModal(true)}>
              <FiCalendar /> {t('workers.recordAttendance')}
            </button>
            <button className="btn btn-primary" onClick={() => openSalaryModal(selectedWorker)}>
              <FiDollarSign /> {t('workers.generateSalary')}
            </button>
          </div>
        )}
        {activeTab === 'past-salaries' && (
          <button className="btn btn-secondary" onClick={() => setActiveTab('workers')}>
            {t('workers.backToWorkers')}
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      {activeTab !== 'details' && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          <button
            className={`btn ${activeTab === 'workers' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('workers')}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <FiUser /> {t('workers.workers') || 'Workers'}
          </button>
          <button
            className={`btn ${activeTab === 'past-salaries' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('past-salaries')}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <FiFileText /> {t('workers.pastSalaries') || 'Past Salaries'}
          </button>
        </div>
      )}

      {/* Statistics */}
      {statistics && activeTab === 'workers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#3b82f6' }}>
              {statistics.totalWorkers || statistics.total_workers || 0}
            </div>
            <div style={{ color: '#64748b' }}>{t('workers.totalWorkers')}</div>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#22c55e' }}>
              {statistics.activeWorkers || statistics.active_workers || 0}
            </div>
            <div style={{ color: '#64748b' }}>{t('workers.activeWorkers')}</div>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#ef4444' }}>
              ₪{parseFloat(statistics.totalMonthlySalaries || statistics.total_monthly_salary || statistics.total_net_salary || 0).toFixed(2)}
            </div>
            <div style={{ color: '#64748b' }}>{t('workers.totalMonthlySalaries')}</div>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#f59e0b' }}>
              {statistics.pendingSalaries || statistics.pending_count || 0}
            </div>
            <div style={{ color: '#64748b' }}>{t('workers.pendingPayments')}</div>
          </div>
        </div>
      )}

      {/* Unpaid Workers Alert */}
      {activeTab === 'workers' && unpaidWorkers.summary && (unpaidWorkers.summary.totalUnpaid > 0 || unpaidWorkers.summary.total_unpaid > 0) && (
        <div className="card" style={{
          padding: '15px 20px',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '1px solid #f59e0b',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <FiAlertCircle style={{ fontSize: '1.5em', color: '#d97706' }} />
              <div>
                <strong style={{ color: '#92400e' }}>
                  {t('workers.unpaidAlert') || 'Unpaid Salaries Alert'} - {getMonthName(new Date().getMonth() + 1)} {new Date().getFullYear()}
                </strong>
                <p style={{ margin: '5px 0 0', color: '#a16207', fontSize: '0.9em' }}>
                  {unpaidWorkers.summary.notGenerated || unpaidWorkers.summary.not_generated || 0} {t('workers.notGenerated') || 'workers need salary generated'},{' '}
                  {unpaidWorkers.summary.pending || 0} {t('workers.pendingPayment') || 'pending payment'}
                  {unpaidWorkers.summary.totalPendingAmount > 0 && (
                    <span> - <strong>₪{parseFloat(unpaidWorkers.summary.totalPendingAmount || unpaidWorkers.summary.total_pending_amount || 0).toFixed(2)}</strong> {t('workers.totalPending') || 'pending'}</span>
                  )}
                </p>
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ background: '#d97706', border: 'none' }}
              onClick={() => setActiveTab('past-salaries')}
            >
              <FiList /> {t('workers.viewDetails') || 'View Details'}
            </button>
          </div>
        </div>
      )}

      {/* Worker Info Header when viewing details */}
      {activeTab === 'details' && selectedWorker && (
        <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5em'
              }}>
                <FiUser />
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{selectedWorker.fullName || selectedWorker.full_name}</h2>
                <p style={{ color: '#64748b', margin: '5px 0' }}>{selectedWorker.position}</p>
                <span className={`badge ${getStatusBadge(selectedWorker.status)}`}>
                  {(selectedWorker.status || '').toUpperCase()}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9em', color: '#64748b' }}>{t('workers.baseSalary')}</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#22c55e' }}>
                ₪{parseFloat(selectedWorker.baseSalary || selectedWorker.base_salary || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.9em', color: '#64748b' }}>
                ({t(`workers.salaryTypes.${selectedWorker.salaryType || selectedWorker.salary_type || 'monthly'}`)})
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'workers' && (
        <>
          <div className="filters">
            <input
              type="text"
              placeholder={t('app.search')}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">{t('app.all')} {t('app.status')}</option>
              <option value="active">{t('workers.statuses.active')}</option>
              <option value="inactive">{t('workers.statuses.inactive')}</option>
              <option value="terminated">{t('workers.statuses.terminated')}</option>
            </select>
          </div>

          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>{t('workers.name')}</th>
                    <th>{t('workers.position')}</th>
                    <th>{t('workers.phone')}</th>
                    <th>{t('workers.hireDate')}</th>
                    <th>{t('workers.baseSalary')}</th>
                    <th>{t('workers.type')}</th>
                    <th>{t('app.status')}</th>
                    <th>{t('app.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.length === 0 ? (
                    <tr><td colSpan="8" className="empty-state">{t('workers.noWorkers')}</td></tr>
                  ) : (
                    workers.map(worker => (
                      <tr key={worker.id || worker.workerId}>
                        <td>
                          <strong>{worker.fullName || worker.full_name}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{worker.email}</div>
                        </td>
                        <td>{worker.position}</td>
                        <td>{worker.phone}</td>
                        <td>{formatDate(worker.hireDate || worker.hire_date)}</td>
                        <td><strong>₪{parseFloat(worker.baseSalary || worker.base_salary || 0).toFixed(2)}</strong></td>
                        <td>{(worker.salaryType || worker.salary_type || 'monthly').replace('_', ' ')}</td>
                        <td>
                          <span className={`badge ${getStatusBadge(worker.status)}`}>
                            {(worker.status || '').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-icon view" onClick={() => viewWorker(worker)} title="View Details">
                              <FiEye />
                            </button>
                            <button className="btn-icon edit" onClick={() => editWorker(worker)} title="Edit">
                              <FiEdit2 />
                            </button>
                            <button className="btn-icon" onClick={() => openSalaryModal(worker)} title="Generate Salary" style={{ color: '#22c55e' }}>
                              <FiDollarSign />
                            </button>
                            <button className="btn-icon delete" onClick={() => handleDelete(worker.id || worker.workerId)} title="Delete">
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

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
        </>
      )}

      {/* Worker Details Tab */}
      {activeTab === 'details' && selectedWorker && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Attendance History */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiCalendar /> {t('workers.attendanceHistory')}
            </h3>
            {attendanceHistory.length === 0 ? (
              <p style={{ color: '#64748b' }}>{t('workers.noAttendance')}</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>{t('workers.date')}</th>
                    <th>{t('workers.in')}</th>
                    <th>{t('workers.out')}</th>
                    <th>{t('workers.hours')}</th>
                    <th>{t('app.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.slice(0, 10).map((att, idx) => (
                    <tr key={idx}>
                      <td>{formatDate(att.workDate || att.work_date)}</td>
                      <td>{att.checkIn || att.check_in || '-'}</td>
                      <td>{att.checkOut || att.check_out || '-'}</td>
                      <td>{att.hoursWorked || att.hours_worked || 0}h</td>
                      <td>
                        <span className={`badge ${getAttendanceStatusBadge(att.status)}`}>
                          {(att.status || '').toUpperCase().replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Salary History */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiDollarSign /> {t('workers.salaryHistory')}
            </h3>
            {salaryHistory.length === 0 ? (
              <p style={{ color: '#64748b' }}>{t('workers.noSalaries')}</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>{t('workers.period')}</th>
                    <th>{t('workers.netSalary')}</th>
                    <th>{t('app.status')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {salaryHistory.slice(0, 10).map((salary, idx) => (
                    <tr key={idx}>
                      <td>{getMonthName(salary.month)} {salary.year}</td>
                      <td><strong>₪{parseFloat(salary.netSalary || salary.net_salary || 0).toFixed(2)}</strong></td>
                      <td>
                        <span className={`badge ${getPaymentStatusBadge(salary.paymentStatus || salary.payment_status)}`}>
                          {(salary.paymentStatus || salary.payment_status || '').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {(salary.paymentStatus || salary.payment_status) === 'pending' && (
                          <button
                            className="btn-icon"
                            style={{ color: '#22c55e' }}
                            onClick={() => { setSelectedSalary(salary); setShowPaySalaryModal(true); }}
                            title="Mark as Paid"
                          >
                            <FiCheck />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Worker Info */}
          <div className="card" style={{ padding: '20px', gridColumn: 'span 2' }}>
            <h3 style={{ margin: '0 0 15px' }}>{t('workers.workerInformation')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div>
                <p><strong>{t('workers.phone')}:</strong> {selectedWorker.phone || '-'}</p>
                <p><strong>{t('workers.email')}:</strong> {selectedWorker.email || '-'}</p>
                <p><strong>{t('workers.idNumber')}:</strong> {selectedWorker.idNumber || selectedWorker.id_number || '-'}</p>
              </div>
              <div>
                <p><strong>{t('workers.address')}:</strong> {selectedWorker.address || '-'}</p>
                <p><strong>{t('workers.hireDate')}:</strong> {formatDate(selectedWorker.hireDate || selectedWorker.hire_date)}</p>
              </div>
              <div>
                <p><strong>{t('workers.bank')}:</strong> {selectedWorker.bankName || selectedWorker.bank_name || '-'}</p>
                <p><strong>{t('workers.account')}:</strong> {selectedWorker.bankAccount || selectedWorker.bank_account || '-'}</p>
              </div>
            </div>
            {selectedWorker.notes && (
              <p style={{ marginTop: '15px' }}><strong>{t('workers.notes')}:</strong> {selectedWorker.notes}</p>
            )}
          </div>
        </div>
      )}

      {/* Past Salaries Tab */}
      {activeTab === 'past-salaries' && (
        <div>
          {/* Month/Year Filter */}
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontWeight: 'bold' }}>{t('workers.selectMonth') || 'Month'}:</label>
                <select
                  className="form-control"
                  style={{ width: '120px' }}
                  value={pastSalariesFilters.month}
                  onChange={(e) => setPastSalariesFilters({ ...pastSalariesFilters, month: parseInt(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                    <option key={m} value={m}>{getMonthName(m)}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontWeight: 'bold' }}>{t('workers.selectYear') || 'Year'}:</label>
                <select
                  className="form-control"
                  style={{ width: '100px' }}
                  value={pastSalariesFilters.year}
                  onChange={(e) => setPastSalariesFilters({ ...pastSalariesFilters, year: parseInt(e.target.value) })}
                >
                  {[ 2026,2027,2028,2029,2030,2031,2032,2033,2034,2035,2036,2036].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary"
                onClick={fetchPeriodSalaries}
              >
                <FiList /> {t('workers.loadSalaries') || 'Load Salaries'}
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          {periodSalaries.summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#3b82f6' }}>
                  {periodSalaries.summary.totalRecords || periodSalaries.summary.total_records || 0}
                </div>
                <div style={{ color: '#64748b' }}>{t('workers.totalSalaries') || 'Total Salaries'}</div>
              </div>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#22c55e' }}>
                  ₪{parseFloat(periodSalaries.summary.totalPaid || periodSalaries.summary.total_paid || 0).toFixed(2)}
                </div>
                <div style={{ color: '#64748b' }}>{t('workers.totalPaid') || 'Total Paid'}</div>
              </div>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#f59e0b' }}>
                  ₪{parseFloat(periodSalaries.summary.totalPending || periodSalaries.summary.total_pending || 0).toFixed(2)}
                </div>
                <div style={{ color: '#64748b' }}>{t('workers.totalPendingAmount') || 'Pending Amount'}</div>
              </div>
              <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#ef4444' }}>
                  ₪{parseFloat(periodSalaries.summary.totalAmount || periodSalaries.summary.total_amount || 0).toFixed(2)}
                </div>
                <div style={{ color: '#64748b' }}>{t('workers.grandTotal') || 'Grand Total'}</div>
              </div>
            </div>
          )}

          {/* Salaries Table */}
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>{t('workers.name') || 'Worker'}</th>
                    <th>{t('workers.position') || 'Position'}</th>
                    <th>{t('workers.period') || 'Period'}</th>
                    <th>{t('workers.baseSalary') || 'Base'}</th>
                    <th>{t('workers.calculatedAmount') || 'Calculated'}</th>
                    <th>{t('workers.bonus') || 'Bonus'}</th>
                    <th>{t('workers.deductions') || 'Deductions'}</th>
                    <th>{t('workers.netSalary') || 'Net Salary'}</th>
                    <th>{t('app.status') || 'Status'}</th>
                    <th>{t('app.actions') || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {(!periodSalaries.salaries || periodSalaries.salaries.length === 0) ? (
                    <tr>
                      <td colSpan="10" className="empty-state">
                        {t('workers.noSalariesForPeriod') || 'No salary records found for this period'}
                      </td>
                    </tr>
                  ) : (
                    periodSalaries.salaries.map((salary, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{salary.workerName || salary.worker_name}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{salary.phone}</div>
                        </td>
                        <td>{salary.position}</td>
                        <td>{getMonthName(salary.month)} {salary.year}</td>
                        <td>₪{parseFloat(salary.baseSalary || salary.base_salary || 0).toFixed(2)}</td>
                        <td>₪{parseFloat(salary.calculatedAmount || salary.calculated_amount || 0).toFixed(2)}</td>
                        <td style={{ color: '#22c55e' }}>+₪{parseFloat(salary.bonus || 0).toFixed(2)}</td>
                        <td style={{ color: '#ef4444' }}>-₪{parseFloat(salary.deductions || 0).toFixed(2)}</td>
                        <td><strong>₪{parseFloat(salary.netSalary || salary.net_salary || 0).toFixed(2)}</strong></td>
                        <td>
                          <span className={`badge ${getPaymentStatusBadge(salary.paymentStatus || salary.payment_status)}`}>
                            {(salary.paymentStatus || salary.payment_status || '').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {(salary.paymentStatus || salary.payment_status) === 'pending' && (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '5px 10px', fontSize: '0.85em' }}
                              onClick={() => {
                                setSelectedSalary(salary);
                                // Find the worker to set it for the modal
                                const worker = workers.find(w =>
                                  (w.id || w.workerId) === (salary.workerId || salary.worker_id)
                                );
                                if (worker) setSelectedWorker(worker);
                                setShowPaySalaryModal(true);
                              }}
                            >
                              <FiCheck /> {t('workers.pay') || 'Pay'}
                            </button>
                          )}
                          {(salary.paymentStatus || salary.payment_status) === 'paid' && (
                            <span style={{ color: '#22c55e', fontSize: '0.85em' }}>
                              {formatDate(salary.paymentDate || salary.payment_date)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Workers without salary for this period */}
          {unpaidWorkers.workers && unpaidWorkers.workers.length > 0 && (
            <div className="card" style={{ marginTop: '20px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 15px', display: 'flex', alignItems: 'center', gap: '10px', color: '#d97706' }}>
                <FiAlertCircle /> {t('workers.workersNeedingSalary') || 'Workers Needing Salary for Current Month'}
              </h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>{t('workers.name') || 'Worker'}</th>
                      <th>{t('workers.position') || 'Position'}</th>
                      <th>{t('workers.baseSalary') || 'Base Salary'}</th>
                      <th>{t('workers.salaryStatus') || 'Salary Status'}</th>
                      <th>{t('app.actions') || 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidWorkers.workers.map((worker, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{worker.fullName || worker.full_name}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{worker.phone}</div>
                        </td>
                        <td>{worker.position}</td>
                        <td>₪{parseFloat(worker.baseSalary || worker.base_salary || 0).toFixed(2)}</td>
                        <td>
                          {worker.salaryStatus === 'not_generated' || worker.salary_status === 'not_generated' ? (
                            <span className="badge badge-danger">{t('workers.notGenerated') || 'Not Generated'}</span>
                          ) : (
                            <span className="badge badge-warning">{t('workers.pending') || 'Pending Payment'}</span>
                          )}
                        </td>
                        <td>
                          {(worker.salaryStatus === 'not_generated' || worker.salary_status === 'not_generated') ? (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '5px 10px', fontSize: '0.85em' }}
                              onClick={() => openSalaryModal(worker)}
                            >
                              <FiDollarSign /> {t('workers.generateSalary') || 'Generate'}
                            </button>
                          ) : (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '5px 10px', fontSize: '0.85em', background: '#22c55e', border: 'none' }}
                              onClick={() => {
                                setSelectedSalary({
                                  salaryId: worker.salaryId || worker.salary_id,
                                  salary_id: worker.salaryId || worker.salary_id,
                                  netSalary: worker.netSalary || worker.net_salary,
                                  net_salary: worker.netSalary || worker.net_salary,
                                  month: new Date().getMonth() + 1,
                                  year: new Date().getFullYear()
                                });
                                setSelectedWorker(worker);
                                setShowPaySalaryModal(true);
                              }}
                            >
                              <FiCheck /> {t('workers.pay') || 'Pay'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Worker Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{editMode ? t('workers.editWorker') : t('workers.addWorker')}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>{t('workers.fullName')} *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('workers.position')} *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      required
                      placeholder={t('workers.positionPlaceholder')}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('workers.phone')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('workers.email')}</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('workers.idNumber')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.id_number}
                      onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('workers.hireDate')}</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('workers.baseSalary')}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.base_salary}
                      min="0"
                      step="0.01"
                      onChange={(e) => setFormData({ ...formData, base_salary: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('workers.salaryType')}</label>
                    <select
                      className="form-control"
                      value={formData.salary_type}
                      onChange={(e) => setFormData({ ...formData, salary_type: e.target.value })}
                    >
                      <option value="monthly">{t('workers.salaryTypes.monthly')}</option>
                      <option value="daily">{t('workers.salaryTypes.daily')}</option>
                      <option value="hourly">{t('workers.salaryTypes.hourly')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('workers.bankName')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('workers.bankAccount')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.bank_account}
                      onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>{t('workers.address')}</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('app.status')}</label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">{t('workers.statuses.active')}</option>
                      <option value="inactive">{t('workers.statuses.inactive')}</option>
                      <option value="terminated">{t('workers.statuses.terminated')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('workers.notes')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('app.cancel')}</button>
                <button type="submit" className="btn btn-primary">{editMode ? t('app.update') : t('app.create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Attendance Modal */}
      {showAttendanceModal && selectedWorker && (
        <div className="modal-overlay" onClick={() => setShowAttendanceModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('workers.recordAttendance')} - {selectedWorker.fullName || selectedWorker.full_name}</h3>
              <button className="btn-icon" onClick={() => setShowAttendanceModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleRecordAttendance}>
              <div className="modal-body">
                <div className="form-group">
                  <label>{t('workers.date')}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={attendanceData.work_date}
                    onChange={(e) => setAttendanceData({ ...attendanceData, work_date: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>{t('workers.checkIn')}</label>
                    <input
                      type="time"
                      className="form-control"
                      value={attendanceData.check_in}
                      onChange={(e) => setAttendanceData({ ...attendanceData, check_in: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('workers.checkOut')}</label>
                    <input
                      type="time"
                      className="form-control"
                      value={attendanceData.check_out}
                      onChange={(e) => setAttendanceData({ ...attendanceData, check_out: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('app.status')}</label>
                  <select
                    className="form-control"
                    value={attendanceData.status}
                    onChange={(e) => setAttendanceData({ ...attendanceData, status: e.target.value })}
                  >
                    <option value="present">{t('workers.attendanceStatuses.present')}</option>
                    <option value="absent">{t('workers.attendanceStatuses.absent')}</option>
                    <option value="late">{t('workers.attendanceStatuses.late')}</option>
                    <option value="half_day">{t('workers.attendanceStatuses.half_day')}</option>
                    <option value="holiday">{t('workers.attendanceStatuses.holiday')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('workers.notes')}</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={attendanceData.notes}
                    onChange={(e) => setAttendanceData({ ...attendanceData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAttendanceModal(false)}>{t('app.cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('workers.recordAttendance')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Salary Modal */}
      {showSalaryModal && selectedWorker && (
        <div className="modal-overlay" onClick={() => setShowSalaryModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{t('workers.generateSalary')} - {selectedWorker.fullName || selectedWorker.full_name}</h3>
              <button className="btn-icon" onClick={() => setShowSalaryModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleGenerateSalary}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>{t('workers.selectMonth')}</label>
                    <select
                      className="form-control"
                      value={salaryData.month}
                      onChange={(e) => setSalaryData({ ...salaryData, month: parseInt(e.target.value) })}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                        <option key={m} value={m}>{getMonthName(m)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('workers.selectYear')}</label>
                    <select
                      className="form-control"
                      value={salaryData.year}
                      onChange={(e) => setSalaryData({ ...salaryData, year: parseInt(e.target.value) })}
                    >
                      {[2026,2027,2028,2029,2030,2031,2032,2033,20234,2035,2036,2036].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('workers.calculationType')}</label>
                  <select
                    className="form-control"
                    value={salaryData.calculation_type}
                    onChange={(e) => setSalaryData({ ...salaryData, calculation_type: e.target.value })}
                  >
                    <option value="fixed">{t('workers.fixedMonthly')}</option>
                    <option value="days_worked">{t('workers.basedOnDaysWorked')}</option>
                  </select>
                </div>

                {salaryData.calculation_type === 'days_worked' && (
                  <div className="form-group">
                    <label>{t('workers.workingDaysInMonth')}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={salaryData.working_days_in_month}
                      min="1"
                      max="31"
                      onChange={(e) => setSalaryData({ ...salaryData, working_days_in_month: parseInt(e.target.value) || 26 })}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>{t('workers.bonus')}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={salaryData.bonus}
                      min="0"
                      step="0.01"
                      onChange={(e) => setSalaryData({ ...salaryData, bonus: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('workers.deductions')}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={salaryData.deductions}
                      min="0"
                      step="0.01"
                      onChange={(e) => setSalaryData({ ...salaryData, deductions: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('workers.notes')}</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={salaryData.notes}
                    onChange={(e) => setSalaryData({ ...salaryData, notes: e.target.value })}
                  />
                </div>

                {/* Salary Preview */}
                {salaryPreview && (
                  <div style={{
                    background: '#f1f5f9',
                    padding: '15px',
                    borderRadius: '8px',
                    marginTop: '15px'
                  }}>
                    <h4 style={{ margin: '0 0 10px', color: '#64748b' }}>{t('workers.salaryPreview')}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span>{t('workers.baseSalary')}:</span>
                      <strong>₪{parseFloat(salaryPreview.baseSalary || selectedWorker.baseSalary || selectedWorker.base_salary || 0).toFixed(2)}</strong>
                    </div>
                    {salaryData.calculation_type === 'days_worked' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>{t('workers.daysWorked')}:</span>
                        <strong>{salaryPreview.daysWorked || 0} / {salaryData.working_days_in_month}</strong>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span>{t('workers.calculatedAmount')}:</span>
                      <strong>₪{parseFloat(salaryPreview.calculatedAmount || 0).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#22c55e' }}>
                      <span>{t('workers.bonus')}:</span>
                      <strong>+₪{parseFloat(salaryData.bonus || 0).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#ef4444' }}>
                      <span>{t('workers.deductions')}:</span>
                      <strong>-₪{parseFloat(salaryData.deductions || 0).toFixed(2)}</strong>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '10px',
                      borderTop: '1px solid #e2e8f0',
                      fontSize: '1.1em'
                    }}>
                      <strong>{t('workers.netSalary')}:</strong>
                      <strong style={{ color: '#22c55e' }}>
                        ₪{(parseFloat(salaryPreview.calculatedAmount || 0) + parseFloat(salaryData.bonus || 0) - parseFloat(salaryData.deductions || 0)).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSalaryModal(false)}>{t('app.cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('workers.generateSalary')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Salary Modal */}
      {showPaySalaryModal && selectedSalary && (
        <div className="modal-overlay" onClick={() => setShowPaySalaryModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('workers.confirmSalaryPayment')}</h3>
              <button className="btn-icon" onClick={() => setShowPaySalaryModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handlePaySalary}>
              <div className="modal-body">
                <div style={{
                  background: '#f1f5f9',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <p style={{ marginBottom: '10px' }}>
                    <strong>{getMonthName(selectedSalary.month)} {selectedSalary.year}</strong>
                  </p>
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#22c55e' }}>
                    ₪{parseFloat(selectedSalary.netSalary || selectedSalary.net_salary || 0).toFixed(2)}
                  </div>
                </div>
                <p style={{ marginTop: '20px', textAlign: 'center' }}>
                  {t('workers.confirmSalaryPaymentMessage')}
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaySalaryModal(false)}>{t('app.cancel')}</button>
                <button type="submit" className="btn btn-primary">
                  <FiCheck /> {t('workers.markAsPaid')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workers;
