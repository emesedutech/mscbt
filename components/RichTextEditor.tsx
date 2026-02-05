import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, List, Type, Sigma, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';
import FormulaEditor from './FormulaEditor.tsx';
import { supabase } from '../lib/supabase.ts';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  schoolId: string;
  placeholder?: string;
  minHeight?: string;
  variant?: 'question' | 'option'; 
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange,
  schoolId,
  placeholder, 
  minHeight = "140px",
  variant = 'question' 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const recordCursorPosition = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        setSavedSelection(range.cloneRange());
      }
    }
  };

  const execCommand = (command: string, val: string | undefined = undefined) => {
    if (showFormulaModal) return;
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleInput();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // Max 2MB
      setUploadError('Ukuran file maksimal 2MB.');
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `public/${schoolId}/questions/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);
      
      execCommand('insertImage', publicUrl);

    } catch (error: any) {
      setUploadError(`Gagal unggah: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInsertFormula = (katexHtml: string, latex: string) => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    
    let range = savedSelection;
    if (!range || !editorRef.current?.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(editorRef.current!);
      range.collapse(false);
    }

    const formulaSpan = document.createElement('span');
    formulaSpan.className = 'math-formula no-print';
    formulaSpan.contentEditable = 'false';
    formulaSpan.setAttribute('data-latex', latex);
    formulaSpan.style.display = 'inline-block';
    formulaSpan.style.margin = '0 4px';
    formulaSpan.style.verticalAlign = 'middle';
    formulaSpan.innerHTML = katexHtml;
    
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
      range.deleteContents();
      
      const wrapper = document.createDocumentFragment();
      wrapper.appendChild(document.createTextNode('\u200B'));
      wrapper.appendChild(formulaSpan);
      wrapper.appendChild(document.createTextNode('\u200B'));
      
      range.insertNode(wrapper);
      range.setStartAfter(formulaSpan);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    handleInput();
    setShowFormulaModal(false);
    setSavedSelection(null);
  };

  return (
    <div className="border border-slate-300 rounded-sm overflow-hidden bg-white focus-within:border-blue-500 transition-all shadow-sm">
      <div className="bg-slate-50 border-b border-slate-200 p-1 flex items-center flex-wrap gap-0.5 sticky top-0 z-10 no-print">
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }} className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-sm"><Bold size={14} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }} className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-sm"><Italic size={14} /></button>
        <div className="w-px h-4 bg-slate-300 mx-1"></div>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCommand('insertUnorderedList'); }} className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-sm"><List size={14} /></button>
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()} 
          disabled={isUploading}
          className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-sm disabled:opacity-50"
        >
          {isUploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        </button>
        <button 
          type="button" 
          onMouseDown={(e) => { e.preventDefault(); recordCursorPosition(); setShowFormulaModal(true); }} 
          className="px-3 py-1 bg-white hover:bg-slate-100 text-blue-700 rounded-sm flex items-center gap-2 font-black text-[9px] uppercase tracking-widest border border-slate-300 ml-1"
        >
          <Sigma size={12} /> Formula
        </button>
        {uploadError && <span className="text-xs text-red-600 ml-2 font-bold">{uploadError}</span>}
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCommand('removeFormat'); }} className="p-1.5 hover:bg-slate-200 text-slate-300 rounded-sm ml-auto"><Type size={14} /></button>
      </div>
      
      <div 
        ref={editorRef}
        contentEditable={!showFormulaModal}
        onInput={handleInput}
        onKeyUp={recordCursorPosition}
        onMouseUp={recordCursorPosition}
        className={`p-4 outline-none overflow-y-auto scrollbar-thin text-slate-800 text-sm leading-relaxed editor-content variant-${variant} ${showFormulaModal ? 'bg-slate-50' : 'bg-white'}`}
        style={{ minHeight }}
      ></div>

      {showFormulaModal && (
        <FormulaEditor onClose={() => setShowFormulaModal(false)} onInsert={handleInsertFormula} />
      )}
    </div>
  );
};

export default RichTextEditor;
