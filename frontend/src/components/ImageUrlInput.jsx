import { useState, useEffect, useRef } from 'react';
import { FiImage, FiX, FiLink, FiCheck, FiCrop, FiZoomIn, FiZoomOut, FiRotateCw, FiStar, FiPlus } from 'react-icons/fi';

/**
 * ImageUrlInput Component
 * Allows users to input image URLs, preview them, and perform basic editing (crop, zoom, rotate)
 *
 * Props:
 * - value: string | string[] - Current image URL(s)
 * - onChange: (urls) => void - Callback when URLs change
 * - multiple: boolean - Allow multiple images
 * - onPrimaryChange: (index) => void - Callback when primary image changes (for multiple)
 * - primaryIndex: number - Index of primary image (for multiple)
 * - label: string - Label text
 * - placeholder: string - Placeholder for input
 */
const ImageUrlInput = ({
  value = '',
  onChange,
  multiple = false,
  onPrimaryChange,
  primaryIndex = 0,
  label = 'Image URL',
  placeholder = 'Enter image URL...'
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [urls, setUrls] = useState([]);
  const [previewErrors, setPreviewErrors] = useState({});
  const [editingIndex, setEditingIndex] = useState(null);
  const [editSettings, setEditSettings] = useState({ zoom: 1, rotation: 0, cropX: 0, cropY: 0 });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Sync value prop to internal state
  useEffect(() => {
    if (multiple) {
      const urlArray = Array.isArray(value) ? value : (value ? [value] : []);
      setUrls(urlArray);
    } else {
      setUrls(value ? [value] : []);
      setInputUrl(value || '');
    }
  }, [value, multiple]);

  const isValidUrl = (url) => {
    try {
      new URL(url);
      // Accept any valid URL that looks like it could be an image
      // Be more permissive - allow any https/http URL
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const handleAddUrl = () => {
    if (!inputUrl.trim()) return;

    if (!isValidUrl(inputUrl)) {
      alert('Please enter a valid image URL');
      return;
    }

    if (multiple) {
      const newUrls = [...urls, inputUrl];
      setUrls(newUrls);
      onChange(newUrls);
      setInputUrl('');
    } else {
      setUrls([inputUrl]);
      onChange(inputUrl);
    }
  };

  const handleRemoveUrl = (index) => {
    if (multiple) {
      const newUrls = urls.filter((_, i) => i !== index);
      setUrls(newUrls);
      onChange(newUrls);
      // Adjust primary if needed
      if (primaryIndex >= newUrls.length && onPrimaryChange) {
        onPrimaryChange(Math.max(0, newUrls.length - 1));
      }
    } else {
      setUrls([]);
      onChange('');
      setInputUrl('');
    }
  };

  const handleSetPrimary = (index) => {
    if (onPrimaryChange) {
      onPrimaryChange(index);
    }
  };

  const handleImageError = (index) => {
    setPreviewErrors(prev => ({ ...prev, [index]: true }));
  };

  const handleImageLoad = (index) => {
    setPreviewErrors(prev => ({ ...prev, [index]: false }));
  };

  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setInputUrl(newUrl);
    if (!multiple && newUrl) {
      setUrls([newUrl]);
      onChange(newUrl);
    } else if (!multiple && !newUrl) {
      setUrls([]);
      onChange('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddUrl();
    }
  };

  const handlePaste = (e) => {
    // Allow paste to proceed normally, then update state
    setTimeout(() => {
      const pastedValue = e.target.value;
      if (pastedValue && isValidUrl(pastedValue)) {
        setInputUrl(pastedValue);
        if (!multiple) {
          setUrls([pastedValue]);
          onChange(pastedValue);
        }
      }
    }, 0);
  };

  // Edit modal functions
  const openEditModal = (index) => {
    setEditingIndex(index);
    setEditSettings({ zoom: 1, rotation: 0, cropX: 0, cropY: 0 });
  };

  const closeEditModal = () => {
    setEditingIndex(null);
  };

  const applyEdit = () => {
    // For URL-based images, we'll generate a CSS transform preview
    // In a real scenario, you might want to use canvas to generate a new cropped image
    // For now, we'll just close the modal - the edit settings can be stored and applied via CSS
    closeEditModal();
  };

  const handleZoomIn = () => {
    setEditSettings(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.1, 3) }));
  };

  const handleZoomOut = () => {
    setEditSettings(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.1, 0.5) }));
  };

  const handleRotate = () => {
    setEditSettings(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }));
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: '500',
        color: '#374151',
        fontSize: '0.875rem'
      }}>
        <FiImage style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
        {label}
      </label>

      {/* URL Input */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <div style={{
          flex: 1,
          position: 'relative'
        }}>
          <FiLink style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af'
          }} />
          <input
            type="text"
            value={inputUrl}
            onChange={handleUrlChange}
            onKeyPress={handleKeyPress}
            onPaste={handlePaste}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.875rem',
              transition: 'border-color 0.2s',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
        {multiple && (
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={!inputUrl.trim()}
            style={{
              padding: '0.75rem 1rem',
              background: inputUrl.trim() ? '#3b82f6' : '#e5e7eb',
              color: inputUrl.trim() ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '8px',
              cursor: inputUrl.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '500',
              transition: 'background 0.2s'
            }}
          >
            <FiPlus /> Add
          </button>
        )}
      </div>

      {/* Image Previews */}
      {urls.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: multiple ? 'repeat(auto-fill, minmax(120px, 1fr))' : '1fr',
          gap: '1rem'
        }}>
          {urls.map((url, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                border: multiple && index === primaryIndex ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                background: '#f9fafb',
                aspectRatio: multiple ? '1' : '16/9',
                maxHeight: multiple ? '120px' : '200px'
              }}
            >
              {previewErrors[index] ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  fontSize: '0.75rem',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <FiX size={24} style={{ marginBottom: '0.5rem' }} />
                  Failed to load
                </div>
              ) : (
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={() => handleImageError(index)}
                  onLoad={() => handleImageLoad(index)}
                />
              )}

              {/* Primary Badge */}
              {multiple && index === primaryIndex && (
                <div style={{
                  position: 'absolute',
                  top: '6px',
                  left: '6px',
                  background: '#3b82f6',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <FiStar size={10} /> Primary
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                display: 'flex',
                gap: '4px'
              }}>
                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => openEditModal(index)}
                  style={{
                    background: 'rgba(59, 130, 246, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Edit Image"
                >
                  <FiCrop size={14} />
                </button>

                {/* Set Primary Button (for multiple) */}
                {multiple && index !== primaryIndex && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(index)}
                    style={{
                      background: 'rgba(16, 185, 129, 0.9)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      width: '28px',
                      height: '28px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Set as Primary"
                  >
                    <FiStar size={14} />
                  </button>
                )}

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveUrl(index)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Remove"
                >
                  <FiX size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {urls.length === 0 && (
        <div style={{
          border: '2px dashed #d1d5db',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          color: '#9ca3af'
        }}>
          <FiImage size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            {multiple ? 'Add image URLs above' : 'Enter an image URL above to preview'}
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {editingIndex !== null && urls[editingIndex] && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
          onClick={closeEditModal}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '1.5rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                <FiCrop style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Edit Image
              </h3>
              <button
                type="button"
                onClick={closeEditModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Image Preview with Transforms */}
            <div style={{
              width: '100%',
              height: '300px',
              overflow: 'hidden',
              borderRadius: '8px',
              background: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <img
                ref={imageRef}
                src={urls[editingIndex]}
                alt="Edit preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  transform: `scale(${editSettings.zoom}) rotate(${editSettings.rotation}deg)`,
                  transition: 'transform 0.2s'
                }}
              />
            </div>

            {/* Edit Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <button
                type="button"
                onClick={handleZoomOut}
                style={{
                  padding: '0.75rem 1rem',
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FiZoomOut /> Zoom Out
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                style={{
                  padding: '0.75rem 1rem',
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FiZoomIn /> Zoom In
              </button>
              <button
                type="button"
                onClick={handleRotate}
                style={{
                  padding: '0.75rem 1rem',
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FiRotateCw /> Rotate
              </button>
            </div>

            {/* Zoom Level Indicator */}
            <div style={{
              textAlign: 'center',
              fontSize: '0.875rem',
              color: '#6b7280',
              marginBottom: '1rem'
            }}>
              Zoom: {Math.round(editSettings.zoom * 100)}% | Rotation: {editSettings.rotation}°
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem'
            }}>
              <button
                type="button"
                onClick={closeEditModal}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyEdit}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FiCheck /> Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUrlInput;
