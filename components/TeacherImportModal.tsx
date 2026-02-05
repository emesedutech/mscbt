import React, { useState, useRef } from 'react';
import { X, Upload, FileDown, AlertCircle, CheckCircle, Loader2, FileSpreadsheet, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Teacher, SubjectMaster, Proctor, Supervisor } from '../types.ts';

interface TeacherImportModalProps {
  existingNips: string[];
  subjects: SubjectMaster[];
  onImport: (data: { teachers: Teacher[], proctors: Proctor[], supervisors: Supervisor[] }) => void;
  onCancel: () => void;
}

interface RowError {
  row: number;
  message: string;
}

const TeacherImportModal: React.FC<TeacherImportModalProps> = ({ existingNips, subjects, onImport, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSubjectNames = subjects.map(s => s.nama.toUpperCase());

  const downloadTemplate = () => {
    const template = [
      { NIP: '199001012020121001', 'Nama Lengkap': 'Ahmad Hidayat', 'Jenis Kelamin': 'Laki-laki', 'Jabatan': 'Guru Mapel', 'Password': '123' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Staff");
    XLSX.writeFile(wb, "Template_Import_Staff_Emes.xlsx");
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
        const json: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        validateData(json);
      } catch (err) {
        setErrors([{ row: 0, message: "Gagal membaca file Excel." }]);
      } finally { setIsValidating(false); }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateData = (data: any[]) => {
    const newErrors: RowError[] = [];
    const processed: any[] = [];
    const currentNipsInFile = new Set<string>();

    data.forEach((row, index) => {
      const rowIndex = index + 2; 
      const nip = String(row.NIP || '').trim();
      const nama = String(row['Nama Lengkap'] || '').trim();
      const jk = String(row['Jenis Kelamin'] || '').trim();
      let rowHasError = false;

      if (!nip) { newErrors.push({ row: rowIndex, message: `Baris ${rowIndex}: NIP wajib diisi.` }); rowHasError = true; }
      else if (existingNips.includes(nip)) { newErrors.push({ row: rowIndex, message: `Baris ${rowIndex}: NIP ${nip} sudah ada.` }); rowHasError = true; }
      else if (currentNipsInFile.has(nip)) { newErrors.push({ row: rowIndex, message: `Baris ${rowIndex}: NIP ${nip} duplikat.` }); rowHasError = true; }
      currentNipsInFile.add(nip);

      if (!nama) { newErrors.push({ row: rowIndex, message: `Baris ${rowIndex}: Nama wajib diisi.` }); rowHasError = true; }
      
      if (!['Laki-laki', 'Perempuan'].includes(jk)) {
        newErrors.push({ row: rowIndex, message: `Baris ${rowIndex}: Jenis Kelamin '${jk}' tidak valid (Laki-laki/Perempuan).` });
        rowHasError = true;
      }

      processed.push({ ...row, _isValid: !rowHasError, _nip: nip, _nama: nama, _jk: jk });
    });

    setPreviewData(processed);
    setErrors(newErrors);
  };

  const handleImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const teachers: Teacher[] = previewData.filter(r => r._isValid).map(row => {
        return {
          id: `guru_imp_${Date.now()}_${Math.random()}`,
          nip: row._nip,
          nama: row._nama,
          jenis_kelamin: row._jk as any,
          mata_pelajaran: String(row['Mata Pelajaran'] || '').split(',').map(s => s.trim()).filter(Boolean),
          status: row.Status || 'GTY',
          jabatan: row.Jabatan || 'Guru Mapel',
          username: row._nip,
          password: String(row.Password || row._nip) // Kirim plain text
        } as Teacher;
      });
      onImport({ teachers, proctors: [], supervisors: [] });
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b bg-gray-50 rounded-t-sm">
          <h2 className="text-xl font-bold text-gray-800 uppercase">Import Pengelola</h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-full text-gray-400"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
           <div className="p-8 bg-gray-50 rounded-sm border-2 border-dashed border-gray-200 text-center">
              <Upload size={32} className="mx-auto text-gray-400 mb-4" />
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx" onChange={handleFileChange} />
              <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2.5 bg-white border border-gray-300 rounded-sm font-bold text-xs">Pilih File XLSX</button>
              <button onClick={downloadTemplate} className="ml-4 px-6 py-2.5 bg-emerald-50 text-emerald-700 rounded-sm font-bold text-xs flex items-center gap-2 mx-auto mt-4"><FileDown size={16} /> Template</button>
           </div>
           {previewData.length > 0 && (
             <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                   <thead className="bg-gray-50 border-b">
                      <tr><th className="px-5 py-3">Jabatan</th><th className="px-5 py-3">NIP / Nama</th><th className="px-5 py-3">J. Kelamin</th><th className="px-5 py-3 text-center">Valid</th></tr>
                   </thead>
                   <tbody className="divide-y">
                      {previewData.map((row, i) => (
                        <tr key={i} className={row._isValid ? '' : 'bg-red-50'}>
                           <td className="px-5 py-3 uppercase font-bold text-gray-500">{row.Jabatan}</td>
                           <td className="px-5 py-3 font-bold text-gray-800">{row._nama} ({row._nip})</td>
                           <td className="px-5 py-3">{row._jk}</td>
                           <td className="px-5 py-3 text-center">{row._isValid ? <CheckCircle size={16} className="text-emerald-500 mx-auto" /> : <AlertCircle size={16} className="text-red-500 mx-auto" />}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           )}
        </div>
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-sm">
          <button onClick={onCancel} className="px-6 py-2.5 text-gray-600 font-bold">Batal</button>
          <button disabled={previewData.filter(d => d._isValid).length === 0 || isProcessing} onClick={handleImport} className="px-10 py-2.5 bg-emerald-600 text-white rounded-sm font-bold shadow-lg disabled:opacity-50">Proses</button>
        </div>
      </div>
    </div>
  );
};

export default TeacherImportModal;