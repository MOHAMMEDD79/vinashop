/**
 * Bill Image Service
 * @module services/billImage
 */

const BillImage = require('../models/billImage.model');
const fs = require('fs').promises;
const path = require('path');

class BillImageService {
  async getAll(options) {
    return await BillImage.getAll(options);
  }

  async getById(imageId) {
    return await BillImage.getById(imageId);
  }

  async create(data) {
    return await BillImage.create(data);
  }

  async update(imageId, data) {
    return await BillImage.update(imageId, data);
  }

  async delete(imageId) {
    // Get image info to delete file
    const image = await BillImage.getById(imageId);
    if (image && image.image_path) {
      try {
        const filePath = path.join(process.cwd(), image.image_path);
        await fs.unlink(filePath);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    return await BillImage.delete(imageId);
  }

  async bulkDelete(imageIds) {
    // Get images info to delete files
    for (const id of imageIds) {
      const image = await BillImage.getById(id);
      if (image && image.image_path) {
        try {
          const filePath = path.join(process.cwd(), image.image_path);
          await fs.unlink(filePath);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
    }

    return await BillImage.bulkDelete(imageIds);
  }

  async markAsProcessed(imageId) {
    return await BillImage.markAsProcessed(imageId);
  }

  async markAsUnprocessed(imageId) {
    return await BillImage.markAsUnprocessed(imageId);
  }

  async getStatistics(options) {
    return await BillImage.getStatistics(options);
  }

  async getByType(billType, options) {
    return await BillImage.getByType(billType, options);
  }

  async getUnprocessed(options) {
    return await BillImage.getUnprocessed(options);
  }

  async getMonthlySummary(year, month) {
    return await BillImage.getMonthlySummary(year, month);
  }

  async search(searchQuery, options) {
    return await BillImage.search(searchQuery, options);
  }
}

module.exports = new BillImageService();
