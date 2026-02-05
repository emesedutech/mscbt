
import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileDown, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  FileSpreadsheet, 
  Info,
  ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Question, QuestionType, QuestionBank, QuestionOption, TrueFalseStatement, MatchPair } from '../types.ts';

interface QuestionImportModalProps {
  bankContext: QuestionBank;
  onImport: (data: Question[]) => void;
  onCancel: () => void;
}

interface RowError {
  row: number;
  message: string;
}

const TYPE_MAPPING: Record<string, QuestionType> = {
  'PG': 'pilihan_ganda',
  'PGK': 'pilihan_ganda_kompleks',
  'BS': 'benar_salah',
  'MJ': 'menjodohkan'
};

const QuestionImportModal: React.FC<QuestionImportModalProps> = ({ bankContext, onImport, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = [
      'TIPE_SOAL', 'PERTANYAAN', 
      'OPSI_A', 'OPSI_B', 'OPSI_C', 'OPSI_D', 'OPSI_E', 'KUNCI_JAWABAN',
      'PERNYATAAN_1', 'JAWABAN_1', 'PERNYATAAN_2', 'JAWABAN_2', 'PERNYATAAN_3', 'JAWABAN_3',
      'MJ_1_KIRI', 'MJ_1_KANAN', 'MJ_2_KIRI', 'MJ_2_KANAN', 'MJ_3_KIRI', 'MJ_3_KANAN',
      'BOBOT', 'PEMBAHASAN'
    ];

    const data = [
      { 
        TIPE_SOAL: 'PG', 
        PERTANYAAN: 'Apa ibukota Indonesia?', 
        OPSI_A: 'Jakarta', OPSI_B: 'Surabaya', OPSI_C: 'Bandung', OPSI_D: 'Medan',
        KUNCI_JAWABAN: 'A', BOBOT: 1, PEMBAHASAN: 'Jakarta adalah ibukota.' 
      }
    ];

    const ws = XLSX.utils.json_to_sheet(data, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Soal");
    XLSX.writeFile(wb, `Template_Emes_CBT_Strict.xlsx`);
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
        if (json.length === 0) setErrors([{ row: 0, message: "File kosong." }]);
        else validateData(json);
      } catch (err) {
        setErrors([{ row: 0, message: "Gagal membaca file Excel." }]);
      } finally { setIsValidating(false); }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateData = (data: any[]) => {
    const newErrors: RowError[] = [];
    const processed: any[] = [];

    data.forEach((row, index) => {
      const rowIndex = index + 2; 
      const tipeRaw = String(row.TIPE_SOAL || '').trim().toUpperCase();
      const type = TYPE_MAPPING[tipeRaw];
      const pertanyaan = String(row.PERTANYAAN || '').trim();
      let rowHasError = false;

      if (!type) {
        newErrors.push({ row: rowIndex, message: `Baris ${rowIndex}: Tipe '${tipeRaw}' tidak valid.` });
        rowHasError = true;
      }
      if (!pertanyaan && type !== 'benar_salah' && type !== 'menjodohkan') {
        newErrors.push({ row: rowIndex, message: `Baris ${rowIndex}: Pertanyaan kosong.` });
        rowHasError = true;
      }

      processed.push({ ...row, _rowNum: rowIndex, _isValid: !rowHasError, _type: type });
    });

    setPreviewData(processed);
    setErrors(newErrors);
  };

  const handleImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const timestamp = Date.now();
      const idSet = new Set<string>();
      
      try {
        const questionsToSave: Question[] = previewData
          .filter(row => row._isValid)
          .map((row, idx) => {
            const uniqueId = `soal_imp_${bankContext.id}_${timestamp}_${idx}`;
            
            if (idSet.has(uniqueId)) {
              throw new Error(`CRITICAL DUPLICATE: ID '${uniqueId}' muncul dua kali dalam pemrosesan.`);
            }
            idSet.add(uniqueId);

            const base: Question = {
              id: uniqueId,
              bank_id: bankContext.id,
              school_id: bankContext.school_id,
              type: row._type,
              subject: bankContext.subject,
              levels: [bankContext.level],
              category: String(row.TOPIK || 'IMPORT').toUpperCase(),
              difficulty: 'Sedang',
              question_text: String(row.PERTANYAAN || ''),
              weight: parseFloat(row.BOBOT) || 1,
              discussion: String(row.PEMBAHASAN || ''),
              updated_at: new Date().toISOString()
            };

            if (row._type === 'pilihan_ganda' || row._type === 'pilihan_ganda_kompleks') {
              const keys = String(row.KUNCI_JAWABAN || '').split(',').map(s => s.trim().toUpperCase());
              base.options = [
                { label: 'A', text: String(row.OPSI_A || ''), is_correct: keys.includes('A') },
                { label: 'B', text: String(row.OPSI_B || ''), is_correct: keys.includes('B') },
                { label: 'C', text: String(row.OPSI_C || ''), is_correct: keys.includes('C') },
                { label: 'D', text: String(row.OPSI_D || ''), is_correct: keys.includes('D') },
                { label: 'E', text: String(row.OPSI_E || ''), is_correct: keys.includes('E') }
              ].filter(o => o.text !== '');
            }

            if (row._type === 'benar_salah') {
              const statements: TrueFalseStatement[] = [];
              for (let i = 1; i <= 5; i++) {
                const text = row[`PERNYATAAN_${i}`];
                const ans = String(row[`JAWABAN_${i}`] || '').toUpperCase();
                if (text) {
                  statements.push({ id: `tf_${uniqueId}_${i}`, text: String(text), is_true: ['BENAR', 'TRUE', 'B', '1'].includes(ans) });
                }
              }
              base.statements = statements;
            }

            if (row._type === 'menjodohkan') {
              const pairs: MatchPair[] = [];
              for (let i = 1; i <= 5; i++) {
                const left = row[`MJ_${i}_KIRI`];
                const right = row[`MJ_${i}_KANAN`];
                if (left && right) {
                  pairs.push({ id: `mj_${uniqueId}_${i}`, left_text: String(left), right_text: String(right) });
                }
              }
              base.matching_pairs = pairs;
            }

            return base;
          });

        onImport(questionsToSave);
      } catch (err: any) {
        alert(`IMPORT GAGAL: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white border border-gray-400 rounded-sm shadow-2xl w-full max-w-5xl flex flex-col h-[85vh] animate-in zoom-in duration-200">
        <div className="bg-gray-100 border-b border-gray-300 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-emerald-700 text-white rounded-sm"><FileSpreadsheet size={20} /></div>
            <div>
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight">Import Butir Soal (INSERT-ONLY MODE)</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Database Law: No Upsert. Explicit column filtering active.</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors rounded-sm"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin bg-[#fcfcfc]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-8 border-2 border-dashed rounded-sm transition-all flex flex-col items-center justify-center text-center ${file ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200 hover:border-emerald-400'}`}>
              <div className="p-4 rounded-full bg-gray-100 text-gray-400 mb-3">
                {isValidating ? <Loader2 className="animate-spin" size={32} /> : <Upload size={32} />}
              </div>
              <h3 className="text-xs font-black text-gray-800 uppercase mb-2">{file ? file.name : 'Unggah File XLSX'}</h3>
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx" onChange={handleFileChange} />
              <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest rounded-sm hover:bg-black">Pilih Berkas</button>
            </div>

            <div className="bg-white border border-gray-300 p-5 rounded-sm flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Info size={16} className="text-blue-600" />
                <h4 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Kontrak Database Strict</h4>
              </div>
              <ul className="text-[9px] text-gray-500 space-y-1.5 uppercase font-bold tracking-tight flex-1">
                <li>• Proses import menggunakan <span className="text-red-600">INSERT MURNI</span>.</li>
                <li>• Kolom di luar skema (randomize, scoring) akan <span className="text-red-600">DIBUANG</span>.</li>
                <li>• Duplikasi ID dalam satu file akan memicu pembatalan total.</li>
              </ul>
              <button onClick={downloadTemplate} className="mt-4 w-full py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-[10px] uppercase tracking-widest rounded-sm flex items-center justify-center gap-2">
                <FileDown size={14} /> Unduh Strict Template
              </button>
            </div>
          </div>

          {(previewData.length > 0) && (
            <div className="space-y-3">
               <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest border-b pb-2">Status Validasi Batch ({previewData.length} Baris)</h3>
               <div className="border border-gray-300 rounded-sm overflow-hidden bg-white">
                 <table className="gov-table">
                   <thead>
                     <tr>
                       <th className="w-16">Tipe</th>
                       <th>Pratinjau Pertanyaan</th>
                       <th className="w-16 text-center">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {previewData.map((row, i) => (
                      <tr key={i} className={row._isValid ? '' : 'bg-red-50/30'}>
                        <td className="text-[9px] font-black uppercase text-gray-500">{row.TIPE_SOAL}</td>
                        <td className="text-[10px] text-gray-800 truncate max-w-xs">{row.PERTANYAAN}</td>
                        <td className="text-center">{row._isValid ? <CheckCircle size={14} className="text-emerald-600 mx-auto" /> : <AlertCircle size={14} className="text-red-500 mx-auto" />}</td>
                      </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>

        <div className="bg-gray-100 border-t border-gray-300 px-6 py-4 flex justify-end shrink-0 gap-2">
          <button onClick={onCancel} className="px-6 py-2 text-gray-600 font-black text-[10px] uppercase tracking-widest hover:bg-gray-200">Batal</button>
          <button 
            disabled={previewData.filter(d => d._isValid).length === 0 || isProcessing}
            onClick={handleImport}
            className="px-10 py-2 bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-sm hover:bg-emerald-800 shadow-sm flex items-center gap-2"
          >
            {isProcessing ? <><Loader2 className="animate-spin" size={14} /> Sinkronisasi...</> : 'Kirim ke Database Cloud'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionImportModal;
