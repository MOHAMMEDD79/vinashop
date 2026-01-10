import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Generate or get session ID for guest cart
const getSessionId = () => {
  let sessionId = localStorage.getItem('vinashop_session');
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('vinashop_session', sessionId);
  }
  return sessionId;
};

// Initialize cart from localStorage (runs only once)
const initializeCart = () => {
  try {
    const saved = localStorage.getItem('vinashop_cart');
    if (saved) {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.error('Failed to parse cart from localStorage:', e);
  }
  return [];
};

export const CartProvider = ({ children }) => {
  const [sessionId] = useState(getSessionId);
  const [items, setItems] = useState(initializeCart);
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const isFirstRender = useRef(true);

  // Mark as initialized after first render
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever items change (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    localStorage.setItem('vinashop_cart', JSON.stringify(items));
  }, [items]);

  // Calculate totals
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce((sum, item) => {
    const price = item.discountPrice || item.price;
    return sum + (price * item.quantity);
  }, 0);

  // Add item to cart
  const addItem = useCallback((product, variant = null, qty = null) => {
    // Use quantity from product object if not passed as parameter
    const quantity = qty || product.quantity || 1;

    // Get image from multiple possible sources
    const itemImage = product.image ||
                      product.primary_image ||
                      product.images?.[0]?.image_url ||
                      null;

    // Get combination_id if available (new system)
    const combinationId = product.combination_id || null;

    setItems(prevItems => {
      // Check if item already exists
      const existingIndex = prevItems.findIndex(item => {
        // Must match product ID
        if (item.productId !== product.product_id) return false;

        // New system: match by combination_id if available
        if (combinationId) {
          return item.combinationId === combinationId;
        }

        // Legacy system: match by variant/color/size
        return item.variantId === (variant?.variant_id || null) &&
          item.selectedColor === (variant?.color_id || product.selectedColor || null) &&
          item.selectedSize === (variant?.size_id || product.selectedSize || null);
      });

      if (existingIndex !== -1) {
        // Update quantity
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      }

      // Add new item
      const newItem = {
        id: uuidv4(),
        productId: product.product_id,
        // New combination system
        combinationId: combinationId,
        // Legacy variant system (still supported)
        variantId: variant?.variant_id || null,
        name: product.name || product.product_name_en || product.name_en,
        name_en: product.name_en || product.product_name_en || product.name,
        name_ar: product.name_ar || product.product_name_ar || product.name,
        image: itemImage,
        price: variant?.price || product.price || product.base_price,
        discountPrice: variant?.discount_price || product.discount_price || null,
        // Legacy color/size selection
        selectedColor: variant?.color_id || product.selectedColor || null,
        selectedColorName: variant?.color_name_en || product.selectedColorName || null,
        selectedColorHex: variant?.color_hex || product.selectedColorHex || null,
        selectedSize: variant?.size_id || product.selectedSize || null,
        selectedSizeName: variant?.size_name_en || product.selectedSizeName || null,
        // New options system (array of selected options with details)
        selectedOptions: product.selected_options || null,
        quantity,
        sku: product.sku || variant?.sku
      };

      return [...prevItems, newItem];
    });

    // Open cart drawer when adding
    setIsOpen(true);
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity < 1) {
      removeItem(itemId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  }, []);

  // Remove item from cart
  const removeItem = useCallback((itemId) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem('vinashop_cart');
  }, []);

  // Open/close cart drawer
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), []);

  const value = {
    sessionId,
    items,
    itemCount,
    subtotal,
    isOpen,
    isInitialized,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    openCart,
    closeCart,
    toggleCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
