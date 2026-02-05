
import { School, Invoice, Reseller } from '../types.ts';
import { terbilang, formatRupiah, formatDate } from './pdf.ts';

const PDF_CSS = `
    @page {
        size: A4 portrait;
        margin: 15mm;
    }

    body {
        font-family: Arial, sans-serif;
        font-size: 10pt;
        color: #000;
        line-height: 1.5;
        background-color: #fff;
    }

    /* Header */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8mm;
    }
    .header-left {
        display: flex;
        align-items: center;
    }
    .logo {
        width: 15mm;
        height: 15mm;
        margin-right: 4mm;
    }
    .brand h1 {
        font-size: 18pt;
        font-weight: bold;
        margin: 0;
        letter-spacing: 1px;
    }
    .brand h2 {
        font-size: 8pt;
        color: #555;
        margin: 0;
    }
    .header-right table {
        font-size: 9pt;
        border-collapse: collapse;
    }
    .header-right table td {
        padding: 1.5px 0;
        vertical-align: top;
    }
    .header-right table td:first-child {
        width: 30mm;
        text-align: right;
        padding-right: 2mm;
        color: #333;
    }
    .status-unpaid {
        background-color: #ffe8e8;
        color: #c00;
        padding: 1mm 2mm;
        border-radius: 3px;
        font-size: 8pt;
    }
    .status-paid {
        background-color: #e8f5e9;
        color: #006400;
        padding: 1mm 2mm;
        border-radius: 3px;
        font-size: 8pt;
    }
    .separator {
        border-bottom: 1.5px solid #000;
    }
    .separator-bold {
        border-bottom: 2px solid #000;
        padding-top: 5mm;
    }


    /* Client Info */
    .client-info {
        margin: 8mm 0;
    }
    .client-info h3 {
        font-size: 8pt;
        color: #555;
        margin: 0 0 1mm 0;
        text-transform: uppercase;
    }
    .client-info p {
        font-size: 10pt;
        margin: 0;
        line-height: 1.6;
    }

    /* Items Table */
    .items-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 8mm;
    }
    .items-table th, .items-table td {
        border-bottom: 1px solid #ddd;
        padding: 3mm;
        text-align: left;
    }
    .items-table th {
        background-color: #f5f5f5;
        font-size: 8pt;
        text-transform: uppercase;
        font-weight: bold;
        border-bottom: 2px solid #000;
        border-top: 2px solid #000;
    }
    .items-table .qty, .items-table .price, .items-table .total {
        text-align: right;
        width: 15%;
    }
    .items-table .period {
        font-size: 8pt;
        color: #555;
        margin-top: 1mm;
    }
    .items-table tbody tr:last-child td {
        border-bottom: 2px solid #000;
    }

    /* Summary */
    .summary {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 4mm;
    }
    .summary-table {
        width: 50%;
        border-collapse: collapse;
        font-size: 10pt;
    }
    .summary-table td {
        padding: 2mm;
    }
    .summary-table td.total {
        text-align: right;
        font-weight: bold;
    }
    .summary-table tr.grand-total td {
        border-top: 2px solid #000;
        border-bottom: 2px solid #000;
        font-size: 12pt;
        background-color: #f5f5f5;
    }

    /* Terbilang */
    .terbilang {
        margin-bottom: 8mm;
        font-size: 10pt;
    }
    .terbilang em {
        text-transform: capitalize;
    }

    /* Payment Info */
    .payment-info {
        margin-top: 10mm;
        padding: 5mm;
        border: 1px solid #ddd;
        background-color: #f9f9f9;
    }
    .payment-info h3 {
        margin: 0 0 3mm 0;
        font-size: 10pt;
        font-weight: bold;
    }
    .payment-table {
        font-size: 9pt;
    }
    .payment-table td {
        padding: 1px 0;
    }
    .payment-table td:first-child {
        width: 100px;
        color: #333;
    }
    .payment-note {
        margin-top: 4mm;
        font-size: 8pt;
        color: #555;
    }

    /* Footer */
    .footer {
        position: absolute;
        bottom: 10mm;
        left: 15mm;
        right: 15mm;
        text-align: center;
        font-size: 8pt;
        color: #888;
        border-top: 1px solid #eee;
        padding-top: 2mm;
    }

    /* Kuitansi Specific */
    .receipt-body {
        margin: 10mm 0;
    }
    .receipt-details {
        width: 100%;
        border-collapse: collapse;
        font-size: 11pt;
    }
    .receipt-details td {
        padding: 4mm 2mm;
        vertical-align: top;
    }
    .receipt-details .label {
        width: 30%;
        font-weight: bold;
    }
    .receipt-details .value {
        width: 70%;
    }
    .amount-box {
        background-color: #f5f5f5;
        border: 1px solid #ccc;
        padding: 2mm 4mm;
        font-size: 14pt;
        border-radius: 4px;
    }
    .terbilang-receipt {
        font-style: italic;
        font-weight: bold;
    }
    .validation-section {
        position: absolute;
        bottom: 15mm;
        left: 15mm;
        right: 15mm;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        border-top: 1.5px solid #000;
        padding-top: 5mm;
    }
    .validation-text {
        width: 70%;
        font-size: 8pt;
    }
    .validation-text p {
        margin: 0 0 5mm 0;
    }
    .date-location {
        font-size: 9pt;
        font-style: normal;
    }
    .issued-by {
        margin-top: 15mm;
        line-height: 1.4;
        font-size: 9pt;
    }
    .validation-qr {
        width: 25%;
        text-align: center;
    }
    .validation-qr img {
        width: 30mm;
        height: 30mm;
        border: 1px solid #ccc;
    }
    .validation-qr p {
        margin: 1mm 0 0 0;
        font-size: 7pt;
        color: #555;
    }
`;

