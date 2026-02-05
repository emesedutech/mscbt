
import React, { useState } from 'react';
import ExamSessionHub from '../ExamSessionHub.tsx';
import ExamSessionForm from '../ExamSessionForm.tsx';
import PrintService from '../PrintService.tsx';
import { ExamSession, ExamSchedule, Teacher, ExamRoom, Student, SchoolProfile } from '../../types.ts';

interface ExamSessionPageProps {
  sessions: ExamSession[];
  packages: ExamSchedule[];
  teachers: Teacher[];
  roomsMaster: ExamRoom[];
  students: Student[];
  mergedProfileData: SchoolProfile | null;
  saveToDb: (stateKey: string, data: any) => Promise<void>;
  deleteFromDb: (stateKey: string, item: any) => void;
}

const ExamSessionPage: React.FC<ExamSessionPageProps> = (props) => {
  const { sessions, packages, teachers, roomsMaster, students, mergedProfileData, saveToDb, deleteFromDb } = props;

  const [isEditing, setIsEditing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [activePrintJob, setActivePrintJob] = useState<any>(null);

  const handleSave = async (data: ExamSession) => {
    await saveToDb('exam_sessions', data);
    setIsEditing(false);
    setSelectedItem(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedItem(null);
  };
  
  const handlePrintRequest = (type: any, session: any, roomId: string) => {
    setActivePrintJob({
      type,
      school: mergedProfileData,
      session,
      students: students.filter(s => session.rooms.find((r:any) => r.id === roomId)?.student_ids.includes(s.id)),
      selectedRoomId: roomId
    });
  };

  return (
    <>
      {isEditing ? (
        <ExamSessionForm 
          initialData={selectedItem} 
          packages={packages} 
          teachers={teachers} 
          roomsMaster={roomsMaster} 
          students={students} 
          onSave={handleSave} 
          onCancel={handleCancel} 
        />
      ) : (
        <ExamSessionHub 
          sessions={sessions} 
          packages={packages} 
          roomsMaster={roomsMaster} 
          onAddSession={() => { setIsEditing(true); setSelectedItem(null); }} 
          onEditSession={(item) => { setIsEditing(true); setSelectedItem(item); }} 
          onDeleteSession={(item) => deleteFromDb('exam_sessions', item)} 
          onPrintRequest={handlePrintRequest} 
        />
      )}
      {activePrintJob && <PrintService {...activePrintJob} onDone={() => setActivePrintJob(null)} />}
    </>
  );
};

export default ExamSessionPage;
