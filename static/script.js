const gunler = ['Pazar', 'Pazartesi', 'SalÄ±', 'Ã‡arÅŸamba', 'PerÅŸembe', 'Cuma', 'Cumartesi'];
const gunlerDisplay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const aylarDisplay = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

let dersler = [];
let aktifBlok = 'tumu';
let aktifDurum = 'tumu';
let seciliSinif = '';

function timeCellHtml(sonuc) {
    if (sonuc.timeTag && sonuc.timeValue) {
        return `
            <div class="time-cell">
                <span class="time-tag">${sonuc.timeTag}</span>
                <span class="time-value">${sonuc.timeValue}</span>
            </div>
        `;
    }

    return `
        <div class="time-cell">
            <span class="time-note">${sonuc.saatler}</span>
        </div>
    `;
}

function tabloMesajiGoster(mesaj) {
    const tbody = document.getElementById('tablo');
    tbody.innerHTML = `
        <tr>
            <td colspan="3" class="saat-bilgi tablo-mesaji">${mesaj}</td>
        </tr>
    `;
}

function ozetGuncelle(gosterilenSiniflar) {
    const ozet = document.getElementById('filtre-ozet');
    const availableCount = gosterilenSiniflar.filter((item) => item.durumKey === 'bos').length;
    const occupiedCount = gosterilenSiniflar.filter((item) => item.durumKey === 'dolu').length;
    ozet.textContent = `${gosterilenSiniflar.length} classrooms shown · ${availableCount} available · ${occupiedCount} occupied`;
}

function saatGuncelle() {
    const simdi = new Date();
    document.getElementById('gun').textContent = gunlerDisplay[simdi.getDay()];
    document.getElementById('tarih').textContent = `${simdi.getDate()} ${aylarDisplay[simdi.getMonth()]} ${simdi.getFullYear()}`;
    document.getElementById('saat').textContent = `${String(simdi.getHours()).padStart(2, '0')}:${String(simdi.getMinutes()).padStart(2, '0')}:${String(simdi.getSeconds()).padStart(2, '0')}`;
}

function bosluklariHesapla(sinifAdi) {
    const simdi = new Date();
    const gunAdi = gunler[simdi.getDay()];
    const simdikiDakika = simdi.getHours() * 60 + simdi.getMinutes();

    const bugunDersleri = dersler
        .filter((d) => d.sinif === sinifAdi && d.gun === gunAdi)
        .sort((a, b) => {
            const basA = parseInt(a.baslangic.split(':')[0], 10) * 60 + parseInt(a.baslangic.split(':')[1], 10);
            const basB = parseInt(b.baslangic.split(':')[0], 10) * 60 + parseInt(b.baslangic.split(':')[1], 10);
            return basA - basB;
        });

    if (bugunDersleri.length === 0) {
        return { bos: true, durumKey: 'bos', durumMetni: 'Available', saatler: 'No classes today', timeTag: null, timeValue: null };
    }

    const doluDers = bugunDersleri.find((d) => {
        const bas = parseInt(d.baslangic.split(':')[0], 10) * 60 + parseInt(d.baslangic.split(':')[1], 10);
        const bit = parseInt(d.bitis.split(':')[0], 10) * 60 + parseInt(d.bitis.split(':')[1], 10);
        return simdikiDakika >= bas && simdikiDakika < bit;
    });

    if (doluDers) {
        return { bos: false, durumKey: 'dolu', durumMetni: 'Occupied', saatler: `Until ${doluDers.bitis}`, timeTag: 'Until', timeValue: doluDers.bitis };
    }

    const sonrakiDers = bugunDersleri.find((d) => {
        const bas = parseInt(d.baslangic.split(':')[0], 10) * 60 + parseInt(d.baslangic.split(':')[1], 10);
        return bas > simdikiDakika;
    });

    if (sonrakiDers) {
        return { bos: true, durumKey: 'bos', durumMetni: 'Available', saatler: `Starts at ${sonrakiDers.baslangic}`, timeTag: 'Starts', timeValue: sonrakiDers.baslangic };
    }

    return { bos: true, durumKey: 'bos', durumMetni: 'Available', saatler: 'No more classes today', timeTag: null, timeValue: null };
}

