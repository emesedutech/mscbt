
import React from 'react';
import { Student, QuestionBank, ExamSession, Teacher } from '../../types.ts';

interface DashboardPageProps {
  schoolName?: string;
  students: Student[];
  questionBanks: QuestionBank[];
  examSessions: ExamSession[];
  teachers: Teacher[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({ schoolName, students, questionBanks, examSessions, teachers }) => {
  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Dashboard Asesmen</h1>
        <p className="text-sm text-gray-500 uppercase font-bold tracking-widest">{schoolName}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="gov-card p-5 border-l-4 border-emerald-500">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Siswa Aktif</p>
            <p className="text-3xl font-black text-gray-800">{students.length}</p>
          </div>
        </div>
        <div className="gov-card p-5 border-l-4 border-blue-500">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Bank Soal</p>
            <p className="text-3xl font-black text-gray-800">{questionBanks.length}</p>
          </div>
        </div>
        <div className="gov-card p-5 border-l-4 border-indigo-500">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Sesi Jadwal</p>
            <p className="text-3xl font-black text-gray-800">{examSessions.length}</p>
          </div>
        </div>
        <div className="gov-card p-5 border-l-4 border-orange-500">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Total Pengelola</p>
            <p className="text-3xl font-black text-gray-800">{teachers.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
