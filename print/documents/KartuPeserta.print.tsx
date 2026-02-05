import React from 'react';
import { PrintBaseProps, getIndoDateParts } from '../print.types.ts';

const KartuPesertaPrint: React.FC<PrintBaseProps> = ({ school, session, students, selectedRoomId }) => {
  const dt = getIndoDateParts(session?.date);
  const selectedRoom = session?.rooms.find(r => r.id === selectedRoomId);
  const roomStudents = students || [];

  const chunkParticipants = (arr: any[], size: number) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
  };

  // 6 kartu per halaman (2 kolom x 3 baris)
  const studentPages = chunkParticipants(roomStudents, 6);

  return (
    <div className="print-module-kartu">
      <style>{`
        @media screen {
          .print-module-kartu { background: #f1f5f9; padding: 20px; }
        }
        
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0; /* Margin nol agar kontrol penuh via CSS */
          }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .print-page {
            width: 210mm;
            height: 297mm;
            display: grid !important;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(3, 1fr);
            gap: 0;
            padding: 10mm;
            box-sizing: border-box;
            page-break-after: always !important;
            break-after: page !important;
            overflow: hidden;
          }
          .card-wrapper {
            padding: 4mm; /* Jarak antar kartu */
            display: flex;
            box-sizing: border-box;
            height: 100%;
            width: 100%;
          }
        }

        .card-wrapper {
           padding: 5px;
        }
        
        .anbk-card {
          border: 1.2px solid #000;
          padding: 3.5mm;
          background: #fff;
          font-family: Arial, Helvetica, sans-serif;
          display: flex;
          flex-direction: column;
          position: relative;
          box-sizing: border-box;
          width: 100%;
          height: 100%;
        }

        .anbk-header {
          display: flex;
          align-items: center;
          border-bottom: 1.2px solid #000;
          padding-bottom: 2mm;
          margin-bottom: 3mm;
        }

        .header-logo { width: 11mm; height: 11mm; object-fit: contain; }
        .header-center { flex: 1; text-align: center; }
        .header-qr { width: 11mm; height: 11mm; border: 0.5px solid #000; }

        .title-main { font-size: 8.5pt; font-weight: bold; margin: 0; text-transform: uppercase; line-height: 1.1; }
        .title-sub { font-size: 7.5pt; font-weight: bold; margin: 2px 0 0 0; text-transform: uppercase; line-height: 1.1; }
        .title-year { font-size: 7.5pt; font-weight: bold; margin: 0; }

        .id-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; margin-bottom: 2mm; }
        .id-table td { padding: 1.5px 0; vertical-align: top; }
        .id-label { width: 35%; }
        .id-colon { width: 3%; }
        .id-value { width: 62%; font-weight: bold; text-transform: uppercase; }

        .bottom-section { display: flex; gap: 3mm; flex: 1; align-items: flex-end; margin-top: auto; }
        
        .photo-box {
          width: 22mm;
          height: 28mm;
          border: 1px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fafafa;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .photo-bg {
          position: absolute;
          inset: 0;
          background: #cc0000; 
          opacity: 0.05;
        }

        .photo-text { font-size: 6pt; color: #888; font-weight: bold; text-align: center; z-index: 1; }

        .schedule-table {
          flex: 1;
          border-collapse: collapse;
          font-size: 6.5pt;
          margin-bottom: 0;
        }
        .schedule-table th, .schedule-table td {
          border: 1px solid #000;
          padding: 2px 3px;
          text-align: center;
        }
        .schedule-table th { background: #f5f5f5; font-weight: bold; }
        
        .footer-note {
          font-size: 6pt;
          font-style: italic;
          color: #000;
          margin-top: 1.5mm;
          text-align: left;
          border-top: 0.5px dashed #ccc;
          padding-top: 1mm;
        }
      `}</style>

      {studentPages.map((pageData, pIdx) => (
        <div key={pIdx} className="print-page">
          {pageData.map((s) => (
            <div key={s.id} className="card-wrapper">
              <div className="anbk-card">
                {/* Header */}
                <div className="anbk-header">
                  <img src="https://i.imgur.com/VDNLrbw.png" className="header-logo" alt="Logo" />
                  <div className="header-center">
                    <p className="title-main">KARTU LOGIN PESERTA</p>
                    <p className="title-sub">{session?.name || 'ASESMEN SEKOLAH'}</p>
                    <p className="title-year">TAHUN {dt.tahun}</p>
                  </div>
                  <div className="header-qr">
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 opacity-20">
                      <div className="grid grid-cols-3 gap-0.5">
                        {[...Array(9)].map((_, i) => <div key={i} className="w-1 h-1 bg-black"></div>)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Identitas */}
                <table className="id-table">
                  <tbody>
                    <tr>
                      <td className="id-label">Nama Peserta</td>
                      <td className="id-colon">:</td>
                      <td className="id-value">{s.nama}</td>
                    </tr>
                    <tr>
                      <td className="id-label">NIS</td>
                      <td className="id-colon">:</td>
                      <td className="id-value font-mono">{s.nis}</td>
                    </tr>
                    <tr>
                      <td className="id-label">Kelas / Rombel</td>
                      <td className="id-colon">:</td>
                      <td className="id-value">{s.kelas} / {s.rombel}</td>
                    </tr>
                    <tr>
                      <td className="id-label">NPSN</td>
                      <td className="id-colon">:</td>
                      <td className="id-value font-mono">{school.npsn}</td>
                    </tr>
                    <tr>
                      <td className="id-label">Username</td>
                      <td className="id-colon">:</td>
                      <td className="id-value font-mono">{s.username}</td>
                    </tr>
                    <tr>
                      <td className="id-label">Password</td>
                      <td className="id-colon">:</td>
                      <td className="id-value font-mono">{s.password}</td>
                    </tr>
                    <tr>
                      <td className="id-label">ID Proktor / Ruang</td>
                      <td className="id-colon">:</td>
                      <td className="id-value">{selectedRoom?.nama || '-'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Bottom section */}
                <div className="bottom-section">
                  <div className="photo-box">
                    <div className="photo-bg"></div>
                    <span className="photo-text">PAS FOTO<br/>2 x 3</span>
                  </div>
                  
                  <table className="schedule-table">
                    <thead>
                      <tr>
                        <th style={{ width: '25%' }}>Tanggal</th>
                        <th>Mata Pelajaran</th>
                        <th style={{ width: '30%' }}>Waktu</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{dt.tanggal}-{dt.bulan.substring(0,3)}-{dt.tahun}</td>
                        <td className="font-bold uppercase">Ujian Utama</td>
                        <td>{session?.start_time} - {session?.end_time}</td>
                      </tr>
                      <tr>
                        <td className="text-gray-300">-</td>
                        <td className="text-gray-300">-</td>
                        <td className="text-gray-300">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="footer-note">
                  * Simpan kartu ini untuk digunakan selama sesi pengerjaan.
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default KartuPesertaPrint;