
import React, { useEffect } from 'react';
import { SchoolProfile, ExamSchedule } from '../types.ts';

export function PrintLedgerNilai({ school, examName, data, onDone }: { school: SchoolProfile | null; examName: string; data: any[]; onDone: () => void; }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
      onDone();
    }, 500);
    return () => clearTimeout(timer);
  }, [onDone]);

  const fmt = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;
  
  // Ambil tanggal cetak dari data pertama jika ada, atau hari ini sebagai fallback (Leger biasanya kumulatif)
  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div id="ledger-print-area" className="p-0 md:p-12 bg-white min-h-screen text-black font-serif">
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            @page:first {
              margin-top: 5mm;
            }
            body, html { 
              height: auto !important; 
              overflow: visible !important; 
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            #ledger-print-area {
              display: block !important;
              padding: 0 !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
            }
            .no-print { display: none !important; }
            table { 
              width: 100% !important;
              border-collapse: collapse !important;
              page-break-inside: auto;
            }
            tr { page-break-inside: avoid !important; page-break-after: auto; }
            thead { display: table-header-group; }
          }
        `}
      </style>
      
      {/* FIX: Changed property name to snake_case */}
      {school?.kop_surat ? (
        <img src={school.kop_surat} alt="Kop Surat" className="w-full h-auto object-contain mb-8" />
      ) : (
        <div className="text-center mb-8 border-b-2 border-black pb-4">
            {/* FIX: Changed property name to snake_case */}
            <h1 className="text-2xl font-black uppercase tracking-tight">{school?.nama_sekolah}</h1>
            <p className="text-xs">{school?.alamat}</p>
        </div>
      )}

      <div className="text-center mb-10">
        <h1 className="text-xl font-black tracking-tight">Leger Nilai Hasil Ujian (CBT)</h1>
        <p className="text-sm font-bold mt-1">Ujian: {examName}</p>
        <p className="text-xs mt-1">Tanggal Terbit: {printDate}</p>
      </div>

      <table className="w-full border-collapse border border-black text-[11px]">
        <thead className="bg-gray-50 font-bold text-center">
          <tr>
            <th className="border border-black p-2 w-10">No</th>
            <th className="border border-black p-2 text-left">Nama Lengkap Peserta</th>
            <th className="border border-black p-2 w-16">Benar</th>
            <th className="border border-black p-2 w-16">Salah</th>
            <th className="border border-black p-2 w-20">Skor Akhir</th>
            <th className="border border-black p-2 w-16">Predikat</th>
            <th className="border border-black p-2 w-24">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r: any, i: number) => (
            <tr key={i}>
              <td className="border border-black p-2 text-center">{i + 1}</td>
              {/* FIX: Use snake_case for properties */}
              <td className="border border-black p-2 font-bold">{r.student_name}</td>
              <td className="border border-black p-2 text-center">{r.correct}</td>
              <td className="border border-black p-2 text-center">{r.incorrect}</td>
              <td className="border border-black p-2 text-center font-black">{fmt(r.final_grade)}</td>
              <td className="border border-black p-2 text-center">{r.final_grade >= 90 ? 'A' : r.final_grade >= 80 ? 'B' : r.final_grade >= 75 ? 'C' : 'D'}</td>
              <td className="border border-black p-2 text-center text-[10px] font-bold">{r.is_passed ? 'Lulus KKM' : 'Remedial'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signature Section - Left Aligned Grid */}
      <div className="mt-20 grid grid-cols-2 gap-x-10 px-10 page-break-inside-avoid">
        <div className="text-left"></div>
        {/* FIX: Changed property name to snake_case */}
        <div className="text-left text-xs font-bold mb-1">{school?.kota_kabupaten || '..........'}, {printDate}</div>
        
        <div className="text-left"></div>
        <div className="text-left text-xs font-bold mb-4">Mengetahui,</div>

        <div className="text-left font-bold text-xs">Proktor/Panitia Ujian,</div>
        <div className="text-left font-bold text-xs">Kepala Sekolah</div>

        <div className="h-24"></div>
        <div className="h-24"></div>

        <div className="text-left font-black underline text-xs">..................................................</div>
        {/* FIX: Changed property name to snake_case */}
        <div className="text-left font-black underline text-xs">{school?.kepala_sekolah || '..................................................'}</div>

        <div className="text-left font-bold text-[10px]">NIP. ..................................................</div>
        {/* FIX: Changed property name to snake_case */}
        <div className="text-left font-bold text-[10px]">NIP. {school?.nip_kepala_sekolah || '..................................................'}</div>
      </div>
    </div>
  );
}

export function PrintAnalisisButir({ school, schedule, data, onDone }: { school: SchoolProfile | null; schedule: ExamSchedule; data: any[]; onDone: () => void; }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
      onDone();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onDone]);

  const fmt = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;
  
  // Analisis menggunakan tanggal hari ini sebagai tanggal laporan dibuat
  const reportDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div id="analysis-print-area" className="bg-white min-h-screen text-black font-serif">
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            @page:first {
              margin-top: 5mm;
            }
            body, html { 
              height: auto !important; 
              overflow: visible !important; 
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            #analysis-print-area {
              display: block !important;
              position: static !important;
              padding: 0 !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
            }
            .no-print { display: none !important; }
            table { 
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: auto !important;
              page-break-inside: auto;
            }
            tr { page-break-inside: avoid !important; page-break-after: auto; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            img { max-width: 100% !important; }
            .page-break-inside-avoid { page-break-inside: avoid !important; }
          }
        `}
      </style>

      <div className="p-0 md:p-12">
        {/* FIX: Changed property name to snake_case */}
        {school?.kop_surat ? (
          <img src={school.kop_surat} alt="Kop Surat" className="w-full h-auto object-contain mb-8" />
        ) : (
            <div className="text-center mb-8 border-b-2 border-black pb-4">
                {/* FIX: Changed property name to snake_case */}
                <h1 className="text-2xl font-black uppercase tracking-tight">{school?.nama_sekolah}</h1>
                <p className="text-xs">{school?.alamat}</p>
            </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-xl font-black underline">Analisis Butir Soal</h1>
          <p className="text-sm font-bold mt-2">Ujian: {schedule.name}</p>
          <p className="text-xs mt-1">Mata Pelajaran: {schedule.subject} | Kelas: {schedule.level}</p>
        </div>

        <table className="w-full border-collapse border border-black text-[11px]">
          <thead className="bg-gray-100 font-bold text-center">
            <tr>
              <th className="border border-black p-2 w-16">No Soal</th>
              <th className="border border-black p-2 w-16">Kunci</th>
              <th className="border border-black p-2">Jumlah Benar</th>
              <th className="border border-black p-2">Jumlah Salah</th>
              <th className="border border-black p-2">Persentase (%)</th>
              <th className="border border-black p-2">Kesukaran (P)</th>
              <th className="border border-black p-2">Klasifikasi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item: any, i: number) => (
              <tr key={i}>
                {/* FIX: Use correct property names from analysis data */}
                <td className="border border-black p-2 text-center font-bold">{item.no}</td>
                <td className="border border-black p-2 text-center font-black">{item.key}</td>
                <td className="border border-black p-2 text-center">{item.correct}</td>
                <td className="border border-black p-2 text-center">{item.incorrect}</td>
                <td className="border border-black p-2 text-center">{fmt(item.percentage)}%</td>
                <td className="border border-black p-2 text-center font-mono font-bold">{fmt(item.difficulty)}</td>
                <td className="border border-black p-2 text-center">{item.classification}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-10 text-[10px] italic font-sans text-gray-600">
          *Keterangan:<br />
          - P &gt; 0.70 : Mudah<br />
          - 0.30 ≤ P ≤ 0.70 : Sedang<br />
          - P &lt; 0.30 : Sukar
        </div>

        {/* Signature Section - Left Aligned Grid */}
        <div className="mt-16 grid grid-cols-2 gap-x-10 px-10 page-break-inside-avoid">
          <div className="text-left"></div>
          {/* FIX: Changed property name to snake_case */}
          <div className="text-left text-xs font-bold mb-1">{school?.kota_kabupaten || '..........'}, {reportDate}</div>
          
          <div className="text-left"></div>
          <div className="text-left text-xs font-bold mb-4">Mengetahui,</div>

          <div className="text-left font-bold text-xs">Petugas Analisis Data,</div>
          <div className="text