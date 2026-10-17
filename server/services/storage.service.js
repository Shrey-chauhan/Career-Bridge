const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary if credentials are provided in environment
const isCloudinaryConfigured = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name'
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Upload file buffer to cloud storage or fallback storage
 */
const uploadFile = (fileBuffer, { studentId, originalFileName, fileType }) => {
  return new Promise((resolve, reject) => {
    if (isCloudinaryConfigured()) {
      const folder = `careerbridge/resumes/${studentId}`;
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          public_id: `resume_${Date.now()}`,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            storageProvider: 'CLOUDINARY',
          });
        }
      );

      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    } else {
      // Development Fallback Mode (when Cloudinary environment credentials are empty)
      const mockPublicId = `mock_resume_${studentId}_${Date.now()}`;
      // Data URI or placeholder secure link for dev mode
      const base64Data = fileBuffer.toString('base64');
      const mockUrl = `data:${fileType};base64,${base64Data}`;

      resolve({
        publicId: mockPublicId,
        secureUrl: mockUrl,
        storageProvider: 'LOCAL',
      });
    }
  });
};

/**
 * Delete file from cloud storage
 */
const deleteFile = async (publicId, storageProvider = 'CLOUDINARY') => {
  if (isCloudinaryConfigured() && storageProvider === 'CLOUDINARY' && publicId) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    } catch (err) {
      console.error('Cloudinary deletion error:', err.message);
    }
  }
};

module.exports = {
  isCloudinaryConfigured,
  uploadFile,
  deleteFile,
};
