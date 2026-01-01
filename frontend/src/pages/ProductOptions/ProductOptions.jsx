import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';

const ProductOptions = () => {
  const { t } = useLanguage();
  const [optionTypes, setOptionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showValueModal, setShowValueModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [editingValue, setEditingValue] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [typeForm, setTypeForm] = useState({
    type_name_en: '',
    type_name_ar: '',
    display_order: 0,
    is_active: true
  });
  const [valueForm, setValueForm] = useState({
    value_name_en: '',
    value_name_ar: '',
    additional_price: '',
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchOptionTypes();
  }, []);

  const fetchOptionTypes = async () => {
    try {
      const res = await api.get('/test/option-types');
      setOptionTypes(res.data.data || []);
    } catch (error) {
      console.error('Error fetching option types:', error);
      toast.error(t('app.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    if (!typeForm.type_name_en) {
      toast.error(t('validation.required'));
      return;
    }

    try {
      const submitData = {
        ...typeForm,
        display_order: parseInt(typeForm.display_order) || 0,
        is_active: typeForm.is_active ? 1 : 0
      };

      if (editingType) {
        await api.put(`/test/option-types/${editingType.option_type_id}`, submitData);
        toast.success(t('app.success'));
      } else {
        await api.post('/test/option-types', submitData);
        toast.success(t('app.success'));
      }
      setShowTypeModal(false);
      resetTypeForm();
      fetchOptionTypes();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleValueSubmit = async (e) => {
    e.preventDefault();
    if (!valueForm.value_name_en) {
      toast.error(t('validation.required'));
      return;
    }

    try {
      const submitData = {
        ...valueForm,
        additional_price: parseFloat(valueForm.additional_price) || 0,
        display_order: parseInt(valueForm.display_order) || 0,
        is_active: valueForm.is_active ? 1 : 0
      };

      if (editingValue) {
        await api.put(`/test/option-values/${editingValue.option_value_id}`, submitData);
        toast.success(t('app.success'));
      } else {
        await api.post(`/test/option-types/${selectedType.option_type_id}/values`, submitData);
        toast.success(t('app.success'));
      }
      setShowValueModal(false);
      resetValueForm();
      fetchOptionTypes();
    } catch (error) {
      toast.error(error.response?.data?.message || t('app.error'));
    }
  };

  const handleDeleteType = async (id) => {
    if (!window.confirm(t('productOptions.deleteTypeConfirm'))) return;
    try {
      await api.delete(`/test/option-types/${id}`);
      toast.success(t('app.success'));
      fetchOptionTypes();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const handleDeleteValue = async (id) => {
    if (!window.confirm(t('productOptions.deleteValueConfirm'))) return;
    try {
      await api.delete(`/test/option-values/${id}`);
      toast.success(t('app.success'));
      fetchOptionTypes();
    } catch (error) {
      toast.error(t('app.error'));
    }
  };

  const openEditTypeModal = (type) => {
    setEditingType(type);
    setTypeForm({
      type_name_en: type.type_name_en || '',
      type_name_ar: type.type_name_ar || '',
      display_order: type.display_order || 0,
      is_active: type.is_active === 1 || type.is_active === true
    });
    setShowTypeModal(true);
  };

  const openAddValueModal = (type) => {
    setSelectedType(type);
    resetValueForm();
    setShowValueModal(true);
  };

  const openEditValueModal = (type, value) => {
    setSelectedType(type);
    setEditingValue(value);
    setValueForm({
      value_name_en: value.value_name_en || '',
      value_name_ar: value.value_name_ar || '',
      additional_price: value.additional_price || '',
      display_order: value.display_order || 0,
      is_active: value.is_active === 1 || value.is_active === true
    });
    setShowValueModal(true);
  };

  const resetTypeForm = () => {
    setEditingType(null);
    setTypeForm({
      type_name_en: '',
      type_name_ar: '',
      display_order: 0,
      is_active: true
    });
  };

  const resetValueForm = () => {
    setEditingValue(null);
    setValueForm({
      value_name_en: '',
      value_name_ar: '',
      additional_price: '',
      display_order: 0,
      is_active: true
    });
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('productOptions.title')}</h1>
        <button className="btn btn-primary" onClick={() => { resetTypeForm(); setShowTypeModal(true); }}>
          <FiPlus /> {t('productOptions.addOptionType')}
        </button>
      </div>

      {optionTypes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p>{t('productOptions.noOptionTypes')}</p>
          </div>
        </div>
      ) : (
        optionTypes.map(type => (
          <div className="card" key={type.option_type_id} style={{ marginBottom: '20px' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{type.type_name_en}</h2>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {type.type_name_ar && `${type.type_name_ar} | `}
                  {t('productOptions.optionValues')}: {type.values?.length || 0}
                  {!type.is_active && <span style={{ color: '#ef4444', marginLeft: '8px' }}>({t('app.inactive')})</span>}
                </span>
              </div>
              <div className="action-btns" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }} onClick={() => openAddValueModal(type)}>
                  <FiPlus /> {t('productOptions.addOptionValue')}
                </button>
                <button className="btn-icon edit" onClick={() => openEditTypeModal(type)}><FiEdit2 /></button>
                <button className="btn-icon delete" onClick={() => handleDeleteType(type.option_type_id)}><FiTrash2 /></button>
              </div>
            </div>

            {type.values && type.values.length > 0 && (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>{t('productOptions.valueNameEn')}</th>
                      <th>{t('productOptions.valueNameAr')}</th>
                      <th>{t('products.price')}</th>
                      <th>{t('productOptions.displayOrder')}</th>
                      <th>{t('app.status')}</th>
                      <th>{t('app.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {type.values.map(value => (
                      <tr key={value.option_value_id}>
                        <td><strong>{value.value_name_en}</strong></td>
                        <td dir="rtl">{value.value_name_ar || '-'}</td>
                        <td>
                          {value.additional_price && parseFloat(value.additional_price) !== 0 ? (
                            <span style={{ color: parseFloat(value.additional_price) > 0 ? '#22c55e' : '#ef4444' }}>
                              {parseFloat(value.additional_price) > 0 ? '+' : ''}₪{parseFloat(value.additional_price).toFixed(2)}
                            </span>
                          ) : '-'}
                        </td>
                        <td>{value.display_order}</td>
                        <td>
                          <span className={`badge ${value.is_active ? 'badge-success' : 'badge-danger'}`}>
                            {value.is_active ? t('app.active') : t('app.inactive')}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-icon edit" onClick={() => openEditValueModal(type, value)}><FiEdit2 /></button>
                            <button className="btn-icon delete" onClick={() => handleDeleteValue(value.option_value_id)}><FiTrash2 /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}

      {/* Type Modal */}
      {showTypeModal && (
        <div className="modal-overlay" onClick={() => setShowTypeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editingType ? t('productOptions.editOptionType') : t('productOptions.addOptionType')}</h3>
              <button className="btn-icon" onClick={() => setShowTypeModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleTypeSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('productOptions.typeNameEn')} *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={typeForm.type_name_en}
                      onChange={(e) => setTypeForm({ ...typeForm, type_name_en: e.target.value })}
                      placeholder="e.g., Flavor, Size, Color"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('productOptions.typeNameAr')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={typeForm.type_name_ar}
                      onChange={(e) => setTypeForm({ ...typeForm, type_name_ar: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('productOptions.displayOrder')}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={typeForm.display_order}
                      onChange={(e) => setTypeForm({ ...typeForm, display_order: e.target.value })}
                      min="0"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={typeForm.is_active}
                      onChange={(e) => setTypeForm({ ...typeForm, is_active: e.target.checked })}
                      style={{ marginRight: '0.5rem' }}
                    />
                    {t('app.active')}
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTypeModal(false)}>{t('app.cancel')}</button>
                <button type="submit" className="btn btn-primary">{editingType ? t('app.save') : t('app.add')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Value Modal */}
      {showValueModal && (
        <div className="modal-overlay" onClick={() => setShowValueModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editingValue ? t('productOptions.editOptionValue') : `${t('productOptions.addOptionValue')} - "${selectedType?.type_name_en}"`}</h3>
              <button className="btn-icon" onClick={() => setShowValueModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleValueSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('productOptions.valueNameEn')} *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={valueForm.value_name_en}
                      onChange={(e) => setValueForm({ ...valueForm, value_name_en: e.target.value })}
                      placeholder="e.g., Mint, Large, Red"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('productOptions.valueNameAr')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={valueForm.value_name_ar}
                      onChange={(e) => setValueForm({ ...valueForm, value_name_ar: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('products.price')} (₪)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={valueForm.additional_price}
                      onChange={(e) => setValueForm({ ...valueForm, additional_price: e.target.value })}
                      placeholder="e.g. 5.00 or -2.00"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('productOptions.displayOrder')}</label>
                    <input
                      type="number"
                      className="form-control"
                      value={valueForm.display_order}
                      onChange={(e) => setValueForm({ ...valueForm, display_order: e.target.value })}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginTop: '1.5rem' }}>
                      <input
                        type="checkbox"
                        checked={valueForm.is_active}
                        onChange={(e) => setValueForm({ ...valueForm, is_active: e.target.checked })}
                        style={{ marginRight: '0.5rem' }}
                      />
                      {t('app.active')}
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowValueModal(false)}>{t('app.cancel')}</button>
                <button type="submit" className="btn btn-primary">{editingValue ? t('app.save') : t('app.add')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductOptions;
