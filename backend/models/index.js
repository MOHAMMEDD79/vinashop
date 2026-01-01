/**
 * Models Index
 * @module models
 */

const Address = require('./address.model');
const Admin = require('./admin.model');
const Auth = require('./auth.model');
const Billing = require('./billing.model');
const Cart = require('./cart.model');
const Category = require('./category.model');
const Image = require('./image.model');
const Message = require('./message.model');
const Notification = require('./notification.model');
const Order = require('./order.model');
const OrderItem = require('./orderItem.model');
const Product = require('./product.model');
const ProductOption = require('./productOption.model');
const ProductOptionCombination = require('./productOptionCombination.model');
const Review = require('./review.model');
const Subcategory = require('./subcategory.model');
const User = require('./user.model');
const Wishlist = require('./wishlist.model');

// DEPRECATED: Color, Size, Variant models removed in Phase 6
// Use ProductOption and ProductOptionCombination instead

module.exports = {
  Address,
  Admin,
  Auth,
  Billing,
  Cart,
  Category,
  Image,
  Message,
  Notification,
  Order,
  OrderItem,
  Product,
  ProductOption,
  ProductOptionCombination,
  Review,
  Subcategory,
  User,
  Wishlist,
};