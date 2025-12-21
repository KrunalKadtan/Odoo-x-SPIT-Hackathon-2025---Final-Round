import React, { useState, useEffect } from 'react';
import { adminAPI, errorUtils } from '../utils/api';
import { StatusBadge } from './Badge';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import Modal from './Modal';

const VendorDocumentViewer = ({
  vendorId,
  isOpen,
  onClose,
  onDocumentVerified
}) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verifyingDocument, setVerifyingDocument] = useState(null);

  // Load vendor documents
  const loadDocuments = async () => {
    if (!vendorId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAPI.getVendorDocuments(vendorId);
      setDocuments(response.results || response);
    } catch (err) {
      console.error('Failed to load vendor documents:', err);
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Load documents when modal opens
  useEffect(() => {
    if (isOpen && vendorId) {
      loadDocuments();
    }
  }, [isOpen, vendorId]);

  // Handle document verification
  const handleVerifyDocument = async (document, verified) => {
    try {
      setVerifyingDocument(document.id);
      
      await adminAPI.verifyVendorDocument(vendorId, document.id, { verified });
      
      // Update document status in local state
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          doc.id === document.id 
            ? { ...doc, verified, verification_date: new Date().toISOString() }
            : doc
        )
      );
      
      if (onDocumentVerified) {
        onDocumentVerified(document, verified);
      }
    } catch (err) {
      console.error('Failed to verify document:', err);
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setVerifyingDocument(null);
    }
  };

  const getDocumentTypeLabel = (type) => {
    const labels = {
      business_license: 'Business License',
      tax_certificate: 'Tax Certificate',
      identity_proof: 'Identity Proof',
      bank_details: 'Bank Details',
      address_proof: 'Address Proof'
    };
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'business_license':
        return (
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'tax_certificate':
        return (
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'identity_proof':
        return (
          <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Vendor Documents" size="large">
        <LoadingSpinner size="large" text="Loading documents..." />
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vendor Documents" size="large">
      <div className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-pro">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {documents.length === 0 ? (
          <div className="text-center py-8 text-app-muted">
            <svg className="w-12 h-12 mx-auto mb-4 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((document) => (
              <div key={document.id} className="border border-app-border rounded-pro p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getDocumentIcon(document.type)}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-app-main">
                        {getDocumentTypeLabel(document.type)}
                      </h4>
                      <p className="text-sm text-app-muted">{document.filename}</p>
                      <p className="text-xs text-app-muted">
                        Uploaded: {new Date(document.upload_date).toLocaleDateString()}
                      </p>
                      {document.verification_date && (
                        <p className="text-xs text-app-muted">
                          Verified: {new Date(document.verification_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <StatusBadge 
                      status={document.verified ? 'verified' : 'pending'} 
                      size="small" 
                    />
                    
                    <div className="flex space-x-2">
                      {/* View Document Button */}
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Open document in new tab
                          window.open(document.file_url, '_blank');
                        }}
                        fullWidth={false}
                        className="px-3 py-1 text-xs"
                      >
                        View
                      </Button>
                      
                      {/* Verification Buttons */}
                      {!document.verified && (
                        <>
                          <Button
                            variant="primary"
                            onClick={() => handleVerifyDocument(document, true)}
                            disabled={verifyingDocument === document.id}
                            fullWidth={false}
                            className="px-3 py-1 text-xs"
                          >
                            {verifyingDocument === document.id ? 'Verifying...' : 'Verify'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleVerifyDocument(document, false)}
                            disabled={verifyingDocument === document.id}
                            fullWidth={false}
                            className="px-3 py-1 text-xs text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {document.verified && (
                        <Button
                          variant="outline"
                          onClick={() => handleVerifyDocument(document, false)}
                          disabled={verifyingDocument === document.id}
                          fullWidth={false}
                          className="px-3 py-1 text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
                        >
                          Unverify
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Document Summary */}
        {documents.length > 0 && (
          <div className="mt-6 p-4 bg-app-secondary/30 rounded-pro">
            <div className="flex justify-between items-center text-sm">
              <span className="text-app-main font-medium">Document Summary:</span>
              <div className="flex space-x-4 text-app-muted">
                <span>Total: {documents.length}</span>
                <span>Verified: {documents.filter(d => d.verified).length}</span>
                <span>Pending: {documents.filter(d => !d.verified).length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default VendorDocumentViewer;