const INVOICE_HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Invoice {{invoice.invoice_id_str}}</title>
    <style>${PDF_CSS}</style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            <img src="https://i.imgur.com/VDNLrbw.png" alt="Logo Emes CBT Pro" class="logo">
            <div class="brand">
                <h1>INVOICE</h1>
                <h2>SaaS Computer Based Test System</h2>
            </div>
        </div>
        <div class="header-right">
            <table>
                <tr><td>Invoice ID</td><td>: <strong>{{invoice.invoice_id_str}}</strong></td></tr>
                <tr><td>Tanggal Invoice</td><td>: {{invoice_date}}</td></tr>
                <tr><td>Jatuh Tempo</td><td>: {{due_date}}</td></tr>
                <tr><td>Status</td><td>: <strong class="status-unpaid">MENUNGGU PEMBAYARAN</strong></td></tr>
            </table>
        </div>
    </div>
    <div class="separator"></div>
    <div class="client-info">
        <h3>Ditagihkan Kepada:</h3>
        <p>
            <strong>{{recipient.name}}</strong><br>
            {{recipient.details}}
        </p>
    </div>
    <table class="items-table">
        <thead>
            <tr>
                <th>Deskripsi</th>
                <th class="qty">Qty</th>
                <th class="price">Harga Satuan</th>
                <th class="total">Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <strong>{{invoice.item_description}}</strong>
                    <div class="period">Periode Aktif: {{period}}</div>
                </td>
                <td class="qty">1</td>
                <td class="price">{{price_formatted}}</td>
                <td class="total">{{price_formatted}}</td>
            </tr>
        </tbody>
    </table>
    <div class="summary">
        <table class="summary-table">
            <tr><td>Subtotal</td><td class="total">{{price_formatted}}</td></tr>
            <tr><td>PPN (11%)</td><td class="total">{{ppn_formatted}}</td></tr>
            <tr class="grand-total"><td>TOTAL TAGIHAN</td><td class="total">{{grand_total_formatted}}</td></tr>
        </table>
    </div>
    <div class="terbilang"><strong>Terbilang:</strong> <em>{{terbilang_str}} Rupiah</em></div>
    <div class="payment-info">
        <h3>Informasi Pembayaran</h3>
        <table class="payment-table">
            <tr><td>Metode</td><td>: Transfer Bank</td></tr>
            <tr><td>Bank</td><td>: Bank Central Asia (BCA)</td></tr>
            <tr><td>No. Rekening</td><td>: <strong>0123456789</strong></td></tr>
            <tr><td>Atas Nama</td><td>: <strong>CV. EMES EDUTECH INDONESIA</strong></td></tr>
        </table>
        <p class="payment-note">Mohon lakukan pembayaran sesuai dengan TOTAL TAGIHAN dan konfirmasi melalui portal admin.</p>
    </div>
    <div class="footer">
        <p>Invoice ini diterbitkan secara otomatis oleh sistem Emes CBT Pro dan sah tanpa tanda tangan.</p>
        <p>Emes EduTech &copy; {{current_year}}</p>
    </div>
