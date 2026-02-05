
import React, { useEffect } from 'react';
import { PrintDocType, PrintBaseProps } from './print.types.ts';
import KartuPesertaPrint from './documents/KartuPeserta.print.tsx';
import BeritaAcaraPrint from './documents/BeritaAcara.print.tsx';
import DaftarHadirPrint from './documents/DaftarHadir.print.tsx';
import { PrintAnalisisButir } from './documents/AnalisisButir.print.tsx';
import { PrintLegerNilai } from './documents/LegerNilai.print.tsx';

interface PrintProviderProps extends PrintBaseProps {
  type: PrintDocType;
  examName?: string;
  data?: any[];
}

const PrintProvider: React.FC<PrintProviderProps> = (props) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
      if (props.onDone) props.onDone();
    }, 1000);
    return () => clearTimeout(timer);
  }, [props.onDone, props.type]);

  const renderDocument = () => {
    switch(props.type) {
      case 'KARTU': return <KartuPesertaPrint {...props} />;
      case 'BERITA_ACARA': return <BeritaAcaraPrint {...props} />;
      case 'DAFTAR_HADIR': return <DaftarHadirPrint {...props} />;
      case 'ANALISIS_BUTIR': return <PrintAnalisisButir school={props.school} schedule={props.schedule!} data={props.data!} onDone={props.onDone!} />;
      case 'LEGER_NILAI': return <PrintLegerNilai school={props.school} examName={props.examName!} data={props.data!} onDone={props.onDone!} />;
      default: return <div className="p-10">Tipe Dokumen Cetak Tidak Dikenali.</div>;
    }
  };

  return (
    <div className="emes-print-provider">
      <div className="no-print" style={{
        position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', gap: '10px'
      }}>
        <button 
          onClick={() => window.print()}
          style={{ padding: '10px 20px', background: '#064e3b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          CETAK ULANG
        </button>
        <button 
          onClick={() => props.onDone?.()}
          style={{ padding: '10px 20px', background: '#111', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          TUTUP
        </button>
      </div>

      <div className="print-content">
        {renderDocument()}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { overflow: visible !important; }
        }
      `}</style>
    </div>
  );
};

export default PrintProvider;
