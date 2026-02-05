import React, { useState } from 'react';
import QuestionBankTable from '../QuestionBankTable.tsx';
import QuestionBankForm from '../QuestionBankForm.tsx';
import QuestionListTable from '../QuestionListTable.tsx';
import QuestionForm from '../QuestionForm.tsx';
import GlobalBankBrowser from '../GlobalBankBrowser.tsx';
import { QuestionBank, Question, SubjectMaster, GradeLevel } from '../../types.ts';

interface QuestionSourcePageProps {
  schoolId: string;
  augmentedQuestionBanks: QuestionBank[];
  questions: Question[];
  questionBanks: QuestionBank[];
  masterMapel: SubjectMaster[];
  masterKelas: GradeLevel[];
  saveToDb: (stateKey: string, data: any, forceInsert?: boolean) => Promise<void>;
  deleteFromDb: (stateKey: string, item: any) => void;
  refreshData: () => void;
  subPath: string;
}

const QuestionSourcePage: React.FC<QuestionSourcePageProps> = (props) => {
  const { schoolId, augmentedQuestionBanks, questions, questionBanks, masterMapel, masterKelas, saveToDb, deleteFromDb, refreshData, subPath } = props;

  const [isAdding, setIsAdding] = useState(false);
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null); // For editing a question

  const handleSaveQuestion = async (data: any, reset: boolean) => {
    await saveToDb('questions', data);
    if (reset) {
      setSelectedItem({}); // Stay on form for new question, clear fields
    } else {
      setSelectedItem(null); // Go back to bank list
    }
    // Refresh parent state to update counts
    await refreshData();
  };

  if (subPath === '/bank-soal-pusat') {
    return <GlobalBankBrowser schoolId={schoolId} subjects={masterMapel} gradeLevels={masterKelas} onImportComplete={refreshData} />;
  }

  // Default to '/bank-soal'
  if (selectedItem) return <QuestionForm initialData={selectedItem.id ? selectedItem : undefined} bankContext={selectedBank!} onSave={handleSaveQuestion} onCancel={() => setSelectedItem(null)} />;
  if (selectedBank) return <QuestionListTable bank={selectedBank} questions={questions.filter(q => q.bank_id === selectedBank.id)} onBack={() => setSelectedBank(null)} onAddQuestion={() => setSelectedItem({})} onImportQuestions={(d) => saveToDb('questions', d, true)} onEditQuestion={(q) => setSelectedItem(q)} onDeleteQuestion={(q) => deleteFromDb('questions', q)} />;
  if (isAdding) return <QuestionBankForm subjects={masterMapel} gradeLevels={masterKelas} existingBanks={questionBanks} onSave={async (d) => { await saveToDb('question_banks', { ...d, is_active: true }); setIsAdding(false); }} onCancel={() => setIsAdding(false)} />;
  
  return <QuestionBankTable data={augmentedQuestionBanks} subjects={masterMapel} onAdd={() => setIsAdding(true)} onEdit={() => {}} onDelete={(item) => deleteFromDb('question_banks', item)} onViewDetails={(item) => setSelectedBank(item)} />;
};

export default QuestionSourcePage;