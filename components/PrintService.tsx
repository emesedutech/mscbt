
import React from 'react';
import PrintProvider from '../print/PrintProvider.tsx';
import { PrintDocType } from '../print/print.types.ts';
import { SchoolProfile, ExamSession, Student } from '../types.ts';

interface PrintServiceProps {
  type: PrintDocType;
  school: SchoolProfile;
  session?: ExamSession;
  students?: Student[];
  selectedRoomId?: string;
  onDone?: () => void;
}

const PrintService: React.FC<PrintServiceProps> = (props) => {
  return <PrintProvider {...props} />;
};

export default PrintService;
