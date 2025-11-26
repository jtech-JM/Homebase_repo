'use client';

import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';

export default function ReuploadRequest({ verification, onReupload }) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('student_id_document', file);

      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/verification/upload-document/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        alert('Document uploaded successfully! It will be reviewed shortly.');
        if (onReupload) onReupload();
      } else {
        const error = await response.json();
        alert(`Upload failed: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  if (verification.overall_status !== 'requires_additional_info') {
    return null;
  }

  return (
    <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-orange-900 mb-2">
            Document Re-upload Required
          </h3>
          
          <div className="bg-white p-4 rounded mb-4">
            <p className="text-sm text-gray-600 mb-2">Admin Notes:</p>
            <p className="text-sm whitespace-pre-wrap">{verification.agent_notes}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded mb-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              Tips for a Clear Student ID Photo:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Use good lighting - natural daylight works best</li>
              <li>Ensure all text is clearly visible and in focus</li>
              <li>Avoid glare or reflections on the ID card</li>
              <li>Take the photo straight-on, not at an angle</li>
              <li>Make sure your student ID number is clearly readable</li>
              <li>Include the university logo/name in the photo</li>
              <li>Use a high-resolution camera (avoid low-quality screenshots)</li>
            </ul>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Upload New Student ID Document
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            {preview && (
              <div>
                <p className="text-sm font-medium mb-2">Preview:</p>
                <img
                  src={preview}
                  alt="Preview"
                  className="max-w-md rounded border"
                />
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload New Document
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
