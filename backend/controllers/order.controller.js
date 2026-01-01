/**
 * Order Controller
 * @module controllers/order
 * 
 * FIXED ISSUES:
 * 1. Accepts both camelCase and snake_case field names
 * 2. Response includes both naming conventions for compatibility
 * 3. Pagination response standardized
 * 4. Status values documented and validated
 */

const orderService = require('../services/order.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

// Valid status values
const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const VALID_PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
const VALID_PAYMENT_METHODS = ['cash', 'credit_card', 'debit_card', 'paypal', 'bank_transfer', 'wallet'];

// Status flow rules
const STATUS_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

/**
 * Helper: Format order for response
 */
const formatOrder = (order) => {
  if (!order) return null;

  return {
    // IDs
    id: order.order_id || order.id,
    orderId: order.order_id || order.id,
    order_id: order.order_id || order.id,
    orderNumber: order.order_number,
    order_number: order.order_number,

    // User
    userId: order.user_id,
    user_id: order.user_id,
    userName: order.user_name || `${order.first_name || ''} ${order.last_name || ''}`.trim(),
    user_name: order.user_name || `${order.first_name || ''} ${order.last_name || ''}`.trim(),
    userEmail: order.user_email || order.email,
    user_email: order.user_email || order.email,

    // Status
    status: order.status,
    paymentStatus: order.payment_status,
    payment_status: order.payment_status,
    paymentMethod: order.payment_method,
    payment_method: order.payment_method,
    paymentReference: order.payment_reference,
    payment_reference: order.payment_reference,

    // Amounts
    subtotal: parseFloat(order.subtotal) || 0,
    discountAmount: parseFloat(order.discount_amount) || 0,
    discount_amount: parseFloat(order.discount_amount) || 0,
    shippingCost: parseFloat(order.shipping_cost) || 0,
    shipping_cost: parseFloat(order.shipping_cost) || 0,
    taxAmount: parseFloat(order.tax_amount) || 0,
    tax_amount: parseFloat(order.tax_amount) || 0,
    totalAmount: parseFloat(order.total_amount) || 0,
    total_amount: parseFloat(order.total_amount) || 0,
    total: parseFloat(order.total_amount) || 0,

    // Shipping
    shippingAddress: order.shipping_address,
    shipping_address: order.shipping_address,
    shippingCity: order.shipping_city,
    shipping_city: order.shipping_city,
    shippingCountry: order.shipping_country,
    shipping_country: order.shipping_country,
    shippingPostalCode: order.shipping_postal_code,
    shipping_postal_code: order.shipping_postal_code,
    shippingPhone: order.shipping_phone,
    shipping_phone: order.shipping_phone,

    // Tracking
    trackingNumber: order.tracking_number,
    tracking_number: order.tracking_number,
    trackingUrl: order.tracking_url,
    tracking_url: order.tracking_url,
    carrier: order.carrier,
    estimatedDelivery: order.estimated_delivery,
    estimated_delivery: order.estimated_delivery,

    // Items
    items: (order.items || []).map(item => ({
      id: item.order_item_id || item.id,
      itemId: item.order_item_id || item.id,
      order_item_id: item.order_item_id || item.id,
      productId: item.product_id,
      product_id: item.product_id,
      productName: item.product_name,
      product_name: item.product_name,
      variantId: item.variant_id,
      variant_id: item.variant_id,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price) || 0,
      unit_price: parseFloat(item.unit_price) || 0,
      totalPrice: parseFloat(item.total_price) || 0,
      total_price: parseFloat(item.total_price) || 0,
      colorName: item.color_name,
      color_name: item.color_name,
      sizeName: item.size_name,
      size_name: item.size_name,
      image: item.image || item.product_image,
    })),
    itemCount: order.item_count || (order.items?.length || 0),
    item_count: order.item_count || (order.items?.length || 0),

    // Notes
    notes: order.notes,
    adminNotes: order.admin_notes,
    admin_notes: order.admin_notes,
    cancellationReason: order.cancellation_reason,
    cancellation_reason: order.cancellation_reason,

    // Refund
    refundAmount: parseFloat(order.refund_amount) || 0,
    refund_amount: parseFloat(order.refund_amount) || 0,
    refundReason: order.refund_reason,
    refund_reason: order.refund_reason,
    refundedAt: order.refunded_at,
    refunded_at: order.refunded_at,

    // Timestamps
    createdAt: order.created_at,
    created_at: order.created_at,
    updatedAt: order.updated_at,
    updated_at: order.updated_at,
    confirmedAt: order.confirmed_at,
    confirmed_at: order.confirmed_at,
    shippedAt: order.shipped_at,
    shipped_at: order.shipped_at,
    deliveredAt: order.delivered_at,
    delivered_at: order.delivered_at,
    cancelledAt: order.cancelled_at,
    cancelled_at: order.cancelled_at,

    // Meta
    createdBy: order.created_by,
    created_by: order.created_by,
    updatedBy: order.updated_by,
    updated_by: order.updated_by,
  };
};

