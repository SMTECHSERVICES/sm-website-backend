import { Readable } from 'stream';
import { randomUUID } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

const uploadFileOnCloudinary = async (buffer, filename = 'syllabus.pdf') => {
  if (!buffer) return;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: randomUUID(),
        resource_type: 'raw', // raw required for PDFs
        type: 'upload',
        filename_override: filename,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(null);
        }
        resolve(result.secure_url);
      }
    );

    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
};

export default uploadFileOnCloudinary;
