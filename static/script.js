const gunler = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
const aylar = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

let dersler = [];
let aktifBlok = 'tumu';

function saatGuncelle() {
    const simdi = new Date();
    document.getElementById('gun').textContent = gunler[simdi.getDay()];
    document.getElementById('tarih').textContent = `${simdi.getDate()} ${aylar[simdi.getMonth()]} ${simdi.getFullYear()}`;
    document.getElementById('saat').textContent = `${String(simdi.getHours()).padStart(2,'0')}:${String(simdi.getMinutes()).padStart(2,'0')}:${String(simdi.getSeconds()).padStart(2,'0')}`;
}

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

async function dersleriyukle() {
    const response = await fetch('/dersler');
    dersler = await response.json();
    tabloGuncelle();
}

saatGuncelle();
setInterval(saatGuncelle, 1000);
setInterval(tabloGuncelle, 60000);
dersleriyukle();