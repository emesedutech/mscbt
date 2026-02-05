import React from 'react';
import { PrintBaseProps, getIndoDateParts } from '../print.types.ts';
import { SchoolProfile } from '../../types.ts';

interface LegerNilaiPrintProps extends PrintBaseProps {
  examName: string;
  data: any[];
}

export const PrintLegerNilai: React.FC<LegerNilaiPrintProps> = ({ school, examName, data, onDone }) => {
  const printDate = getIndoDateParts(new Date().toISOString());
  const fmt = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  return (
    <div className="print-module-leger bg-white min-h-screen text-black font-serif">
      <style>{`
        @media print {
            @page { size: A4 portrait; margin: 10mm; }
            body { background: white; -webkit-print-color-adjust: exact; }
            .print-module-leger { display: block !important; }
            .page-break-inside-avoid { page-break-inside: avoid !important; }
        }
      `}</style>
      
      <div className="w-[210mm] min-h-[297mm] p-[10mm] box-border">
        {school?.kop_surat ? (
          <img src={school.kop_surat} alt="Kop Surat" className="w-full h-auto object-contain mb-8" />
        ) : (
          <div className="text-center mb-8 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black uppercase tracking-tight">{school?.nama_sekolah}</h1>
            <p className="text-xs">{school?.alamat}</p>
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-xl font-black underline">LEGER NILAI HASIL UJIAN</h1>
          <p className="text-sm font-bold mt-2">Ujian: {examName}</p>
        </div>

        <table className="w-full border-collapse border border-black text-[10pt]">
          <thead className="bg-gray-100 font-bold text-center">
            <tr>
              <th className="border border-black p-2 w-10">Rank</th>
              <th className="border border-black p-2 text-left">Nama Peserta</th>
              <th className="border border-black p-2 w-16">Benar</th>
              <th className="border border-black p-2 w-16">Salah</th>
              <th className="border border-black p-2 w-20">Nilai Akhir</th>
              <th className="border border-black p-2 w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r: any) => (
              <tr key={r.id}>
                <td className="border border-black p-2 text-center">{r.rank}</td>
                {/* FIX: Use snake_case for properties */}
                <td className="border border-black p-2 font-bold uppercase">{r.student_name}</td>
                <td className="border border-black p-2 text-center">{r.correct}</td>
                <td className="border border-black p-2 text-center">{r.incorrect}</td>
                <td className="border border-black p-2 text-center font-black">{fmt(r.final_grade)}</td>
                <td className="border border-black p-2 text-center text-[9pt] font-bold">{r.is_passed ? 'TUNTAS' : 'REMEDIAL'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-16 grid grid-cols-2 gap-x-10 px-10 page-break-inside-avoid">
          <div></div>
          <div className="text-left text-xs font-bold mb-1">{school?.kota_kabupaten}, {printDate.full}</div>
          
          <div></div>
          <div className="text-left text-xs font-bold mb-4">Mengetahui,</div>
          
          <div className="text-left font-bold text-xs">Guru Mata Pelajaran,</div>
          <div className="text-left font-bold text-xs">Kepala Sekolah</div>

          <div className="h-24"></div><div className="h-24"></div>

          <div className="text-left font-black underline text-xs">..................................................</div>
          <div className="text-left font-black underline text-xs">{school?.kepala_sekolah}</div>
          
          <div className="text-left font-bold text-[10px]">NIP. ..................................................</div>
          <div className="text-left font-bold text-[10px]">NIP. {school?.nip_kepala_sekolah}</div>
        </div>
      </div>
    </div>
  );
};