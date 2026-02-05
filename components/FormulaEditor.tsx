import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Check, Sigma, ChevronRight } from 'lucide-react';

declare const katex: any;

interface FormulaTemplate {
  id: string;
  name: string;
  latex: string;
  fields: { id: string; label: string; placeholder: string; default: string }[];
  category: string;
  iconLatex: string; 
}

const FORMULA_TEMPLATES: FormulaTemplate[] = [
  { id: 'frac', name: 'Pecahan', latex: '\\frac{numerator}{denominator}', category: 'Dasar', iconLatex: '\\frac{a}{b}', fields: [ { id: 'numerator', label: 'Pembilang', placeholder: 'a', default: 'a' }, { id: 'denominator', label: 'Penyebut', placeholder: 'b', default: 'b' } ] },
  { id: 'pow', name: 'Pangkat', latex: '{base}^{exp}', category: 'Dasar', iconLatex: 'x^n', fields: [ { id: 'base', label: 'Basis', placeholder: 'x', default: 'x' }, { id: 'exp', label: 'Pangkat', placeholder: 'n', default: '2' } ] },
  { id: 'sqrt', name: 'Akar', latex: '\\sqrt{value}', category: 'Dasar', iconLatex: '\\sqrt{x}', fields: [{ id: 'value', label: 'Nilai', placeholder: 'x', default: 'x' }] },
  { id: 'sqrtn', name: 'Akar n', latex: '\\sqrt[n]{value}', category: 'Dasar', iconLatex: '\\sqrt[n]{x}', fields: [ { id: 'n', label: 'n', placeholder: '3', default: '3' }, { id: 'value', label: 'Nilai', placeholder: 'x', default: 'x' } ] },
  { id: 'linear', name: 'Linier', latex: '{a}x + {b} = {c}', category: 'Aljabar', iconLatex: 'ax+b=c', fields: [ { id: 'a', label: 'Koef. a', placeholder: '2', default: '2' }, { id: 'b', label: 'Konst. b', placeholder: '3', default: '3' }, { id: 'c', label: 'Hasil c', placeholder: '0', default: '0' } ] },
  { id: 'quad', name: 'Kuadrat', latex: '{a}x^2 + {b}x + {c} = 0', category: 'Aljabar', iconLatex: 'ax^2+b', fields: [ { id: 'a', label: 'a', placeholder: '1', default: '1' }, { id: 'b', label: 'b', placeholder: '5', default: '5' }, { id: 'c', label: 'c', placeholder: '6', default: '6' } ] },
  { id: 'mat2', name: 'Matriks 2x2', latex: '\\begin{pmatrix} {a} & {b} \\\\ {c} & {d} \\end{pmatrix}', category: 'Matriks', iconLatex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', fields: [ { id: 'a', label: 'a11', placeholder: '1', default: '1' }, { id: 'b', label: 'a12', placeholder: '0', default: '0' }, { id: 'c', label: 'a21', placeholder: '0', default: '0' }, { id: 'd', label: 'a22', placeholder: '1', default: '1' } ] },
  { id: 'lim', name: 'Limit', latex: '\\lim_{x \\to {to}} {func}', category: 'Kalkulus', iconLatex: '\\lim', fields: [ { id: 'to', label: 'Ke', placeholder: '0', default: '0' }, { id: 'func', label: 'Fungsi', placeholder: 'f(x)', default: 'f(x)' } ] },
  { id: 'int', name: 'Integral', latex: '\\int_{lower}^{upper} {func} dx', category: 'Kalkulus', iconLatex: '\\int', fields: [ { id: 'lower', label: 'Bawah', placeholder: 'a', default: 'a' }, { id: 'upper', label: 'Atas', placeholder: 'b', default: 'b' }, { id: 'func', label: 'Fungsi', placeholder: 'f(x)', default: 'f(x)' } ] }
];

interface FormulaEditorProps {
  onInsert: (html: string, latex: string) => void;
  onClose: () => void;
}

const FormulaEditor: React.FC<FormulaEditorProps> = ({ onInsert, onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<FormulaTemplate>(FORMULA_TEMPLATES[0]);
  const [params, setParams] = useState<Record<string, string>>({});
  const previewRef = useRef<HTMLDivElement>(null);
  const categories = useMemo(() => Array.from(new Set(FORMULA_TEMPLATES.map(t => t.category))), []);

  useEffect(() => {
    const defaults: Record<string, string> = {};
    selectedTemplate.fields.forEach(f => { defaults[f.id] = f.default; });
    setParams(defaults);
  }, [selectedTemplate]);

  const currentLatex = useMemo(() => {
    let result = selectedTemplate.latex;
    Object.entries(params).forEach(([key, val]) => {
      result = result.replace(`{${key}}`, val || ' ');
    });
    return result;
  }, [selectedTemplate, params]);

  useEffect(() => {
    const kt = (window as any).katex;
    if (previewRef.current && kt) {
      try {
        kt.render(currentLatex, previewRef.current, { throwOnError: false, displayMode: true });
      } catch (err) { /* Silently fail on render error */ }
    }
  }, [currentLatex]);

  const handleInsert = () => {
    if (previewRef.current) onInsert(previewRef.current.innerHTML, currentLatex);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white border border-gray-400 rounded-sm shadow-2xl w-full max-w-4xl flex flex-col h-[520px] overflow-hidden" 
           onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        {/* Formal Header */}
        <div className="bg-gray-100 border-b border-gray-300 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sigma size={16} className="text-gray-600" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Penyisipan Formula Matematika</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* 30/70 Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Icon Grid (30%) */}
          <div className="w-[30%] border-r border-gray-200 bg-gray-50 overflow-y-auto p-4 scrollbar-thin">
            {categories.map(cat => (
              <div key={cat} className="mb-4">
                <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 border-l-2 border-gray-300 ml-1">{cat}</h4>
                <div className="grid grid-cols-3 gap-1">
                  {FORMULA_TEMPLATES.filter(t => t.category === cat).map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t)}
                      className={`aspect-square border flex items-center justify-center transition-colors rounded-sm ${selectedTemplate.id === t.id ? 'bg-white border-emerald-600 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-400'}`}
                    >
                      <StaticPreview latex={t.iconLatex} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Parameters & Preview (70%) */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden p-6 space-y-6">
            <div className="space-y-4">
               <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 uppercase tracking-tight bg-emerald-50 w-fit px-2 py-0.5 rounded-sm">
                  <ChevronRight size={12} /> Template: {selectedTemplate.name}
               </div>
               <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {selectedTemplate.fields.map(f => (
                    <div key={f.id} className="flex flex-col">
                      <label className="text-[9px] font-bold text-gray-500 uppercase mb-1">{f.label}</label>
                      <input 
                        autoFocus={selectedTemplate.fields[0].id === f.id}
                        type="text"
                        value={params[f.id] || ''}
                        onChange={(e) => setParams({...params, [f.id]: e.target.value})}
                        className="px-3 py-1.5 border border-gray-300 rounded-sm text-xs focus:border-emerald-600 outline-none font-mono"
                        placeholder={f.placeholder}
                      />
                    </div>
                  ))}
               </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center border-t border-gray-100 pt-4">
               <span className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.3em] mb-4">Pratinjau Hasil (KaTeX)</span>
               <div className="bg-gray-50 border border-gray-200 rounded-sm w-full h-32 flex items-center justify-center overflow-hidden">
                  <div ref={previewRef} className="text-3xl text-gray-800"></div>
               </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
               <button onClick={onClose} className="px-5 py-2 border border-gray-300 rounded-sm text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:bg-gray-50 transition-all">Batal</button>
               <button onClick={handleInsert} className="px-8 py-2 bg-emerald-700 text-white rounded-sm font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-sm">Sisipkan Formula</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StaticPreview: React.FC<{ latex: string }> = ({ latex }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const kt = (window as any).katex;
    if (ref.current && kt) kt.render(latex, ref.current, { throwOnError: false, displayMode: false });
  }, [latex]);
  return <div ref={ref} className="text-[10px] text-gray-600 scale-90"></div>;
};

export default FormulaEditor;