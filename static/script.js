const gunler = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
const aylar = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

let dersler = [];
let aktifBlok = 'tumu';

function tabloMesajiGoster(mesaj) {
    const tbody = document.getElementById('tablo');
    tbody.innerHTML = `
        <tr>
            <td colspan="3" class="saat-bilgi">${mesaj}</td>
        </tr>
    `;
}

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
            <tr onclick="katPlaniGoster('${sinif}')">
                <td><span class="${sonuc.bos ? 'bos' : 'dolu'}">${sonuc.bos ? 'Boş' : 'Dolu'}</span></td>
                <td class="sinif-adi">${sinif}</td>
                <td class="saat-bilgi">${sonuc.saatler}</td>
            </tr>
        `;
    }).join('');
}

function filtrele(blok, btn) {
    aktifBlok = blok;
    document.querySelectorAll('.filtreler button').forEach(b => b.classList.remove('aktif'));
    btn.classList.add('aktif');
    tabloGuncelle();
}

async function dersleriyukle() {
    try {
        const response = await fetch('/dersler');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Ders verileri alinamadi.');
        }

        dersler = Array.isArray(data) ? data : [];
        tabloGuncelle();
    } catch (error) {
        console.error('Dersler yuklenemedi:', error);
        dersler = [];
        tabloMesajiGoster('Ders verileri su anda yuklenemiyor.');
    }
}

saatGuncelle();
setInterval(saatGuncelle, 1000);
setInterval(tabloGuncelle, 60000);
dersleriyukle();
const katPlanlari = {
    'B-501': 'katplanlar/b_5.jpeg',
    'B-502': 'katplanlar/b_5.jpeg',
    'B-511': 'katplanlar/b_5.jpeg',
    'B-512': 'katplanlar/b_5.jpeg',
};

function katPlaniGoster(sinif) {
    const plan = katPlanlari[sinif];
    const mobil = document.documentElement.clientWidth <= 900;

    document.querySelectorAll('tbody tr').forEach(tr => tr.classList.remove('secili'));
    event.currentTarget.classList.add('secili');

    const icerik = plan
        ? `<h3>${sinif} — Kat Planı</h3><img src="/static/${plan}" alt="${sinif} kat planı">`
        : `<p style="color:#aaa;text-align:center">Bu kat için henüz plan eklenmedi</p>`;

    if (mobil) {
        document.getElementById('popup-icerik').innerHTML = icerik;
        document.getElementById('popup').classList.add('aktif');
    } else {
        document.getElementById('sag').innerHTML = `<div class="kat-plani">${icerik}</div>`;
    }
}

function popupKapat() {
    document.getElementById('popup').classList.remove('aktif');
}
function mobilAyarla() {
    const sag = document.getElementById('sag');
    const genislik = Math.min(window.screen.width, window.screen.height);
    if (genislik <= 500) {
        sag.style.setProperty('display', 'none', 'important');
    } else {
        sag.style.setProperty('display', 'flex', 'important');
    }
}
