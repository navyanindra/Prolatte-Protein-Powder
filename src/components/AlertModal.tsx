import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  type = 'info',
  title,
  message
}) => {
  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle2 className="text-green-500" size={48} />,
    error: <AlertCircle className="text-red-500" size={48} />,
    info: <Info className="text-blue-500" size={48} />
  };

  const colors = {
    success: 'from-green-50 to-emerald-50',
    error: 'from-red-50 to-rose-50',
    info: 'from-blue-50 to-sky-50'
  };

  const buttonColors = {
    success: 'bg-green-600 hover:bg-green-700',
    error: 'bg-red-600 hover:bg-red-700',
    info: 'bg-blue-600 hover:bg-blue-700'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className={`bg-gradient-to-br ${colors[type]} p-6 rounded-t-3xl flex items-center justify-center`}>
          {icons[type]}
        </div>
        
        <div className="p-6 text-center">
          {title && (
            <h3 className="text-xl font-black text-gray-900 mb-3">
              {title}
            </h3>
          )}
          <p className="text-gray-700 text-base leading-relaxed">
            {message}
          </p>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className={`w-full ${buttonColors[type]} text-white font-bold py-3 px-6 rounded-2xl transition transform active:scale-95 shadow-lg`}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
