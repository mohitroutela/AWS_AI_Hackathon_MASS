/**
 * File Upload Service
 * Handles file uploads to AWS API
 */

// Use relative URL for development (proxied through Vite)
// Use full URL for production
const UPLOAD_API_URL = import.meta.env.PROD 
  ? 'https://u82pd9timk.execute-api.us-east-1.amazonaws.com/prod/upload'
  : '/upload';

export interface UploadRequest {
  filename: string;
  content_type: string;
  file_size: number;
  category: string; // sales, inventory, competitor, etc.
}

export interface UploadResponse {
  success: boolean;
  message: string;
  upload_id?: string;
  /** Presigned S3 URL for direct upload (API may return as upload_url or presigned_url) */
  presigned_url?: string;
  upload_url?: string;
  file_key?: string;
  expires_in?: number;
  bucket?: string;
  timestamp?: string;
}

/**
 * Request file upload from API
 */
export async function requestFileUpload(
  file: File,
  category: string
): Promise<UploadResponse> {
  try {
    const payload: UploadRequest = {
      filename: file.name,
      content_type: file.type || 'application/octet-stream',
      file_size: file.size,
      category: category
    };

    const response = await fetch(UPLOAD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload request failed: ${response.status} - ${errorText}`);
    }

    const result: UploadResponse = await response.json();
    
    // API returns upload_url; normalize for presigned flow
    const presignedUrl = result.upload_url ?? result.presigned_url;
    if (presignedUrl && !result.success) {
      result.success = true;
      result.message = result.message || 'Upload URL received';
    }
    
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Upload file to presigned URL (if provided by API)
 */
export async function uploadFileToPresignedUrl(
  file: File,
  presignedUrl: string
): Promise<void> {
  try {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Complete file upload process
 */
export async function uploadFile(
  file: File,
  category: string,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> {
  try {
    // Step 1: Request upload
    if (onProgress) onProgress(10);
    const uploadResponse = await requestFileUpload(file, category);

    // Step 2: Upload to presigned URL if provided (API returns upload_url)
    const presignedUrl = uploadResponse.upload_url ?? uploadResponse.presigned_url;
    if (presignedUrl) {
      if (onProgress) onProgress(30);
      await uploadFileToPresignedUrl(file, presignedUrl);
      if (onProgress) onProgress(100);
      uploadResponse.success = true;
      uploadResponse.message = uploadResponse.message || 'File uploaded successfully';
    } else {
      if (onProgress) onProgress(100);
    }

    // Ensure success is true if we got here without errors
    if (uploadResponse.success === undefined) {
      uploadResponse.success = true;
    }

    return uploadResponse;
  } catch (error) {
    // Return error response
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}