/**
 * Helper: Format pagination response
 */
const formatPaginationResponse = (result) => {
  const items = (result.items || result.data || result.orders || []).map(formatOrder);

  return {
    items: items,
    data: items,
    orders: items,
    pagination: {
      page: result.page || result.pagination?.page || 1,
      limit: result.limit || result.pagination?.limit || 10,
      total: result.total || result.pagination?.total || items.length,
      totalPages: result.totalPages || result.pagination?.totalPages || 1,
      hasMore: result.hasMore || result.pagination?.hasMore || false,
    },
    page: result.page || 1,
    limit: result.limit || 10,
    total: result.total || items.length,
    totalPages: result.totalPages || 1,
  };
};

/**
 * Get all orders
 */
const getAll = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      payment_status, paymentStatus,
      payment_method, paymentMethod,
      user_id, userId,
      date_from, dateFrom,
      date_to, dateTo,
      min_total, minTotal,
      max_total, maxTotal,
      sort = 'created_at',
      order = 'DESC',
      sortBy, sort_by,
      sortOrder, sort_order,
    } = req.query;

    const result = await orderService.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      payment_status: payment_status || paymentStatus,
      payment_method: payment_method || paymentMethod,
      user_id: parseInt(user_id || userId) || undefined,
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
      min_total: parseFloat(min_total || minTotal) || undefined,
      max_total: parseFloat(max_total || maxTotal) || undefined,
      sort: sortBy || sort_by || sort,
      order: sortOrder || sort_order || order,
    });

    return successResponse(res, formatPaginationResponse(result), 'Orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await orderService.getById(id);

    if (!order) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    return successResponse(res, formatOrder(order));
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by order number
 */
const getByOrderNumber = async (req, res, next) => {
  try {
    const { order_number, orderNumber } = req.params;
    const orderNum = order_number || orderNumber;

    const order = await orderService.getByOrderNumber(orderNum);

    if (!order) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    return successResponse(res, formatOrder(order));
  } catch (error) {
    next(error);
  }
};

/**
 * Create new order (manual order by admin)
 */
const create = async (req, res, next) => {
  try {
    const {
      user_id, userId,
      items,
      shipping_address, shippingAddress,
      shipping_city, shippingCity,
      shipping_country, shippingCountry,
      shipping_postal_code, shippingPostalCode,
      shipping_phone, shippingPhone,
      payment_method, paymentMethod,
      notes,
      discount_amount, discountAmount,
      shipping_cost, shippingCost,
    } = req.body;

    const userIdValue = user_id || userId;
    const address = shipping_address || shippingAddress;
    const city = shipping_city || shippingCity;
    const phone = shipping_phone || shippingPhone;

    // Validate required fields
    if (!userIdValue || !items || items.length === 0) {
      return errorResponse(
        res,
        'User ID and items are required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    if (!address || !city || !phone) {
      return errorResponse(
        res,
        'Shipping address, city, and phone are required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const order = await orderService.create({
      user_id: userIdValue,
      items,
      shipping_address: address,
      shipping_city: city,
      shipping_country: shipping_country || shippingCountry,
      shipping_postal_code: shipping_postal_code || shippingPostalCode,
      shipping_phone: phone,
      payment_method: payment_method || paymentMethod || 'cash',
      notes,
      discount_amount: parseFloat(discount_amount || discountAmount) || 0,
      shipping_cost: parseFloat(shipping_cost || shippingCost) || 0,
      created_by: req.admin?.adminId,
    });

    return successResponse(res, formatOrder(order), 'Order created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update order
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      shipping_address, shippingAddress,
      shipping_city, shippingCity,
      shipping_country, shippingCountry,
      shipping_postal_code, shippingPostalCode,
      shipping_phone, shippingPhone,
      notes,
      discount_amount, discountAmount,
      shipping_cost, shippingCost,
    } = req.body;

    const existingOrder = await orderService.getById(id);
    if (!existingOrder) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    if (['delivered', 'cancelled'].includes(existingOrder.status)) {
      return errorResponse(
        res,
        `Cannot modify ${existingOrder.status} orders`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const updateData = {};
    const address = shipping_address ?? shippingAddress;
    const city = shipping_city ?? shippingCity;
    const country = shipping_country ?? shippingCountry;
    const postalCode = shipping_postal_code ?? shippingPostalCode;
    const phone = shipping_phone ?? shippingPhone;
    const discount = discount_amount ?? discountAmount;
    const shipping = shipping_cost ?? shippingCost;

    if (address !== undefined) updateData.shipping_address = address;
    if (city !== undefined) updateData.shipping_city = city;
    if (country !== undefined) updateData.shipping_country = country;
    if (postalCode !== undefined) updateData.shipping_postal_code = postalCode;
    if (phone !== undefined) updateData.shipping_phone = phone;
    if (notes !== undefined) updateData.notes = notes;
    if (discount !== undefined) updateData.discount_amount = parseFloat(discount);
    if (shipping !== undefined) updateData.shipping_cost = parseFloat(shipping);

    updateData.updated_by = req.admin?.adminId;

    const order = await orderService.update(id, updateData);

    return successResponse(res, formatOrder(order), 'Order updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 */
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notify_customer, notifyCustomer, note } = req.body;

    const existingOrder = await orderService.getById(id);
    if (!existingOrder) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return errorResponse(
        res,
        `Invalid status. Valid statuses are: ${VALID_STATUSES.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Check status flow rules
    if (!STATUS_FLOW[existingOrder.status]?.includes(status)) {
      return errorResponse(
        res,
        `Cannot change status from ${existingOrder.status} to ${status}`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const notify = (notify_customer ?? notifyCustomer) === 'true' || (notify_customer ?? notifyCustomer) === true;

    const order = await orderService.updateStatus(id, {
      status,
      notify_customer: notify,
      note,
      updated_by: req.admin?.adminId,
    });

    return successResponse(res, formatOrder(order), `Order status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Update payment status
 */
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      payment_status, paymentStatus,
      payment_reference, paymentReference,
      notify_customer, notifyCustomer 
    } = req.body;

    const pStatus = payment_status || paymentStatus;

    const existingOrder = await orderService.getById(id);
    if (!existingOrder) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    if (!VALID_PAYMENT_STATUSES.includes(pStatus)) {
      return errorResponse(
        res,
        `Invalid payment status. Valid statuses are: ${VALID_PAYMENT_STATUSES.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const notify = (notify_customer ?? notifyCustomer) === 'true' || (notify_customer ?? notifyCustomer) === true;

    const order = await orderService.updatePaymentStatus(id, {
      payment_status: pStatus,
      payment_reference: payment_reference || paymentReference,
      notify_customer: notify,
      updated_by: req.admin?.adminId,
    });

    return successResponse(res, formatOrder(order), `Payment status updated to ${pStatus}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel order
 */
const cancel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      reason, 
      notify_customer, notifyCustomer,
      restock_items, restockItems 
    } = req.body;

    const existingOrder = await orderService.getById(id);
    if (!existingOrder) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    if (existingOrder.status === 'delivered') {
      return errorResponse(
        res,
        'Cannot cancel delivered orders. Please process a refund instead.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (existingOrder.status === 'cancelled') {
      return errorResponse(
        res,
        'Order is already cancelled',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const notify = (notify_customer ?? notifyCustomer) === 'true' || (notify_customer ?? notifyCustomer) === true;
    const restock = (restock_items ?? restockItems) === 'true' || (restock_items ?? restockItems) === true;

    const order = await orderService.cancel(id, {
      reason,
      notify_customer: notify,
      restock_items: restock,
      cancelled_by: req.admin?.adminId,
    });

    return successResponse(res, formatOrder(order), 'Order cancelled successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete order
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingOrder = await orderService.getById(id);
    if (!existingOrder) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    if (!['cancelled', 'pending'].includes(existingOrder.status)) {
      return errorResponse(
        res,
        'Only cancelled or pending orders can be deleted',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    await orderService.remove(id);

    return successResponse(res, null, 'Order deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get order items
 */
const getOrderItems = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingOrder = await orderService.getById(id);
    if (!existingOrder) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const items = await orderService.getItems(id);

    return successResponse(res, items, 'Order items retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to order
 */
const addItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { product_id, productId, variant_id, variantId, quantity, unit_price, unitPrice } = req.body;

    const existingOrder = await orderService.getById(id);
    if (!existingOrder) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    if (['delivered', 'cancelled', 'shipped'].includes(existingOrder.status)) {
      return errorResponse(
        res,
        `Cannot add items to ${existingOrder.status} orders`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const item = await orderService.addItem(id, {
      product_id: product_id || productId,
      variant_id: variant_id || variantId,
      quantity: parseInt(quantity),
      unit_price: parseFloat(unit_price || unitPrice),
    });

    return successResponse(res, item, 'Item added to order', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update order item
 */
const updateItem = async (req, res, next) => {
  try {
    const { id, itemId, item_id } = req.params;
    const iId = itemId || item_id;
    const { quantity, unit_price, unitPrice } = req.body;

    const existingOrder = await orderService.getById(id);
    if (!existingOrder) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    if (['delivered', 'cancelled', 'shipped'].includes(existingOrder.status)) {
      return errorResponse(
        res,
        `Cannot update items in ${existingOrder.status} orders`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const updateData = {};
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if ((unit_price ?? unitPrice) !== undefined) updateData.unit_price = parseFloat(unit_price || unitPrice);

    const item = await orderService.updateItem(iId, updateData);

    return successResponse(res, item, 'Order item updated');
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from order
 */
const removeItem = async (req, res, next) => {
  try {
    const { id, itemId, item_id } = req.params;
    const iId = itemId || item_id;

    const existingOrder = await orderService.getById(id);
    if (!existingOrder) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    if (['delivered', 'cancelled', 'shipped'].includes(existingOrder.status)) {
      return errorResponse(
        res,
        `Cannot remove items from ${existingOrder.status} orders`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    await orderService.removeItem(id, iId);

    return successResponse(res, null, 'Item removed from order');
  } catch (error) {
    next(error);
  }
};

/**
 * Get order history
 */
const getHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingOrder = await orderService.getById(id);
    if (!existingOrder) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const history = await orderService.getHistory(id);

    return successResponse(res, history, 'Order history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Add tracking information
 */
const addTracking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      tracking_number, trackingNumber,
      tracking_url, trackingUrl,
      carrier,
      estimated_delivery, estimatedDelivery,
      notify_customer, notifyCustomer 
    } = req.body;

    const existingOrder = await orderService.getById(id);
    if (!existingOrder) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const trackNum = tracking_number || trackingNumber;
    if (!trackNum) {
      return errorResponse(
        res,
        'Tracking number is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const notify = (notify_customer ?? notifyCustomer) === 'true' || (notify_customer ?? notifyCustomer) === true;

    const order = await orderService.addTracking(id, {
      tracking_number: trackNum,
      tracking_url: tracking_url || trackingUrl,
      carrier,
      estimated_delivery: estimated_delivery || estimatedDelivery,
      notify_customer: notify,
      updated_by: req.admin?.adminId,
    });

    return successResponse(res, formatOrder(order), 'Tracking information added');
  } catch (error) {
    next(error);
  }
};

/**
 * Add note to order
 */
const addNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, is_internal, isInternal } = req.body;

    const existingOrder = await orderService.getById(id);
    if (!existingOrder) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    if (!note || note.trim() === '') {
      return errorResponse(
        res,
        'Note content is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const internal = (is_internal ?? isInternal) === 'true' || (is_internal ?? isInternal) === true;

    const result = await orderService.addNote(id, {
      note,
      is_internal: internal,
      admin_id: req.admin?.adminId,
    });

    return successResponse(res, result, 'Note added to order');
  } catch (error) {
    next(error);
  }
};

/**
 * Get order notes
 */
const getNotes = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingOrder = await orderService.getById(id);
    if (!existingOrder) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const notes = await orderService.getNotes(id);

    return successResponse(res, notes, 'Order notes retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get orders by status
 */
const getByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!VALID_STATUSES.includes(status)) {
      return errorResponse(
        res,
        `Invalid status. Valid statuses are: ${VALID_STATUSES.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const result = await orderService.getByStatus(status, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, formatPaginationResponse(result), `${status} orders retrieved`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get orders by user
 */
const getByUser = async (req, res, next) => {
  try {
    const { userId, user_id } = req.params;
    const uId = userId || user_id;
    const { page = 1, limit = 10 } = req.query;

    const result = await orderService.getByUser(uId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, formatPaginationResponse(result), 'User orders retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * Get order statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const { period = 'month', date_from, dateFrom, date_to, dateTo } = req.query;

    const stats = await orderService.getStatistics({
      period,
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
    });

    // Format with both naming conventions
    const formattedStats = {
      totalOrders: stats.total_orders || stats.totalOrders || 0,
      total_orders: stats.total_orders || stats.totalOrders || 0,
      totalRevenue: stats.total_revenue || stats.totalRevenue || 0,
      total_revenue: stats.total_revenue || stats.totalRevenue || 0,
      averageOrderValue: stats.average_order_value || stats.averageOrderValue || 0,
      average_order_value: stats.average_order_value || stats.averageOrderValue || 0,
      pendingOrders: stats.pending_orders || stats.pendingOrders || 0,
      pending_orders: stats.pending_orders || stats.pendingOrders || 0,
      completedOrders: stats.completed_orders || stats.completedOrders || 0,
      completed_orders: stats.completed_orders || stats.completedOrders || 0,
      cancelledOrders: stats.cancelled_orders || stats.cancelledOrders || 0,
      cancelled_orders: stats.cancelled_orders || stats.cancelledOrders || 0,
      todayOrders: stats.today_orders || stats.todayOrders || 0,
      today_orders: stats.today_orders || stats.todayOrders || 0,
      todayRevenue: stats.today_revenue || stats.todayRevenue || 0,
      today_revenue: stats.today_revenue || stats.todayRevenue || 0,
    };

    return successResponse(res, formattedStats, 'Order statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get order counts by status
 */
const getCountByStatus = async (req, res, next) => {
  try {
    const counts = await orderService.getCountByStatus();

    // Format with both naming conventions
    const formattedCounts = {};
    for (const status of VALID_STATUSES) {
      formattedCounts[status] = counts[status] || 0;
    }
    formattedCounts.total = counts.total || Object.values(formattedCounts).reduce((a, b) => a + b, 0);

    return successResponse(res, formattedCounts, 'Order counts retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update order status
 */
const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { order_ids, orderIds, ids, status, notify_customers, notifyCustomers } = req.body;
    const orderIdList = order_ids || orderIds || ids;

    if (!orderIdList || !Array.isArray(orderIdList) || orderIdList.length === 0) {
      return errorResponse(
        res,
        'Order IDs array is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return errorResponse(
        res,
        `Invalid status. Valid statuses are: ${VALID_STATUSES.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const notify = (notify_customers ?? notifyCustomers) === 'true' || (notify_customers ?? notifyCustomers) === true;

    const result = await orderService.bulkUpdateStatus(orderIdList, {
      status,
      notify_customers: notify,
      updated_by: req.admin?.adminId,
    });

    return successResponse(res, result, `${result.updated} orders updated successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Export orders to Excel
 */
const exportToExcel = async (req, res, next) => {
  try {
    const { status, payment_status, paymentStatus, date_from, dateFrom, date_to, dateTo } = req.query;

    const excelBuffer = await orderService.exportToExcel({
      status,
      payment_status: payment_status || paymentStatus,
      date_from: date_from || dateFrom,
      date_to: date_to || dateTo,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Generate invoice PDF
 */
const generateInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingOrder = await orderService.getById(id);
    if (!existingOrder) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const pdfBuffer = await orderService.generateInvoice(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${existingOrder.order_number}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Generate packing slip PDF
 */
const generatePackingSlip = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingOrder = await orderService.getById(id);
    if (!existingOrder) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const pdfBuffer = await orderService.generatePackingSlip(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=packing-slip-${existingOrder.order_number}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Print order
 */
const print = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type = 'invoice' } = req.query;

    const existingOrder = await orderService.getById(id);
    if (!existingOrder) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const printData = await orderService.getPrintData(id, type);

    return successResponse(res, printData, 'Print data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Send order confirmation email
 */
const sendConfirmationEmail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingOrder = await orderService.getById(id);
    if (!existingOrder) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    await orderService.sendConfirmationEmail(id);

    return successResponse(res, null, 'Confirmation email sent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Refund order
 */
const refund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, reason, restock_items, restockItems } = req.body;

    const existingOrder = await orderService.getById(id);
    if (!existingOrder) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    if (existingOrder.payment_status !== 'paid') {
      return errorResponse(
        res,
        'Can only refund paid orders',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const restock = (restock_items ?? restockItems) === 'true' || (restock_items ?? restockItems) === true;

    const order = await orderService.refund(id, {
      amount: amount ? parseFloat(amount) : existingOrder.total_amount,
      reason,
      restock_items: restock,
      refunded_by: req.admin?.adminId,
    });

    return successResponse(res, formatOrder(order), 'Order refunded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Duplicate order
 */
const duplicate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingOrder = await orderService.getById(id);
    if (!existingOrder) {
      return errorResponse(
        res,
        'Order not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    const newOrder = await orderService.duplicate(id, req.admin?.adminId);

    return successResponse(res, formatOrder(newOrder), 'Order duplicated successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Search orders
 */
const search = async (req, res, next) => {
  try {
    const { q, query, page = 1, limit = 10 } = req.query;
    const searchQuery = q || query;

    if (!searchQuery) {
      return errorResponse(
        res,
        'Search query is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
    }

    const result = await orderService.search({
      query: searchQuery,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return successResponse(res, formatPaginationResponse(result), 'Search results retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent orders
 */
const getRecent = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const orders = await orderService.getRecent({
      limit: parseInt(limit),
    });

    const formattedOrders = (orders || []).map(formatOrder);
    return successResponse(res, formattedOrders, 'Recent orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  getByOrderNumber,
  create,
  update,
  updateStatus,
  updatePaymentStatus,
  cancel,
  remove,
  getOrderItems,
  addItem,
  updateItem,
  removeItem,
  getHistory,
  addTracking,
  addNote,
  getNotes,
  getByStatus,
  getByUser,
  getStatistics,
  getCountByStatus,
  bulkUpdateStatus,
  exportToExcel,
  generateInvoice,
  generatePackingSlip,
  print,
  sendConfirmationEmail,
  refund,
  duplicate,
  search,
  getRecent,
  // Export constants for frontend reference
  VALID_STATUSES,
  VALID_PAYMENT_STATUSES,
  VALID_PAYMENT_METHODS,
  STATUS_FLOW,
};