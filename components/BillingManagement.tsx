
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase.ts';
import { School, Invoice, Reseller, ResellerCommission } from '../types.ts';
import { Loader2, Search, FilePlus, Check, AlertTriangle, X, DollarSign, Calendar, ShieldCheck, Handshake } from 'lucide-react';
import { generateInvoiceHTML, generateKuitansiHTML } from '../lib/pdfTemplates.ts';
import { generatePdfFromHtml } from '../lib/pdf.ts';

type Recipient = {
  id: string;
  name: string;
  details: string;
  type: 'school' | 'reseller';
};

const BillingManagement: React.FC = () => {
    const [schools, setSchools] = useState<School[]>([]);
    const [resellers, setResellers] = useState<Reseller[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [commissions, setCommissions] = useState<ResellerCommission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'school' | 'reseller'>('school');
    
    const [invoiceModal, setInvoiceModal] = useState<{ isOpen: boolean; recipient: Recipient | null }>({ isOpen: false, recipient: null });
    const [feeModal, setFeeModal] = useState<{ isOpen: boolean; reseller: Reseller; commissions: ResellerCommission[] }>({ isOpen: false, reseller: null as any, commissions: [] });
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; invoice: Invoice | null }>({ isOpen: false, invoice: null });

    const fetchData = async () => {
        setIsLoading(true);
        const [schoolsRes, resellersRes, invoicesRes, commissionsRes] = await Promise.all([
            supabase.from('schools').select('*').order('nama', { ascending: true }),
            supabase.from('resellers').select('*').order('nama', { ascending: true }),
            supabase.from('invoices').select('*').order('created_at', { ascending: false }),
            supabase.from('reseller_commissions').select('*')
        ]);
        if (schoolsRes.data) setSchools(schoolsRes.data as School[]);
        if (resellersRes.data) setResellers(resellersRes.data as Reseller[]);
        if (invoicesRes.data) setInvoices(invoicesRes.data as Invoice[]);
        if (commissionsRes.data) setCommissions(commissionsRes.data as ResellerCommission[]);
        setIsLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const unpaidCommissionsByReseller = useMemo(() => {
        const map = new Map<string, { total: number; items: ResellerCommission[] }>();
        const unpaid = commissions.filter(c => c.status === 'unpaid');
        
        unpaid.forEach(c => {
            if (!map.has(c.reseller_id)) {
                map.set(c.reseller_id, { total: 0, items: [] });
            }
            const current = map.get(c.reseller_id)!;
            current.total += c.commission_amount;
            current.items.push(c);
        });
        return map;
    }, [commissions]);

    const handleGenerateInvoice = async (formData: any) => {
        const recipient = invoiceModal.recipient;
        if (!recipient) return;

        const prefix = recipient.type === 'school' ? (schools.find(s=>s.id === recipient.id)?.npsn || 'SCHOOL') : 'RESELLER';
        const invoiceIdStr = `INV-${prefix}-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
        
        const newInvoice: Omit<Invoice, 'id' | 'created_at'> = {
            school_id: recipient.type === 'school' ? recipient.id : '',
            invoice_id_str: invoiceIdStr,
            status: 'pending',
            amount: formData.amount,
            period_start: formData.period_start,
            period_end: formData.period_end,
            due_date: formData.due_date,
            item_description: formData.item_description,
            recipient_id: recipient.id,
            recipient_type: recipient.type,
            recipient_name: recipient.name,
            recipient_details: recipient.details,
        };

        const { data, error } = await supabase.from('invoices').insert(newInvoice).select().single();
        if (error) { alert(`Gagal: ${error.message}`); return; }

        generatePdfFromHtml(generateInvoiceHTML({ invoice: data as Invoice }));
        setInvoiceModal({ isOpen: false, recipient: null });
        fetchData();
    };

    const handlePayFee = async (reseller: Reseller, commissionsToPay: ResellerCommission[]) => {
        const totalAmount = commissionsToPay.reduce((acc, c) => acc + c.commission_amount, 0);
        const invoiceIdStr = `FEE-${reseller.username}-${Date.now()}`;
        const paymentDate = new Date().toISOString();

        const feeRecord: Omit<Invoice, 'id' | 'created_at'> = {
            school_id: '',
            invoice_id_str: invoiceIdStr,
            status: 'paid',
            amount: totalAmount,
            period_start: commissionsToPay[0]?.created_at || paymentDate,
            period_end: paymentDate,
            due_date: paymentDate,
            payment_date: paymentDate,
            item_description: `Pembayaran Komisi Kemitraan (${commissionsToPay.length} sekolah)`,
            recipient_id: reseller.id,
            recipient_type: 'reseller',
            recipient_name: reseller.nama,
            recipient_details: reseller.email,
        };
        
        const { data: invoiceData, error: invoiceError } = await supabase.from('invoices').insert(feeRecord).select().single();
        if (invoiceError) { alert(`Gagal mencatat pembayaran: ${invoiceError.message}`); return; }

        const commissionIds = commissionsToPay.map(c => c.id);
        const { error: commissionError } = await supabase
            .from('reseller_commissions')
            .update({ status: 'paid', paid_at: paymentDate, invoice_id: invoiceData.id })
            .in('id', commissionIds);
        
        if (commissionError) {
            alert(`KRITIS: Pembayaran tercatat (ID: ${invoiceData.id}), tetapi gagal update status komisi. Hubungi admin teknis.`);
            return;
        }

        generatePdfFromHtml(generateKuitansiHTML({ invoice: invoiceData as Invoice }));
        setFeeModal({ isOpen: false, reseller: null as any, commissions: [] });
        fetchData();
    };

    const handleMarkAsPaid = async () => {
        const invoice = confirmModal.invoice;
        if (!invoice) return;

        const { data, error } = await supabase.from('invoices').update({ status: 'paid', payment_date: new Date().toISOString() }).eq('id', invoice.id).select().single();
        if (error) { alert(`Gagal: ${error.message}`); return; }

        generatePdfFromHtml(generateKuitansiHTML({ invoice: data as Invoice }));
        setConfirmModal({ isOpen: false, invoice: null });
        fetchData();
    };
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

    const renderTable = () => {
        const dataList = activeTab === 'school' 
          ? schools.filter(s => s.nama.toLowerCase().includes(search.toLowerCase()) || s.npsn.includes(search))
          : resellers.filter(r => r.nama.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search));

        return (
            <div className="gov-table-container">
                <table className="gov-table">
                    <thead><tr><th>Nama Penerima</th><th className="text-center">Detail</th><th className="text-center">Status Terakhir</th><th className="text-right">Aksi</th></tr></thead>
                    <tbody>
                        {dataList.map(item => {
                            const recipient: Recipient = activeTab === 'school'
                              ? { id: item.id, name: item.nama, details: `NPSN: ${(item as School).npsn}`, type: 'school' }
                              : { id: item.id, name: item.nama, details: (item as Reseller).email, type: 'reseller' };

                            const latestSchoolInvoice = activeTab === 'school' ? invoices.find(inv => inv.recipient_id === item.id) : null;
                            const resellerCommissionData = activeTab === 'reseller' ? unpaidCommissionsByReseller.get(item.id) : null;
                            
                            return (
                            <tr key={item.id} className="group">
                                <td><div className="flex flex-col"><span className="font-black text-sm text-gray-800 uppercase tracking-tight">{item.nama}</span><span className="text-[10px] text-gray-400 font-bold uppercase">{item.kota}</span></div></td>
                                <td className="text-center"><span className="text-[9px] font-black uppercase">{recipient.details}</span></td>
                                <td className="text-center">
                                    {activeTab === 'school' ? (
                                        <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border ${!latestSchoolInvoice ? 'text-gray-400' : latestSchoolInvoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                            {!latestSchoolInvoice ? 'N/A' : latestSchoolInvoice.status === 'paid' ? 'LUNAS' : 'PENDING'}
                                        </span>
                                    ) : (
                                        <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest ${resellerCommissionData ? 'text-amber-700' : 'text-gray-400'}`}>
                                            {resellerCommissionData ? `FEE: ${formatCurrency(resellerCommissionData.total)}` : 'LUNAS'}
                                        </span>
                                    )}
                                </td>
                                <td className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {activeTab === 'school' ? (
                                            <>
                                                {(!latestSchoolInvoice || latestSchoolInvoice.status === 'paid') && (
                                                    <button onClick={() => setInvoiceModal({isOpen: true, recipient })} className="gov-btn gov-btn-primary text-[10px]"><FilePlus size={14} /> INVOICE</button>
                                                )}
                                                {latestSchoolInvoice?.status === 'pending' && (
                                                    <button onClick={() => setConfirmModal({isOpen: true, invoice: latestSchoolInvoice})} className="gov-btn bg-emerald-600 text-white hover:bg-emerald-700 text-[10px]"><Check size={14}/> LUNAS</button>
                                                )}
                                            </>
                                        ) : (
                                            <button disabled={!resellerCommissionData} onClick={() => setFeeModal({isOpen: true, reseller: item as Reseller, commissions: resellerCommissionData!.items})} className="gov-btn bg-blue-600 text-white hover:bg-blue-700 text-[10px] disabled:bg-gray-300 disabled:cursor-not-allowed"><DollarSign size={14}/> BAYAR FEE</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <h1 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tight">Billing & Faktur</h1>
            <div className="flex gap-1 border-b border-gray-200">
                <button onClick={() => setActiveTab('school')} className={`py-2 px-4 text-sm font-bold flex items-center gap-2 ${activeTab === 'school' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500'}`}><ShieldCheck size={16}/> Tenant Sekolah</button>
                <button onClick={() => setActiveTab('reseller')} className={`py-2 px-4 text-sm font-bold flex items-center gap-2 ${activeTab === 'reseller' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500'}`}><Handshake size={16}/> Mitra Reseller</button>
            </div>
            <div className="gov-card p-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Cari ${activeTab === 'school' ? 'sekolah' : 'reseller'}...`} className="gov-input w-full pl-12" />
                </div>
            </div>
            {isLoading ? <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-gray-300" /></div> : renderTable()}
            
            {invoiceModal.isOpen && <InvoiceFormModal recipient={invoiceModal.recipient!} onSave={handleGenerateInvoice} onCancel={() => setInvoiceModal({isOpen: false, recipient: null})} />}
            {feeModal.isOpen && <ConfirmFeePaymentModal reseller={feeModal.reseller} commissions={feeModal.commissions} onConfirm={handlePayFee} onCancel={() => setFeeModal({ isOpen: false, reseller: null as any, commissions: [] })} />}
            {confirmModal.isOpen && <ConfirmPaymentModal onConfirm={handleMarkAsPaid} onCancel={() => setConfirmModal({isOpen: false, invoice: null})} />}
        </div>
    );
};

const InvoiceFormModal: React.FC<{ recipient: Recipient, onSave: (data: any) => void, onCancel: () => void }> = ({ recipient, onSave, onCancel }) => {
    const today = new Date();
    const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    
    const [formData, setFormData] = useState({
        item_description: `Lisensi Emes CBT Pro`,
        period_start: today.toISOString().split('T')[0],
        period_end: nextYear.toISOString().split('T')[0],
        due_date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 2500000,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg">
                <div className="flex items-center justify-between p-6 border-b"><h3 className="text-sm font-black uppercase">Invoice untuk {recipient.name}</h3><button onClick={onCancel}><X size={20}/></button></div>
                <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-8 space-y-6">
                    <div><label className="text-[10px] font-bold uppercase">Deskripsi</label><textarea name="item_description" value={formData.item_description} onChange={handleChange} className="gov-input w-full" rows={2} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-bold uppercase">Periode Mulai</label><input type="date" name="period_start" value={formData.period_start} onChange={handleChange} className="gov-input" /></div>
                        <div><label className="text-[10px] font-bold uppercase">Periode Akhir</label><input type="date" name="period_end" value={formData.period_end} onChange={handleChange} className="gov-input" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-bold uppercase">Jumlah Tagihan (IDR)</label><input type="number" name="amount" value={formData.amount} onChange={handleChange} className="gov-input" /></div>
                        <div><label className="text-[10px] font-bold uppercase">Jatuh Tempo</label><input type="date" name="due_date" value={formData.due_date} onChange={handleChange} className="gov-input" /></div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={onCancel} className="gov-btn gov-btn-secondary">Batal</button><button type="submit" className="gov-btn gov-btn-primary"><FilePlus size={14} /> GENERATE</button></div>
                </form>
            </div>
        </div>
    );
};

const ConfirmFeePaymentModal: React.FC<{ reseller: Reseller; commissions: ResellerCommission[]; onConfirm: (reseller: Reseller, commissions: ResellerCommission[]) => void; onCancel: () => void; }> = ({ reseller, commissions, onConfirm, onCancel }) => {
    const totalAmount = commissions.reduce((acc, c) => acc + c.commission_amount, 0);
    const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-sm shadow-2xl w-full max-w-md">
                <div className="p-6 flex items-start gap-4 border-b border-blue-100 bg-blue-50">
                    <DollarSign size={24} className="text-blue-600 mt-1" />
                    <div>
                        <h3 className="text-sm font-black uppercase">Konfirmasi Pembayaran Fee</h3>
                        <p className="text-xs text-gray-500 mt-1">Anda akan membayar total komisi yang belum dibayar untuk reseller <strong>{reseller.nama}</strong>.</p>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="text-center">
                        <p className="text-[10px] font-bold uppercase text-gray-400">Total Pembayaran</p>
                        <p className="text-4xl font-black text-blue-800">{formatCurrency(totalAmount)}</p>
                        <p className="text-[9px] font-bold uppercase text-gray-400">({commissions.length} sekolah terdaftar)</p>
                    </div>
                    <p className="text-[10px] text-center text-gray-500 italic">Pastikan dana telah ditransfer ke reseller. Setelah dikonfirmasi, kuitansi akan dibuat dan status komisi akan diperbarui menjadi 'LUNAS'.</p>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end gap-2">
                    <button onClick={onCancel} className="gov-btn gov-btn-secondary text-[10px]">Batal</button>
                    <button onClick={() => onConfirm(reseller, commissions)} className="gov-btn bg-blue-600 text-white hover:bg-blue-700 text-[10px]">
                        Ya, Konfirmasi & Cetak
                    </button>
                </div>
            </div>
        </div>
    );
};

const ConfirmPaymentModal: React.FC<{ onConfirm: () => void, onCancel: () => void }> = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"><div className="bg-white rounded-sm shadow-2xl w-full max-w-sm"><div className="p-6 flex items-start gap-4 border-b border-amber-100 bg-amber-50"><AlertTriangle size={24} className="text-amber-600" /><div><h3 className="text-sm font-black uppercase">Konfirmasi Pelunasan</h3><p className="text-xs text-gray-500 mt-1">Anda akan menandai invoice ini LUNAS dan menghasilkan Kuitansi. Aksi ini tidak dapat dibatalkan.</p></div></div><div className="p-4 bg-gray-50 flex justify-end gap-2"><button onClick={onCancel} className="px-4 py-2">Batal</button><button onClick={onConfirm} className="px-6 py-2 text-white rounded-sm bg-amber-600">YA</button></div></div></div>
);

export default BillingManagement;
