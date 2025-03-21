const request = require('supertest');
const express = require('express');
const multer = require('multer');
const path = require('path');
require('../setup');

jest.mock('cloudinary');

describe('Upload Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Mock multer for file uploads
    const storage = multer.memoryStorage();
    const upload = multer({ storage: storage });
    app.use(upload.any());
    
    const uploadRoutes = require('../../src/Routes/uploadRoutes');
    app.use('/api/upload', uploadRoutes);
  });

  describe('POST /api/upload/image', () => {
    it('should upload an image successfully', async () => {
      const testFile = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test image content'),
        size: 1024
      };

      // Mock Cloudinary response
      require('cloudinary').v2.uploader.upload.mockResolvedValue({
        secure_url: 'https://cloudinary.com/test-image.jpg'
      });

      const response = await request(app)
        .post('/api/upload/image')
        .attach('image', testFile.buffer, testFile.originalname)
        .expect(200);

      expect(response.body).toHaveProperty('url', 'https://cloudinary.com/test-image.jpg');
    });

    it('should handle invalid file type', async () => {
      const invalidFile = {
        fieldname: 'image',
        originalname: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        buffer: Buffer.from('test content'),
        size: 1024
      };

      await request(app)
        .post('/api/upload/image')
        .attach('image', invalidFile.buffer, invalidFile.originalname)
        .expect(400);
    });
  });

  describe('POST /api/upload/gpx', () => {
    it('should upload a GPX file successfully', async () => {
      const testGpx = {
        fieldname: 'gpx',
        originalname: 'route.gpx',
        encoding: '7bit',
        mimetype: 'application/gpx+xml',
        buffer: Buffer.from('<?xml version="1.0"?><gpx></gpx>'),
        size: 1024
      };

      // Mock Cloudinary response
      require('cloudinary').v2.uploader.upload.mockResolvedValue({
        secure_url: 'https://cloudinary.com/test-route.gpx'
      });

      const response = await request(app)
        .post('/api/upload/gpx')
        .attach('gpx', testGpx.buffer, testGpx.originalname)
        .expect(200);

      expect(response.body).toHaveProperty('url', 'https://cloudinary.com/test-route.gpx');
    });

    it('should handle invalid GPX file', async () => {
      const invalidGpx = {
        fieldname: 'gpx',
        originalname: 'invalid.gpx',
        encoding: '7bit',
        mimetype: 'application/gpx+xml',
        buffer: Buffer.from('invalid content'),
        size: 1024
      };

      await request(app)
        .post('/api/upload/gpx')
        .attach('gpx', invalidGpx.buffer, invalidGpx.originalname)
        .expect(400);
    });
  });

  describe('Error handling', () => {
    it('should handle Cloudinary upload errors', async () => {
      const testFile = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test image content'),
        size: 1024
      };

      // Mock Cloudinary error
      require('cloudinary').v2.uploader.upload.mockRejectedValue(
        new Error('Upload failed')
      );

      await request(app)
        .post('/api/upload/image')
        .attach('image', testFile.buffer, testFile.originalname)
        .expect(500);
    });
  });
});
