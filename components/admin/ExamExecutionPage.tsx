
import React, { useState } from 'react';
import ExamMonitoringDashboard from '../ExamMonitoringDashboard.tsx';
import { ExamSession, ExamSchedule, Student, ExamResult } from '../../types.ts';

interface ExamExecutionPageProps {
  examSessions: ExamSession[];
  examSchedules: ExamSchedule[];
  students: Student[];
  examResults: ExamResult[];
}

const ExamExecutionPage: React.FC<ExamExecutionPageProps> = (props) => {
  const { examSessions, examSchedules, students, examResults } = props;
  const [activeMonitoringSession, setActiveMonitoringSession] = useState<ExamSession | null>(null);
  
  if (activeMonitoringSession) {
    const pkg = examSchedules.find(p => p.id === activeMonitoringSession.schedule_id);
    return <ExamMonitoringDashboard session={activeMonitoringSession} pkg={pkg!} students={students} results={examResults} onBack={() => setActiveMonitoringSession(null)} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {examSessions.filter(s => s.status === 'Berlangsung').map(s => (
        <button key={s.id} onClick={() => setActiveMonitoringSession(s)} className="gov-card p-6 text-left hover:border-emerald-500 transition-all">
          <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Sesi Aktif</p>
          <h4 className="font-bold text-gray-800">{s.name}</h4>
          <p className="text-xs text-gray-500 mt-1">{s.date} | {s.start_time}</p>
        </button>
      ))}
      {examSessions.filter(s => s.status === 'Berlangsung').length === 0 && (
        <div className="col-span-3 py-20 text-center text-gray-400 font-bold uppercase italic">
          Tidak ada sesi ujian aktif.
        </div>
      )}
    </div>
  );
};

export default ExamExecutionPage;