function selectedClassInfo(sinif) {
    const parts = sinif.split('-');
    const block = parts[0] || '';
    const roomCode = parts[1] || '';
    const floor = roomCode ? roomCode.charAt(0) : '';
    return {
        classroomLine: `Selected classroom: ${sinif}`,
        floorLine: `Block ${block} · ${floor}th Floor`,
    };
}

function filtrelenmisSiniflariGetir() {
    const siniflar = [...new Set(dersler.map((d) => d.sinif))];

    return siniflar
        .map((sinif) => {
            const sonuc = bosluklariHesapla(sinif);
            return { sinif, ...sonuc };
        })
        .filter((item) => {
            const blokUygun = aktifBlok === 'tumu' ? true : item.sinif.startsWith(aktifBlok);
            const durumUygun = aktifDurum === 'tumu' ? true : item.durumKey === aktifDurum;
            return blokUygun && durumUygun;
        });
}

function tabloGuncelle() {
    const tbody = document.getElementById('tablo');
    const filtrelenmis = filtrelenmisSiniflariGetir();

    ozetGuncelle(filtrelenmis);

    if (!filtrelenmis.length) {
        if (seciliSinif) {
            document.querySelectorAll('#tablo tr').forEach((tr) => tr.classList.remove('secili'));
        }
        tabloMesajiGoster('No classrooms found for the selected filters.');
        return;
    }

    tbody.innerHTML = filtrelenmis.map((item) => {
        const seciliClass = item.sinif === seciliSinif ? ' secili' : '';
        return `
            <tr class="${seciliClass.trim()}" onclick="katPlaniGoster('${item.sinif}', event)">
                <td><span class="${item.durumKey}">${item.durumMetni}</span></td>
                <td class="sinif-adi">${item.sinif}</td>
                <td class="saat-bilgi">${timeCellHtml(item)}</td>
            </tr>
        `;
    }).join('');
}

function filtreButonlariniGuncelle(groupName, btn) {
    document.querySelectorAll(`[data-filter-group="${groupName}"] button`).forEach((button) => button.classList.remove('aktif'));
    btn.classList.add('aktif');
}

function filtreleBlok(blok, btn) {
    aktifBlok = blok;
    filtreButonlariniGuncelle('block', btn);
    tabloGuncelle();
}

function filtreleDurum(durum, btn) {
    aktifDurum = durum;
    filtreButonlariniGuncelle('status', btn);
    tabloGuncelle();
}

async function dersleriyukle() {
    try {
        const response = await fetch('/dersler');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Lesson data could not be loaded.');
        }

        dersler = Array.isArray(data) ? data : [];
        tabloGuncelle();
    } catch (error) {
        console.error('Lessons could not be loaded:', error);
        dersler = [];
        ozetGuncelle([]);
        tabloMesajiGoster('Lesson data is currently unavailable.');
    }
}

const katPlanlari = {
    'B-501': 'katplanlar/b_5.jpeg',
    'B-502': 'katplanlar/b_5.jpeg',
    'B-511': 'katplanlar/b_5.jpeg',
    'B-512': 'katplanlar/b_5.jpeg',
};

function katPlaniGoster(sinif, event) {
    const plan = katPlanlari[sinif];
    const mobil = document.documentElement.clientWidth <= 900;
    seciliSinif = sinif;

    document.querySelectorAll('#tablo tr').forEach((tr) => tr.classList.remove('secili'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('secili');
    }

    const info = selectedClassInfo(sinif);
    const detailBlock = `
        <div class="kat-plani-bilgi">
            <p><strong>${info.classroomLine}</strong></p>
            <p>${info.floorLine}</p>
        </div>
    `;

    const icerik = plan
        ? `${detailBlock}<h3>${sinif} Floor Plan</h3><img src="/static/${plan}" alt="${sinif} floor plan">`
        : `${detailBlock}<p class="plan-yok">No floor plan has been added for this floor yet.</p>`;

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

saatGuncelle();
setInterval(saatGuncelle, 1000);
setInterval(tabloGuncelle, 60000);
dersleriyukle();
