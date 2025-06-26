import React from 'react';
import { X } from 'lucide-react';

interface DocumentPreviewModalProps {
  file: File;
  onClose: () => void;
}

export function DocumentPreviewModal({ file, onClose }: DocumentPreviewModalProps) {
  const [preview, setPreview] = React.useState<string>('');

  React.useEffect(() => {
    // Create a URL for the file
    const url = URL.createObjectURL(file);
    setPreview(url);

    // Cleanup
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {file.name}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {file.type.startsWith('image/') ? (
            <img
              src={preview}
              alt={file.name}
              className="max-w-full h-auto mx-auto"
            />
          ) : file.type === 'application/pdf' ? (
            <iframe
              src={preview}
              className="w-full h-full min-h-[600px]"
              title={file.name}
            />
          ) : (
            <div className="text-center text-gray-500 py-8">
              Ce type de fichier ne peut pas être prévisualisé.
              <br />
              <a
                href={preview}
                download={file.name}
                className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
              >
                Télécharger le fichier
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}