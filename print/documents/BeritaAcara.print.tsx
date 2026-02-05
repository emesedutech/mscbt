
import React from 'react';
import { PrintBaseProps, getIndoDateParts } from '../print.types.ts';

const BeritaAcaraPrint: React.FC<PrintBaseProps> = ({ school, session, students, selectedRoomId }) => {
  const dt = getIndoDateParts(session?.date);
  const selectedRoom = session?.rooms.find(r => r.id === selectedRoomId);
  const totalStudents = students?.length || 0;

  return (
    <div className="print-module-ba">
      <style>{`
        @media screen { 
          .print-module-ba { background: #f1f5f9; padding: 40px; } 
          .ba-container { background: white; width: 210mm; padding: 15mm; margin: 0 auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); } 
        }
        @media print { 
          @page { size: A4 portrait; margin: 10mm; } 
          .ba-container { width: 100%; padding: 5mm; } 
          body { background: white; } 
          .no-print { display: none !important; }
        }
        .ba-container { font-family: Arial, Helvetica, sans-serif; color: #000; line-height: 1.4; font-size: 10pt; }
        
        .ba-title-section { text-align: center; margin-bottom: 20px; }
        .ba-title-main { font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 0; }
        .ba-title-sub { font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 0; }
        
        .opening-text { text-align: justify; margin-bottom: 15px; }
        
        .data-list-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .data-list-table td { padding: 3px 0; vertical-align: top; border-bottom: 1px solid #ccc; }
        .data-list-table .label-col { width: 35%; }
        .data-list-table .colon-col { width: 2%; text-align: center; }
        .data-list-table .value-col { width: 63%; font-weight: normal; }

        .notes-section { margin-top: 15px; }
        .notes-title { margin-bottom: 5px; }
        .notes-box { 
          border: 1px solid #000; 
          min-height: 120px; 
          padding: 15px; 
          margin-bottom: 15px;
          text-align: justify;
        }

        .sign-title { margin-bottom: 20px; }
        .signature-grid { display: grid; grid-template-columns: 1fr 1fr; margin-top: 20px; row-gap: 15px; }
        .sign-label-group { display: flex; flex-direction: column; }
        .sign-name-row { display: flex; align-items: baseline; border-bottom: 1px solid #000; width: 80%; }
        .sign-nip-row { display: flex; align-items: baseline; border-bottom: 1px solid #000; width: 80%; margin-top: 5px; }
        .ttd-box { border-bottom: 1px solid #000; width: 200px; height: 35px; position: relative; margin-top: 5px; }
        .ttd-num { position: absolute; left: -25px; top: 25px; }

        .footer-note { font-size: 8pt; border: 1px solid #000; padding: 5px; margin-top: 30px; width: 350px; }
        .footer-banner { 
          margin-top: 50px; 
          border: 1px solid #000; 
          padding: 8px; 
          text-align: center; 
          font-weight: bold; 
          text-transform: uppercase;
          font-size: 9pt;
        }
      `}</style>

      <div className="ba-container">
        {school.kop_surat && (
          <img src={school.kop_surat} alt="Kop Surat" className="w-full h-auto object-contain mb-6" />
        )}

        {/* Judul Berita Acara - Nama Ujian Menyesuaikan Nama Sesi */}
        <div className="ba-title-section">
          <p className="ba-title-main">BERITA ACARA PELAKSANAAN</p>
          <p className="ba-title-sub">{session?.name || 'ASESMEN MADRASAH'}</p>
          <p className="ba-title-sub">TAHUN {dt.tahun}</p>
        </div>

        {/* Teks Pembuka - Hanya Nama Sekolah */}
        <div className="opening-text">
          Pada hari ini <strong>{dt.hari}</strong> tanggal <strong>{dt.tanggal}</strong> bulan <strong>{dt.bulan}</strong> tahun <strong>{dt.tahun}</strong>, 
          di <strong>{school.nama_sekolah}</strong> telah diselenggarakan 
          {session?.name || 'Ujian'}, dari pukul <strong>{session?.start_time || '07:30'}</strong> sampai dengan pukul <strong>{session?.end_time || '09:30'}</strong>
        </div>

        {/* Tabel Data Identitas */}
        <table className="data-list-table">
          <tbody>
            <tr>
              <td className="label-col">1. Username</td>
              <td className="colon-col">:</td>
              <td className="value-col">{school.npsn || '..........'}</td>
            </tr>
            <tr>
              <td className="label-col">&nbsp;&nbsp;&nbsp;Sekolah/Madrasah</td>
              <td className="colon-col">:</td>
              <td className="value-col">{school.nama_sekolah}</td>
            </tr>
            <tr>
              <td className="label-col">&nbsp;&nbsp;&nbsp;ID Server</td>
              <td className="colon-col">:</td>
              <td className="value-col">{school.npsn}-SRV Ruang : {selectedRoom?.nama || '..........'}</td>
            </tr>
            <tr>
              <td className="label-col">&nbsp;&nbsp;&nbsp;Sesi</td>
              <td className="colon-col">:</td>
              <td className="value-col">{session?.name?.includes('Sesi') ? session.name.split('Sesi')[1] : '1'}</td>
            </tr>
            <tr>
              <td className="label-col">&nbsp;&nbsp;&nbsp;Jumlah Peserta Seharusnya</td>
              <td className="colon-col">:</td>
              <td className="value-col">{totalStudents}</td>
            </tr>
            <tr>
              <td className="label-col">&nbsp;&nbsp;&nbsp;Jumlah Hadir (Ikut Ujian)</td>
              <td className="colon-col">:</td>
              <td className="value-col">{totalStudents}</td>
            </tr>
            <tr>
              <td className="label-col">&nbsp;&nbsp;&nbsp;Jumlah Tidak Mengerjakan</td>
              <td className="colon-col">:</td>
              <td className="value-col">0</td>
            </tr>
            <tr>
              <td className="label-col">&nbsp;&nbsp;&nbsp;Username Tidak Mengerjakan</td>
              <td className="colon-col">:</td>
              <td className="value-col"></td>
            </tr>
          </tbody>
        </table>

        {/* Catatan Selama Tes */}
        <div className="notes-section">
          <p className="notes-title">2. Catatan selama Tes :</p>
          <div className="notes-box">
            {session?.proctor_instructions ? session.proctor_instructions : 'Pelaksanaan ujian berjalan dengan lancar, tertib, dan aman tanpa ada kendala teknis yang berarti.'}
          </div>
        </div>

        {/* Kolom Tanda Tangan */}
        <p className="sign-title">Yang membuat berita acara :</p>
        
        <div className="signature-grid">
          <div className="sign-label-group">
            <div className="flex items-baseline">
              <span className="w-24">1. Proktor</span>
              <span className="sign-name-row">...................................................</span>
            </div>
            <div className="flex items-baseline mt-1">
              <span className="w-24">NIP</span>
              <span className="sign-nip-row">...................................................</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold mb-2">TTD</span>
            <div className="ttd-box"><span className="ttd-num">1.</span></div>
          </div>

          <div className="sign-label-group">
            <div className="flex items-baseline">
              <span className="w-24">2. Pengawas</span>
              <span className="sign-name-row">...................................................</span>
            </div>
            <div className="flex items-baseline mt-1">
              <span className="w-24">NIP</span>
              <span className="sign-nip-row">...................................................</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="ttd-box"><span className="ttd-num">2.</span></div>
          </div>

          <div className="sign-label-group">
            <div className="flex items-baseline">
              <span className="w-24">3. Penanggung Jawab</span>
              <span className="sign-name-row">{school.kepala_sekolah}</span>
            </div>
            <div className="flex items-baseline mt-1">
              <span className="w-24">NIP</span>
              <span className="sign-nip-row">{school.nip_kepala_sekolah}</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="ttd-box"><span className="ttd-num">3.</span></div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="footer-note">
          <strong>Catatan:</strong><br/>
          - Dibuat rangkap 3 (tiga), masing-masing untuk Sekolah, Kota/Kabupaten dan Provinsi<br/>
          - Untuk pusat di upload melalui web ANBK
        </div>

        {/* Banner Institusi - Nama Sekolah */}
        <div className="footer-banner">
          {school.nama_sekolah}
        </div>
      </div>
    </div>
  );
};

export default BeritaAcaraPrint;
