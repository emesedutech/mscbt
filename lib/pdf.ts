
export function terbilang(angka: number): string {
    const bilangan = [
        '', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'
    ];

    if (angka < 12) {
        return bilangan[angka];
    } else if (angka < 20) {
        return terbilang(angka - 10) + ' belas';
    } else if (angka < 100) {
        return terbilang(Math.floor(angka / 10)) + ' puluh ' + terbilang(angka % 10);
    } else if (angka < 200) {
        return 'seratus ' + terbilang(angka - 100);
    } else if (angka < 1000) {
        return terbilang(Math.floor(angka / 100)) + ' ratus ' + terbilang(angka % 100);
    } else if (angka < 2000) {
        return 'seribu ' + terbilang(angka - 1000);
    } else if (angka < 1000000) {
        return terbilang(Math.floor(angka / 1000)) + ' ribu ' + terbilang(angka % 1000);
    } else if (angka < 1000000000) {
        return terbilang(Math.floor(angka / 1000000)) + ' juta ' + terbilang(angka % 1000000);
    } else if (angka < 1000000000000) {
        return terbilang(Math.floor(angka / 1000000000)) + ' milyar ' + terbilang(angka % 1000000000);
    }

    return '';
}


export const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
};

export const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

export function generatePdfFromHtml(htmlContent: string) {
    const win = window.open('', '', 'height=800,width=800');
    if (win) {
        win.document.write(htmlContent);
        win.document.close();
        win.focus();
        setTimeout(() => {
            win.print();
        }, 500);
    }
}
