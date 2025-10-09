"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DocumentManager() {
  const router = useRouter();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filter, setFilter] = useState("all"); // all, lease, maintenance, legal, other

  useEffect(() => {
    fetchDocuments();
  }, [filter]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/documents?type=${filter}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', document.getElementById('documentType').value);
    formData.append('description', document.getElementById('description').value);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/documents', true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          fetchDocuments();
          setUploadProgress(0);
        } else {
          throw new Error('Upload failed');
        }
      };

      xhr.send(formData);
    } catch (err) {
      setError(err.message);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete document');
      fetchDocuments();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Document Manager</h2>
        <div className="space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="all">All Documents</option>
            <option value="lease">Lease Agreements</option>
            <option value="maintenance">Maintenance Records</option>
            <option value="legal">Legal Documents</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Upload New Document</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Document Type</label>
            <select
              id="documentType"
              className="w-full p-2 border rounded"
            >
              <option value="lease">Lease Agreement</option>
              <option value="maintenance">Maintenance Record</option>
              <option value="legal">Legal Document</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              id="description"
              className="w-full p-2 border rounded"
              placeholder="Enter document description"
            />
          </div>
        </div>
        <div className="mt-4">
          <input
            type="file"
            onChange={handleUpload}
            className="w-full p-2 border rounded"
            accept=".pdf,.doc,.docx,.txt"
          />
        </div>
        {uploadProgress > 0 && (
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded">
              <div
                className="h-2 bg-blue-600 rounded"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {documents.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No documents found
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-6 h-6 text-gray-400"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <span className="font-medium">{doc.name}</span>
                      <span className={`px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800`}>
                        {doc.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {doc.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.open(doc.url, '_blank')}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}