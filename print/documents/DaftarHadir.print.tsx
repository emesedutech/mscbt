
import React from 'react';
import { PrintBaseProps, getIndoDateParts } from '../print.types.ts';

const DaftarHadirPrint: React.FC<PrintBaseProps> = ({ school, session, schedule, students, selectedRoomId }) => {
  const dt = getIndoDateParts(session?.date);
  const selectedRoom = session?.rooms.find(r => r.id === selectedRoomId);
  const roomStudents = students || [];
  
  const sesiNumber = session?.name?.match(/\d+/)?.[0] || "1";
  const mataPelajaran = schedule?.subject || '..........';

  // Standarisasi: 20 baris per halaman agar fit Folio dengan Kop dan Footer
  const rowsPerPage = 20;
  
  const chunkParticipants = (arr: any[], size: number) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
  };

  const studentPages = chunkParticipants(roomStudents, rowsPerPage);
  // Jika tidak ada siswa, buat satu halaman kosong dengan baris placeholder
  const pagesToRender = studentPages.length > 0 ? studentPages : [[]];

  return (
    <div className="print-module-dh">
      <style>{`
        @media screen { 
          .print-module-dh { background: #f1f5f9; padding: 20px; } 
          .dh-page { background: white; width: 210mm; height: 330mm; padding: 10mm; margin: 20px auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); overflow: hidden; } 
        }
        @media print { 
          @page { 
            size: 210mm 330mm; /* Folio / F4 */
            margin: 0; 
          } 
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .dh-page { 
            width: 210mm; 
            height: 330mm; 
            padding: 10mm; 
            margin: 0; 
            page-break-after: always !important;
            break-after: page !important;
            box-sizing: border-box;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          } 
          .no-print { display: none !important; }
        }
        
        .dh-container { 
          font-family: "Times New Roman", Times, serif; 
          color: #000; 
          line-height: 1.15; 
          font-size: 11pt; 
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .dh-title { 
          text-align: center; 
          font-weight: bold; 
          font-size: 14pt; 
          margin: 5mm 0; 
          text-decoration: none;
        }

        .meta-container { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 10mm; 
          margin-bottom: 5mm; 
        }

        .meta-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
        .meta-table td { padding: 1.5px 0; vertical-align: top; }
        .meta-label { width: 40%; font-weight: bold; text-transform: uppercase; }
        .meta-colon { width: 5%; text-align: center; }
        .meta-value { border-bottom: 0.5px solid #000; font-weight: bold; }

        .main-table { 
          width: 100%; 
          border-collapse: collapse; 
          border: 1.5px solid #000; 
          table-layout: fixed; 
        }
        .main-table th { 
          border: 1px solid #000; 
          padding: 6px 2px; 
          text-align: center; 
          font-weight: bold; 
          background: #f0f0f0; 
          font-size: 10pt; 
          text-transform: uppercase;
        }
        .main-table td { 
          border: 1px solid #000; 
          padding: 4px 6px; 
          font-size: 10pt; 
          vertical-align: middle; 
          height: 8.5mm; /* Presisi untuk Folio */
          overflow: hidden; 
        }
        
        .ttd-cell { position: relative; width: 55mm; }
        .ttd-num { position: absolute; top: 1.5mm; font-size: 8pt; font-weight: bold; }
        .ttd-line { position: absolute; bottom: 2mm; border-bottom: 1px dotted #000; }

        .footer-section { 
          margin-top: auto; 
          padding-top: 5mm;
        }

        .keterangan-box { 
          font-size: 9pt; 
          margin-bottom: 4mm; 
          line-height: 1.3;
        }
        
        .footer-grid { 
          display: grid; 
          grid-template-columns: 1fr 1.5fr; 
          gap: 10mm; 
        }

        .summary-table { 
          border-collapse: collapse; 
          font-size: 9pt; 
          width: 100%; 
          border: 1px solid #000; 
        }
        .summary-table td { border: 1px solid #000; padding: 4px 6px; }
        
        .sign-area { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          text-align: center; 
          font-size: 10pt; 
        }
        .sign-box { display: flex; flex-direction: column; align-items: center; }
        .sign-placeholder { height: 18mm; }
        .sign-name { 
          font-weight: bold; 
          text-decoration: underline; 
          text-transform: uppercase;
          width: 90%;
        }

        .system-banner { 
          margin-top: 6mm; 
          border: 1px solid #000; 
          padding: 4px; 
          text-align: center; 
          font-weight: bold; 
          font-size: 8.5pt;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
      `}</style>

      {pagesToRender.map((pageData, pIdx) => (
        <div key={pIdx} className="dh-page">
          <div className="dh-container">
            {/* 1. KOP SURAT */}
            {school.kop_surat && (
              <img src={school.kop_surat} alt="Kop Surat" className="w-full h-auto object-contain" />
            )}

            {/* 2. JUDUL */}
            <h1 className="dh-title">DAFTAR HADIR PESERTA</h1>

            {/* 3. IDENTITAS */}
            <div className="meta-container">
              <table className="meta-table">
                <tbody>
                  <tr>
                    <td className="meta-label">Satuan Pendidikan</td>
                    <td className="meta-colon">:</td>
                    <td className="meta-value">{school.nama_sekolah}</td>
                  </tr>
                  <tr>
                    <td className="meta-label">Ruang / ID Server</td>
                    <td className="meta-colon">:</td>
                    <td className="meta-value">{selectedRoom?.nama || '..........'} / {school.npsn}-SRV</td>
                  </tr>
                  <tr>
                    <td className="meta-label">Hari / Tanggal</td>
                    <td className="meta-colon">:</td>
                    <td className="meta-value">{dt.hari}, {dt.tanggal} {dt.bulan} {dt.tahun}</td>
                  </tr>
                </tbody>
              </table>
              <table className="meta-table">
                <tbody>
                  <tr>
                    <td className="meta-label">Mata Pelajaran</td>
                    <td className="meta-colon">:</td>
                    <td className="meta-value">{mataPelajaran}</td>
                  </tr>
                  <tr>
                    <td className="meta-label">Sesi Ke</td>
                    <td className="meta-colon">:</td>
                    <td className="meta-value">{sesiNumber}</td>
                  </tr>
                  <tr>
                    <td className="meta-label">Waktu (WIB)</td>
                    <td className="meta-colon">:</td>
                    <td className="meta-value">{session?.start_time} - {session?.end_time}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. TABEL PESERTA */}
            <table className="main-table">
              <thead>
                <tr>
                  <th style={{ width: '10mm' }}>No</th>
                  <th style={{ width: '40mm' }}>Username</th>
                  <th>Nama Lengkap Peserta</th>
                  <th style={{ width: '55mm' }}>Tanda Tangan</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((s, i) => {
                  const globalIdx = pIdx * rowsPerPage + i;
                  return (
                    <tr key={s.id}>
                      <td align="center" style={{ fontWeight: 'bold' }}>{globalIdx + 1}</td>
                      <td align="center" style={{ fontFamily: 'monospace', fontSize: '10.5pt' }}>{s.username}</td>
                      <td style={{ textTransform: 'uppercase', paddingLeft: '3mm', fontWeight: 'bold' }}>{s.nama}</td>
                      <td className="ttd-cell">
                        <span className="ttd-num" style={{ left: globalIdx % 2 === 0 ? '2mm' : '28mm' }}>{globalIdx + 1}.</span>
                        <div className="ttd-line" style={{ left: globalIdx % 2 === 0 ? '7mm' : '33mm', width: '20mm' }}></div>
                      </td>
                    </tr>
                  );
                })}
                {/* Isi baris kosong jika jumlah data kurang dari rowsPerPage */}
                {pageData.length < rowsPerPage && [...Array(rowsPerPage - pageData.length)].map((_, i) => {
                  const globalIdx = pIdx * rowsPerPage + pageData.length + i;
                  return (
                    <tr key={`empty-${globalIdx}`}>
                      <td align="center" style={{ color: 'transparent' }}>{globalIdx + 1}</td>
                      <td></td>
                      <td></td>
                      <td className="ttd-cell">
                        <span className="ttd-num" style={{ left: globalIdx % 2 === 0 ? '2mm' : '28mm' }}>{globalIdx + 1}.</span>
                        <div className="ttd-line" style={{ left: globalIdx % 2 === 0 ? '7mm' : '33mm', width: '20mm' }}></div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 5. FOOTER (Hanya tampil di halaman terakhir jika banyak halaman, atau tiap halaman jika diinginkan) */}
            <div className="footer-section">
              <div className="keterangan-box">
                <strong>Keterangan :</strong><br/>
                1. Pengawas ruang menyilang Nama Peserta yang tidak hadir.<br/>
                2. Dibuat rangkap 3 (tiga), masing-masing untuk sekolah, kota/kab dan Provinsi.
              </div>

              <div className="footer-grid">
                <div>
                  <table className="summary-table">
                    <tbody>
                      <tr>
                        <td>Jumlah Seharusnya Hadir</td>
                        <td width="30" align="center">:</td>
                        <td width="60">........ orang</td>
                      </tr>
                      <tr>
                        <td>Jumlah Tidak Hadir</td>
                        <td align="center">:</td>
                        <td>........ orang</td>
                      </tr>
                      <tr>
                        <td><strong>Jumlah Hadir</strong></td>
                        <td align="center"><strong>:</strong></td>
                        <td><strong>........ orang</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="sign-area">
                  <div className="sign-box">
                    <p className="font-bold">Proktor,</p>
                    <div className="sign-placeholder"></div>
                    <div className="sign-name">..................................</div>
                    <p className="text-[9pt] mt-1">NIP. .............................</p>
                  </div>
                  <div className="sign-box">
                    <p className="font-bold">Pengawas,</p>
                    <div className="sign-placeholder"></div>
                    <div className="sign-name">..................................</div>
                    <p className="text-[9pt] mt-1">NIP. .............................</p>
                  </div>
                </div>
              </div>

              <div className="system-banner">
                {school.nama_sekolah} - CBT SYSTEM ENTERPRISE v7.5
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DaftarHadirPrint;
