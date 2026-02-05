import React, { useState } from 'react';
import ExamScheduleTable from '../ExamScheduleTable.tsx';
import ExamScheduleForm from '../ExamScheduleForm.tsx';
import PackageContentManager from '../PackageContentManager.tsx';
import { ExamSchedule, QuestionBank, Question } from '../../types.ts';

interface ExamPackagePageProps {
  examSchedules: ExamSchedule[];
  questionBanks: QuestionBank[];
  questions: Question[];
  saveToDb: (stateKey: string, data: any) => Promise<void>;
  deleteFromDb: (stateKey: string, item: any) => void;
}

const ExamPackagePage: React.FC<ExamPackagePageProps> = (props) => {
  const { examSchedules, questionBanks, questions, saveToDb, deleteFromDb } = props;

  const [isEditing, setIsEditing] = useState(false);
  const [isManagingContent, setIsManagingContent] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleSave = async (data: ExamSchedule) => {
    await saveToDb('exam_schedules', data);
    setIsEditing(false);
    setSelectedItem(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedItem(null);
  };
  
  const handleManageContent = (pkg: ExamSchedule) => {
    setSelectedItem(pkg);
    setIsManagingContent(true);
  };

  const handleSaveContent = async (questionIds: string[]) => {
    if (!selectedItem) return;
    await saveToDb('exam_schedules', { ...selectedItem, question_ids: questionIds });
    setIsManagingContent(false);
    setSelectedItem(null);
  };

  if (isManagingContent) {
    return <PackageContentManager 
        schedule={selectedItem}
        allQuestions={questions}
        onSave={handleSaveContent}
        onCancel={() => { setIsManagingContent(false); setSelectedItem(null); }}
    />
  }

  if (isEditing) {
    return <ExamScheduleForm initialData={selectedItem} questionBanks={questionBanks} questions={questions} onSave={handleSave} onCancel={handleCancel} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Manajemen Paket Ujian</h2>
          <p className="text-sm text-gray-500 font-medium">Buat dan konfigurasikan set soal yang akan dijadwalkan.</p>
        </div>
        <button onClick={() => { setIsEditing(true); setSelectedItem(null); }} className="gov-btn gov-btn-primary text-xs">
          Buat Paket Ujian Baru
        </button>
      </div>
      <ExamScheduleTable 
        data={examSchedules} 
        onEdit={(item) => { setIsEditing(true); setSelectedItem(item); }} 
        onDelete={(item) => deleteFromDb('exam_schedules', item)}
        onManageContent={handleManageContent}
      />
    </div>
  );
};

export default ExamPackagePage;
