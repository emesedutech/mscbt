import React from 'react';
import { PrintBaseProps, getIndoDateParts } from '../print.types.ts';
import { SchoolProfile, ExamSchedule } from '../../types.ts';

interface AnalisisButirPrintProps extends PrintBaseProps {
  schedule: ExamSchedule;
  data: any[];
}

export const PrintAnalisisButir: React.FC<AnalisisButirPrintProps> = ({ school, schedule, data, onDone }) => {
  const reportDate = getIndoDateParts(new Date().toISOString());
  const fmt = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  return (
    <div className="print-module-analysis bg-white min-h-screen text-black font-serif">
       <style>{`
        @media print {
            @page { size: A4 portrait; margin: 10mm; }
            body { background: white; -webkit-print-color-adjust: exact; }
            .print-module-analysis { display: block !important; }
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
          <h1 className="text-xl font-black underline">ANALISIS KUALITAS BUTIR SOAL</h1>
          <p className="text-sm font-bold mt-2">Ujian: {schedule.name}</p>
          <p className="text-xs mt-1">Mata Pelajaran: {schedule.subject} | Kelas: {schedule.level}</p>
        </div>

        <table className="w-full border-collapse border border-black text-[9pt]">
          <thead className="bg-gray-100 font-bold text-center">
            <tr>
              <th className="border border-black p-1 w-12">No.</th>
              <th className="border border-black p-1 w-12">Kunci</th>
              <th className="border border-black p-1">Jml Benar</th>
              <th className="border border-black p-1">Jml Salah</th>
              <th className="border border-black p-1">P (%)</th>
              <th className="border border-black p-1">Klasifikasi</th>
              <th className="border border-black p-1">Rekomendasi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item: any) => (
              <tr key={item.question_id}>
                {/* FIX: Use `item.no` for the question number as provided by the analysis data. */}
                <td className="border border-black p-1 text-center font-bold">{item.no}</td>
                {/* FIX: Use `item.key`, `item.correct`, `item.incorrect`, `item.percentage` to match the data structure. */}
                <td className="border border-black p-1 text-center font-black">{item.key}</td>
                <td className="border border-black p-1 text-center">{item.correct}</td>
                <td className="border border-black p-1 text-center">{item.incorrect}</td>
                <td className="border border-black p-1 text-center font-mono">{fmt(item.percentage)}%</td>
                <td className="border border-black p-1 text-center text-[8pt] font-bold">{item.classification}</td>
                <td className="border border-black p-1 text-center text-[8pt] font-bold">{item.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-6 text-[8pt] italic text-gray-700 page-break-inside-avoid">
          *Keterangan: P = Tingkat Kesukaran (Proporsi jawaban benar). Klasifikasi: P &gt; 0.70 (Mudah), 0.30 ≤ P ≤ 0.70 (Sedang), P &lt; 0.30 (Sukar).
        </div>

        <div className="mt-16 grid grid-cols-2 gap-x-10 px-10 page-break-inside-avoid">
          <div></div>
          <div className="text-left text-xs font-bold mb-1">{school?.kota_kabupaten}, {reportDate.full}</div>
          
          <div></div>
          <div className="text-left text-xs font-bold mb-4">Mengetahui,</div>
          
          <div className="text-left font-bold text-xs">Petugas Analisis Data,</div>
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