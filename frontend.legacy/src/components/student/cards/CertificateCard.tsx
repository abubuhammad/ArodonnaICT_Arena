import React from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Share2 } from 'lucide-react';
import { Certificate } from '../../../types';

interface CertificateCardProps {
  certificate: Certificate;
  onDownload: (certificateId: string) => void;
  onShare: (certificateId: string) => void;
}

const CertificateCard: React.FC<CertificateCardProps> = ({ certificate, onDownload, onShare }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-white rounded-xl shadow-md overflow-hidden"
  >
    <div className="p-4">
      <div className="flex items-center space-x-4 mb-4">
        <Award className="w-8 h-8 text-yellow-500" />
        <div>
          <h3 className="font-semibold">Course Certificate</h3>
          <p className="text-gray-600">Issued on {new Date(certificate.issueDate).toLocaleDateString()}</p>
        </div>
      </div>
      <p className="text-lg font-medium mb-2">Grade: {certificate.grade}</p>
      <div className="flex space-x-2">
        <button
          onClick={() => onDownload(certificate.id)}
          className="flex-1 flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </button>
        <button
          onClick={() => onShare(certificate.id)}
          className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>
    </div>
  </motion.div>
);

export default CertificateCard;