</body>
</html>
`;

const KUITANSI_HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Kuitansi {{receipt_number}}</title>
    <style>${PDF_CSS}</style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            <img src="https://i.imgur.com/VDNLrbw.png" alt="Logo Emes CBT Pro" class="logo">
            <div class="brand"><h1>KUITANSI PEMBAYARAN</h1></div>
        </div>
        <div class="header-right">
            <table>
                <tr><td>No. Kuitansi</td><td>: <strong>{{receipt_number}}</strong></td></tr>
                <tr><td>Ref. No</td><td>: {{invoice.invoice_id_str}}</td></tr>
                <tr><td>Tanggal Bayar</td><td>: {{payment_date}}</td></tr>
                <tr><td>Status</td><td>: <strong class="status-paid">LUNAS</strong></td></tr>
            </table>
        </div>
    </div>
    <div class="separator-bold"></div>
    <div class="receipt-body">
        <table class="receipt-details">
            {{recipient_info_block}}
            <tr><td class="label">Jumlah</td><td class="value">: <strong class="amount-box">{{grand_total_formatted}}</strong></td></tr>
            <tr><td class="label">Terbilang</td><td class="value terbilang-receipt">: <em>{{terbilang_str}} Rupiah</em></td></tr>
            <tr><td class="label">Untuk Pembayaran</td><td class="value">: {{invoice.item_description}}</td></tr>
            <tr><td class="label">Periode Layanan</td><td class="value">: {{period}}</td></tr>
            <tr><td class="label">Metode Bayar</td><td class="value">: Transfer Bank</td></tr>
        </table>
    </div>
    <div class="validation-section">
        <div class="validation-text">
            <p>Dokumen ini diterbitkan secara otomatis oleh sistem Emes CBT Pro dan sah tanpa tanda tangan basah. Verifikasi keaslian dokumen dapat dilakukan dengan memindai QR Code di samping.</p>
            <p class="date-location">Pontianak, {{payment_date}}</p>
            <div class="issued-by"><strong>Emes EduTech</strong><br>Billing Department</div>
        </div>
        <div class="validation-qr">
            <img src="{{qr_code_url}}" alt="QR Code Verifikasi">
            <p>Scan untuk Verifikasi</p>
        </div>
    </div>
</body>
</html>
`;

export function generateInvoiceHTML({ invoice }: { invoice: Invoice }): string {
    const subtotal = invoice.amount;
    const ppn = subtotal * 0.11;
    const grandTotal = subtotal + ppn;

    let html = INVOICE_HTML_TEMPLATE;
    html = html.replace(/{{recipient.name}}/g, invoice.recipient_name)
               .replace(/{{recipient.details}}/g, invoice.recipient_details)
               .replace(/{{invoice.invoice_id_str}}/g, invoice.invoice_id_str)
               .replace(/{{invoice.item_description}}/g, invoice.item_description)
               .replace(/{{invoice_date}}/g, formatDate(invoice.created_at))
               .replace(/{{due_date}}/g, formatDate(invoice.due_date))
               .replace(/{{period}}/g, `${formatDate(invoice.period_start)} – ${formatDate(invoice.period_end)}`)
               .replace(/{{price_formatted}}/g, formatRupiah(subtotal))
               .replace(/{{ppn_formatted}}/g, formatRupiah(ppn))
               .replace(/{{grand_total_formatted}}/g, formatRupiah(grandTotal))
               .replace(/{{terbilang_str}}/g, terbilang(grandTotal))
               .replace(/{{current_year}}/g, new Date().getFullYear().toString());
    
    return html;
}

export function generateKuitansiHTML({ invoice }: { invoice: Invoice }): string {
    const isResellerFee = invoice.recipient_type === 'reseller';
    const grandTotal = isResellerFee ? invoice.amount : (invoice.amount * 1.11);
    const receipt_number = `KWT-${invoice.invoice_id_str.split('-').slice(1).join('-')}`;
    
    const verificationPayload = {
        iss: "EmesCBT",
        sub: isResellerFee ? "Bukti Bayar Fee" : "Kuitansi",
        kwt: receipt_number,
        inv: invoice.invoice_id_str,
        amt: grandTotal,
        pay: invoice.payment_date,
        to: invoice.recipient_name,
    };
    const verificationToken = btoa(JSON.stringify(verificationPayload));
    const qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://verifikasi.emescbt.com/cek?token=${verificationToken}`;

    let html = KUITANSI_HTML_TEMPLATE;
    
    let recipientInfoBlock = '';
    if (isResellerFee) {
        recipientInfoBlock = `
            <tr><td class="label">Telah Diterima dari</td><td class="value">: <strong>CV. EMES EDUTECH INDONESIA</strong></td></tr>
            <tr><td class="label">Dibayarkan Kepada</td><td class="value">: <strong>${invoice.recipient_name} (${invoice.recipient_details})</strong></td></tr>
        `;
    } else { // school
        recipientInfoBlock = `
            <tr><td class="label">Telah Diterima Dari</td><td class="value">: <strong>${invoice.recipient_name} (${invoice.recipient_details})</strong></td></tr>
        `;
    }

    html = html.replace('{{recipient_info_block}}', recipientInfoBlock)
               .replace(/{{invoice.invoice_id_str}}/g, invoice.invoice_id_str)
               .replace(/{{invoice.item_description}}/g, invoice.item_description)
               .replace(/{{receipt_number}}/g, receipt_number)
               .replace(/{{payment_date}}/g, formatDate(invoice.payment_date!))
               .replace(/{{period}}/g, `${formatDate(invoice.period_start)} – ${formatDate(invoice.period_end)}`)
               .replace(/{{grand_total_formatted}}/g, formatRupiah(grandTotal))
               .replace(/{{terbilang_str}}/g, terbilang(grandTotal))
               .replace(/{{qr_code_url}}/g, qr_code_url);

    return html;
}
