import React, { useState, useRef } from 'react';
import { X, Upload, FileDown, AlertCircle, CheckCircle, Loader2, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, GradeLevel, RombelMaster } from '../types.ts';

interface StudentImportModalProps {
  jenjang: string;
  existingNis: string[];
  gradeLevels: GradeLevel[];
  rombels: RombelMaster[];
  onImport: (data: Student[]) => void;
  onCancel: () => void;
  quotaLimit: number;
  currentStudentCount: number;
}

interface RowError {
  row: number;
  message: string;
}

const StudentImportModal: React.FC<StudentImportModalProps> = ({ 
  existingNis, 
  gradeLevels,
  rombels,
  onImport, 
  onCancel,
  quotaLimit,
  currentStudentCount
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeGradeNames = gradeLevels.map(g => g.nama.toUpperCase());
  const activeRombelNames = rombels.map(r => r.nama.toUpperCase());

  const getActiveSchoolId = () => {
    return localStorage.getItem('school_id') || (gradeLevels.length > 0 ? gradeLevels[0].school_id : null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const processFile = (file: File) => {
    setIsValidating(true);
    setErrors([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        const normalizedJson = json.map(row => {
          const newRow: any = {};
          Object.keys(row).forEach(key => {
            const k = key.toLowerCase().trim().replace(/\s+/g, '_');
            if (k === 'jeniskelamin' || k === 'jenis_kelamin' || k === 'jk') {
              newRow['jenis_kelamin'] = row[key];
            } else {
              newRow[k] = row[key];
            }
          });
          return newRow;
        });

        validateData(normalizedJson);
      } catch (err: any) {
        setErrors([{ row: 0, message: err.message }]);
      } finally { setIsValidating(false); }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateData = (data: any[]) => {
    const newErrors: RowError[] = [];
    const processed: any[] = [];
    const currentNisSet = new Set<string>();

    data.forEach((row, index) => {
      const rowIndex = index + 2;
      const nis = String(row.nis || '').trim();
      const nama = String(row.nama || '').trim();
      const kls = String(row.kelas || '').trim().toUpperCase();
      const rmb = String(row.rombel || '').trim().toUpperCase();

      let rowHasError = false;
      if (!nis) { newErrors.push({ row: rowIndex, message: `B${rowIndex}: NIS kosong` }); rowHasError = true; }
      else if (existingNis.includes(nis)) { newErrors.push({ row: rowIndex, message: `B${rowIndex}: NIS terdaftar` }); rowHasError = true; }
      else if (currentNisSet.has(nis)) { newErrors.push({ row: rowIndex, message: `B${rowIndex}: NIS duplikat` }); rowHasError = true; }
      currentNisSet.add(nis);

      if (!nama) { newErrors.push({ row: rowIndex, message: `B${rowIndex}: Nama kosong` }); rowHasError = true; }
      if (kls && !activeGradeNames.includes(kls)) { newErrors.push({ row: rowIndex, message: `B${rowIndex}: Kelas tidak valid` }); rowHasError = true; }
      if (rmb && !activeRombelNames.includes(rmb)) { newErrors.push({ row: rowIndex, message: `B${rowIndex}: Rombel tidak valid` }); rowHasError = true; }

      processed.push({ ...row, _isValid: !rowHasError });
    });
    setPreviewData(processed);
    setErrors(newErrors);
  };

  const handleImport = () => {
    const schoolId = getActiveSchoolId();
    if (!schoolId) {
      alert("Error: ID Sekolah tidak ditemukan. Silakan login kembali.");
      return;
    }
    
    const validDataToImport = previewData.filter(r => r._isValid);
    
    if (currentStudentCount + validDataToImport.length > quotaLimit) {
      alert(
        `Gagal Import: Jumlah siswa akan melebihi kuota langganan Anda.\n\n` +
        `Kuota: ${quotaLimit} siswa\n` +
        `Siswa Saat Ini: ${currentStudentCount} siswa\n` +
        `Siswa Baru: ${validDataToImport.length} siswa\n` +
        `Total Akan Menjadi: ${currentStudentCount + validDataToImport.length} siswa`
      );
      return;
    }

    setIsProcessing(true);
    
    const validStatuses: Student['status'][] = ['Aktif', 'Tidak Aktif', 'Pindah', 'Lulus'];

    const finalData: Student[] = validDataToImport.map((row, index) => {
      return {
        id: `import_${schoolId}_${Date.now()}_${index}`,
        school_id: schoolId,
        nis: String(row.nis),
        nama: String(row.nama),
        jenis_kelamin: (row.jenis_kelamin === 'Laki-laki' || row.jenis_kelamin === 'Perempuan') ? row.jenis_kelamin : 'Laki-laki',
        kelas: String(row.kelas || ''),
        rombel: String(row.rombel || ''),
        status: (row.status && validStatuses.includes(row.status)) ? row.status : 'Aktif',
        username: row.username || String(row.nis),
        password: row.password || String(row.nis), // Kirim plain text, DB akan hash
      };
    });

    onImport(finalData);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b shrink-0 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-sm"><FileSpreadsheet size={24} /></div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 uppercase tracking-tight">Import Data Siswa</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Sesuai Skema Tabel public.students</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-full text-gray-400"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-8 bg-gray-50 rounded-sm border-2 border-dashed border-gray-200 text-center">
              <Upload size={32} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-sm font-bold text-gray-800 mb-1">{file ? file.name : 'Pilih File .XLSX'}</h3>
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx" onChange={handleFileChange} />
              <button onClick={() => fileInputRef.current?.click()} className="mt-2 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-sm">Pilih File</button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-sm p-5">
              <div className="flex items-center gap-2 mb-3"><AlertTriangle size={18} className="text-amber-600" /><h4 className="text-xs font-bold text-amber-800 uppercase">Ketentuan Kolom</h4></div>
              <ul className="text-[10px] text-amber-800 space-y-2 font-bold">
                <li>• WAJIB: NIS, NAMA</li>
                <li>• OPTIONAL: JENIS_KELAMIN, KELAS, ROMBEL, PASSWORD</li>
                <li>• Jika PASSWORD kosong, akan disamakan dengan NIS.</li>
                <li>• SARAN: Import per 200-300 baris untuk koneksi tidak stabil.</li>
              </ul>
            </div>
          </div>

          {previewData.length > 0 && (
            <div className="overflow-x-auto border rounded-sm">
              <table className="w-full text-[10px] text-left">
                <thead className="bg-gray-100 uppercase font-black">
                  <tr>
                    <th className="p-3">NIS</th>
                    <th className="p-3">Nama</th>
                    <th className="p-3">Kelas-Rombel</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewData.map((row, i) => (
                    <tr key={i} className={row._isValid ? '' : 'bg-red-50'}>
                      <td className="p-3 font-mono">{row.nis}</td>
                      <td className="p-3 font-bold uppercase">{row.nama}</td>
                      <td className="p-3 uppercase font-bold text-emerald-700">{row.kelas}-{row.rombel}</td>
                      <td className="p-3 text-center">
                        {row._isValid ? <CheckCircle size={14} className="text-emerald-500 mx-auto" /> : <AlertCircle size={14} className="text-red-500 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
          <button onClick={onCancel} className="px-4 py-2 border text-[10px] font-bold">Batal</button>
          <button 
            disabled={previewData.filter(d => d._isValid).length === 0 || isProcessing} 
            onClick={handleImport} 
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white text-[10px] font-bold rounded-sm"
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            SIMPAN KE DATABASE
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentImportModal;