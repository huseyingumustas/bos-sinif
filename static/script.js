const dersler = [
    { blok: 'F', sinif: 'F-101', gun: 'Cuma', baslangic: '23:00', bitis: '23:59' },
    { blok: 'F', sinif: 'F-101', gun: 'Cuma', baslangic: '09:00', bitis: '11:00' },
    { blok: 'F', sinif: 'F-101', gun: 'Cuma', baslangic: '13:00', bitis: '15:00' },
    { blok: 'F', sinif: 'F-204', gun: 'Cuma', baslangic: '10:00', bitis: '12:00' },
    { blok: 'F', sinif: 'F-301', gun: 'Cuma', baslangic: '09:00', bitis: '17:00' },
    { blok: 'B', sinif: 'B-102', gun: 'Salı', baslangic: '11:00', bitis: '13:00' },
    { blok: 'B', sinif: 'B-205', gun: 'Salı', baslangic: '09:00', bitis: '11:00' },
    { blok: 'B', sinif: 'B-310', gun: 'Salı', baslangic: '14:00', bitis: '16:00' },
    { blok: 'B', sinif: 'B-401', gun: 'Salı', baslangic: '10:00', bitis: '12:00' },
];
const gunler = ['Pazar','Pazartesi','Cuma','Çarşamba','Perşembe','Cuma','Cumartesi'];
const aylar = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function saatGuncelle() {
    const simdi = new Date();
    document.getElementById('gun').textContent = gunler[simdi.getDay()];
    document.getElementById('tarih').textContent = `${simdi.getDate()} ${aylar[simdi.getMonth()]} ${simdi.getFullYear()}`;
    document.getElementById('saat').textContent = `${String(simdi.getHours()).padStart(2,'0')}:${String(simdi.getMinutes()).padStart(2,'0')}:${String(simdi.getSeconds()).padStart(2,'0')}`;
}

saatGuncelle();
setInterval(saatGuncelle, 1000);

let aktifBlok = 'tumu';

function bosluklariHesapla(sinifAdi) {
    const simdi = new Date();
    const gunAdi = gunler[simdi.getDay()];
    const simdikiDakika = simdi.getHours() * 60 + simdi.getMinutes();

    const bugunDersleri = dersler
        .filter(d => d.sinif === sinifAdi && d.gun === gunAdi)
        .sort((a, b) => {
            const basA = parseInt(a.baslangic.split(':')[0]) * 60 + parseInt(a.baslangic.split(':')[1]);
            const basB = parseInt(b.baslangic.split(':')[0]) * 60 + parseInt(b.baslangic.split(':')[1]);
            return basA - basB;
        });

    if (bugunDersleri.length === 0) return { bos: true, saatler: 'Bugün ders yok' };

    const doluDers = bugunDersleri.find(d => {
        const bas = parseInt(d.baslangic.split(':')[0]) * 60 + parseInt(d.baslangic.split(':')[1]);
        const bit = parseInt(d.bitis.split(':')[0]) * 60 + parseInt(d.bitis.split(':')[1]);
        return simdikiDakika >= bas && simdikiDakika < bit;
    });

    if (doluDers) return { bos: false, saatler: `${doluDers.bitis}'de boşalıyor` };

    const sonrakiDers = bugunDersleri.find(d => {
        const bas = parseInt(d.baslangic.split(':')[0]) * 60 + parseInt(d.baslangic.split(':')[1]);
        return bas > simdikiDakika;
    });

    const saatler = sonrakiDers ? `${sonrakiDers.baslangic}'de dolacak` : 'Bugün artık ders yok';
    return { bos: true, saatler };
}

function tabloGuncelle() {
    const siniflar = [...new Set(dersler.map(d => d.sinif))];
    const tbody = document.getElementById('tablo');

    const filtrelenmis = siniflar.filter(s => {
        if (aktifBlok === 'tumu') return true;
        return s.startsWith(aktifBlok);
    });

    tbody.innerHTML = filtrelenmis.map(sinif => {
        const sonuc = bosluklariHesapla(sinif);
        return `
            <tr>
                <td>${sonuc.bos ? '🟢 Boş' : '🔴 Dolu'}</td>
                <td>${sinif}</td>
                <td>${sonuc.saatler}</td>
            </tr>
        `;
    }).join('');
}

function filtrele(blok) {
    aktifBlok = blok;
    tabloGuncelle();
}

tabloGuncelle();
setInterval(tabloGuncelle, 60000);