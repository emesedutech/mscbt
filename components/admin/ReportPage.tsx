
import React, { useState } from 'react';
import ResultList from '../ResultList.tsx';
import ExamReport from '../ExamReport.tsx';
import PrintService from '../PrintService.tsx';
import { ExamSchedule, ExamResult, Student, Question, SchoolProfile } from '../../types.ts';

interface ReportPageProps {
  examSchedules: ExamSchedule[];
  examResults: ExamResult[];
  students: Student[];
  questions: Question[];
  mergedProfileData: SchoolProfile | null;
}

const ReportPage: React.FC<ReportPageProps> = (props) => {
  const { examSchedules, examResults, students, questions, mergedProfileData } = props;
  const [selectedSchedule, setSelectedSchedule] = useState<ExamSchedule | null>(null);
  const [activePrintJob, setActivePrintJob] = useState<any>(null);

  const handlePrintLeger = (payload: any) => {
    setActivePrintJob({ type: 'LEGER_NILAI', ...payload });
  };
  
  const handlePrintAnalysis = (payload: any) => {
    setActivePrintJob({ type: 'ANALISIS_BUTIR', ...payload });
  };
  
  const filteredResults = selectedSchedule ? examResults.filter(r => r.schedule_id === selectedSchedule.id) : [];
  const filteredQuestions = selectedSchedule ? questions.filter(q => q.bank_id === selectedSchedule.bank_id) : [];

  return (
    <>
      <div className="space-y-8">
        <div className="flex gap-4">
          <select onChange={(e) => setSelectedSchedule(examSchedules.find(p => p.id === e.target.value) || null)} className="gov-input max-w-md font-bold">
            <option value="">-- PILIH PAKET UJIAN UNTUK MELIHAT LAPORAN --</option>
            {examSchedules.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {selectedSchedule && (
          <div className="space-y-12">
            <ResultList 
              results={filteredResults} 
              students={students} 
              school={mergedProfileData} 
              examName={selectedSchedule.name} 
              onPrintLeger={handlePrintLeger} 
            />
            <ExamReport 
              schedule={selectedSchedule} 
              results={filteredResults} 
              questions={filteredQuestions} 
              school={mergedProfileData} 
              onPrintAnalysis={handlePrintAnalysis} 
            />
          </div>
        )}
      </div>
      {activePrintJob && <PrintService {...activePrintJob} onDone={() => setActivePrintJob(null)} />}
    </>
  );
};

export default ReportPage;
