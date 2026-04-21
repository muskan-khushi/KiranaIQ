import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { exportPDF } from '../../utils/exportPDF';
import type { AssessmentResult } from '../../api/types';

export default function ExportPDFButton({ data }: { data: AssessmentResult }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await exportPDF(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-card hover:shadow-card-hover disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Download size={16} />
      )}
      {loading ? 'Generating...' : 'Export Credit Memo'}
    </button>
  );
}