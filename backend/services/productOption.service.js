/**
 * Product Option Service
 * @module services/productOption
 */

const ProductOption = require('../models/productOption.model');

class ProductOptionService {
  // ==================== Option Types ====================

  async getAllTypes(options) {
    return await ProductOption.getAllTypes(options);
  }

  async getTypeById(typeId) {
    return await ProductOption.getTypeById(typeId);
  }

  async createType(data) {
    return await ProductOption.createType(data);
  }

  async updateType(typeId, data) {
    return await ProductOption.updateType(typeId, data);
  }

  async deleteType(typeId) {
    return await ProductOption.deleteType(typeId);
  }

  async isTypeUsedInProducts(typeId) {
    return await ProductOption.isTypeUsedInProducts(typeId);
  }

  // ==================== Option Values ====================

  async getValuesByType(typeId, options) {
    return await ProductOption.getValuesByType(typeId, options);
  }

  async getValueById(valueId) {
    return await ProductOption.getValueById(valueId);
  }

  async createValue(data) {
    return await ProductOption.createValue(data);
  }

  async updateValue(valueId, data) {
    return await ProductOption.updateValue(valueId, data);
  }

  async deleteValue(valueId) {
    return await ProductOption.deleteValue(valueId);
  }

  async bulkCreateValues(typeId, valuesArray) {
    return await ProductOption.bulkCreateValues(typeId, valuesArray);
  }

  async updateValuesOrder(typeId, orderArray) {
    return await ProductOption.updateValuesOrder(typeId, orderArray);
  }

  // ==================== Product Options ====================

  async getProductOptions(productId) {
    return await ProductOption.getProductOptions(productId);
  }

  async setProductOptions(productId, options) {
    return await ProductOption.setProductOptions(productId, options);
  }

  async addProductOption(productId, optionTypeId, isRequired) {
    return await ProductOption.addProductOption(productId, optionTypeId, isRequired);
  }

  async removeProductOption(productId, optionTypeId) {
    return await ProductOption.removeProductOption(productId, optionTypeId);
  }

  async getStatistics() {
    return await ProductOption.getStatistics();
  }
}

module.exports = new ProductOptionService();
