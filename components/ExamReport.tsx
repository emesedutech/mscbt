import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Target,
  CheckCircle2,
  Printer,
  ChevronRight,
  Info,
  Layers,
  Zap,
  Activity
} from 'lucide-react';
import { ExamResult, Question, ItemAnalysisResult, ExamSchedule, SchoolProfile } from '../types.ts';

interface ExamReportProps {
  schedule: ExamSchedule;
  results: ExamResult[];
  questions: Question[];
  school: SchoolProfile | null;
  onPrintAnalysis: (payload: any) => void;
}

const ScoreDistributionChart: React.FC<{ results: ExamResult[] }> = ({ results }) => {
    const distribution = useMemo(() => {
        const ranges: Record<string, number> = { 
          '<50': 0, '50-59': 0, '60-69': 0, 
          '70-79': 0, '80-89': 0, '90-100': 0 
        };
        results.forEach(r => {
            const grade = r.final_grade;
            if (grade < 50) ranges['<50']++;
            else if (grade < 60) ranges['50-59']++;
            else if (grade < 70) ranges['60-69']++;
            else if (grade < 80) ranges['70-79']++;
            else if (grade < 90) ranges['80-89']++;
            else ranges['90-100']++;
        });
        return ranges;
    }, [results]);
    
    const maxCount = Math.max(...Object.values(distribution), 1);

    return (
        <div className="flex justify-between items-end gap-2 h-48 pt-4">
            {Object.entries(distribution).map(([range, count]) => (
                <div key={range} className="flex flex-col items-center flex-1 h-full group">
                    <div className="text-xs font-bold text-gray-500 group-hover:text-emerald-700">{count}</div>
                    <div 
                        className="w-full bg-gray-200 group-hover:bg-emerald-500 rounded-t-sm mt-1 transition-all" 
                        style={{ height: `${(count / maxCount) * 100}%` }}
                        title={`${count} siswa`}
                    ></div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mt-2">{range}</div>
                </div>
            ))}
        </div>
    );
};


const ExamReport: React.FC<ExamReportProps> = ({ schedule, results, questions, school, onPrintAnalysis }) => {
  const fmt = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  const detailedAnalysis = useMemo(() => {
    return questions.map((q, idx) => {
      const answers = results.map(r => r.answers.find(a => a.question_id === q.id)?.answer);
      const distractorMap: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
      
      // FIX: Safely handle different answer types to prevent arithmetic errors on non-string answers.
      // This ensures distractor analysis only runs on single-choice questions where answers are strings.
      if (q.type === 'pilihan_ganda') {
        answers.forEach(ans => {
          if (typeof ans === 'string' && distractorMap.hasOwnProperty(ans)) {
            distractorMap[ans]++;
          }
        });
      }

      const correctOpt = q.options?.find(o => o.is_correct)?.label || '-';
      const correctCount = answers.filter(a => a === correctOpt).length;
      
      const pValue = results.length > 0 ? correctCount / results.length : 0;
      
      let classification: 'Mudah' | 'Sedang' | 'Sukar' = 'Sedang';
      if (pValue > 0.75) classification = 'Mudah';
      else if (pValue < 0.25) classification = 'Sukar';

      let recommendation = 'Pertahankan';
      if (pValue > 0.9 || pValue < 0.1) recommendation = 'Dibuat Ulang';
      else if (pValue > 0.8 || pValue < 0.2) recommendation = 'Revisi';

      return {
        question_id: q.id,
        no: idx + 1, 
        key: correctOpt,
        correct: correctCount, 
        incorrect: results.length - correctCount,
        difficulty: pValue, 
        percentage: pValue * 100,
        classification, 
        recommendation, 
        distribution: distractorMap
      } as ItemAnalysisResult & { no: number, distribution: Record<string, number> };
    });
  }, [results, questions]);

  const triggerPrint = () => {
    onPrintAnalysis({ school, schedule, data: detailedAnalysis });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="gov-card p-6 border-t-4 border-emerald-500">
        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Distribusi Skor Hasil Ujian</h3>
        <ScoreDistributionChart results={results} />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-emerald-700 text-white rounded-sm shadow-sm"><Target size={18} /></div>
             <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Analisis Kualitas Butir Soal</h3>
           </div>
           <button onClick={triggerPrint} className="gov-btn gov-btn-primary text-[10px] shadow-lg">
              <Printer size={16} /> Export Analisis Lengkap (PDF)
           </button>
        </div>

        <div className="gov-table-container">
          <table className="gov-table">
            <thead>
              <tr>
                <th className="w-16 text-center">No</th>
                <th className="text-center">Kunci</th>
                <th className="text-center">Indeks P</th>
                <th className="text-center">Kesukaran</th>
                <th>Distribusi Jawaban (A | B | C | D | E)</th>
                <th className="text-right">Rekomendasi</th>
              </tr>
            </thead>
            <tbody>
              {detailedAnalysis.map((item) => (
                <tr key={item.question_id} className="hover:bg-gray-50 transition-colors">
                  <td className="text-center font-black text-gray-500">#{item.no}</td>
                  <td className="text-center font-black text-emerald-700">{item.key}</td>
                  <td className="text-center font-mono font-bold text-gray-700">{fmt(item.difficulty)}</td>
                  <td className="text-center">
                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-tighter ${
                      item.classification === 'Sukar' ? 'bg-red-50 text-red-700' :
                      item.classification === 'Mudah' ? 'bg-blue-50 text-blue-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {item.classification}
                    </span>
                  </td>
                  <td className="py-4">
                     <div className="flex items-center gap-1">
                        {['A', 'B', 'C', 'D', 'E'].map(label => {
                          const count = item.distribution[label] || 0;
                          const perc = results.length > 0 ? (count / results.length) * 100 : 0;
                          const isCorrect = label === item.key;
                          return (
                            <div key={label} className="flex-1 min-w-[40px] group relative">
                               <div className="h-6 bg-gray-100 rounded-sm overflow-hidden flex flex-col justify-end border border-gray-200">
                                  <div 
                                    className={`w-full transition-all duration-1000 ${isCorrect ? 'bg-emerald-500' : 'bg-gray-400'}`} 
                                    style={{ height: `${perc}%` }}
                                  ></div>
                               </div>
                               <span className={`text-[8px] block text-center font-bold mt-1 ${isCorrect ? 'text-emerald-700' : 'text-gray-400'}`}>{label}</span>
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-[8px] px-2 py-1 rounded-sm whitespace-nowrap z-50">
                                  {count} Siswa ({Math.round(perc)}%)
                               </div>
                            </div>
                          );
                        })}
                     </div>
                  </td>
                  <td className="text-right">
                    <span className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border ${
                      item.recommendation === 'Pertahankan' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      item.recommendation === 'Revisi' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {item.recommendation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExamReport;