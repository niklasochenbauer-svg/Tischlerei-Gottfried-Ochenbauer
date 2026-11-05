// ═══════════════════════════════════════════════════════════
// TISCHLEREI OCHENBAUER — werkplan.js (Startseite)
// Gliedermaßstab, Menü, Bemaßung, Fragen, Werkstücke, Lightbox, Formular
// ═══════════════════════════════════════════════════════════

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const isMobile = window.matchMedia('(max-width: 859px)');
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));


// ── Weiches Scrollen (Lenis, nur Maus/Touchpad, nur ohne reduced motion) ──
let lenis = null;
function startLenis() {
    if (lenis || reduceMotion.matches || !window.Lenis || !window.matchMedia('(pointer: fine)').matches) return;
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9, smoothWheel: true });
    document.documentElement.classList.add('lenis');
    const raf = time => { lenis?.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
}
window.addEventListener('load', () => {
    if ('requestIdleCallback' in window) requestIdleCallback(startLenis, { timeout: 2000 });
    else setTimeout(startLenis, 800);
}, { once: true });

function lockScroll(locked) {
    document.body.style.overflow = locked ? 'hidden' : '';
    if (locked) lenis?.stop(); else lenis?.start();
}

// Ankerlinks: mit Lenis ruhig hinfahren, sonst übernimmt CSS (scroll-behavior)
document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || !lenis) return;
    const id = link.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: id === 'top' ? -100 : -24 });
    history.pushState(null, '', `#${id}`);
});


// ── Gliedermaßstab: Fortschritt beim Scrollen ──────────────
const rulerFill = document.getElementById('ruler-fill');
let rulerQueued = false;
function updateRuler() {
    rulerQueued = false;
    const el = document.documentElement;
    const max = Math.max(1, el.scrollHeight - el.clientHeight);
    rulerFill.style.transform = `scaleX(${Math.min(1, window.scrollY / max)})`;
}
if (rulerFill) {
    window.addEventListener('scroll', () => {
        if (!rulerQueued) { rulerQueued = true; requestAnimationFrame(updateRuler); }
    }, { passive: true });
    window.addEventListener('resize', updateRuler, { passive: true });
    updateRuler();
}


// ── Mobiles Menü ───────────────────────────────────────────
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobilmenue');

function setMenu(open) {
    if (!menuToggle || !mobileMenu) return;
    mobileMenu.hidden = !open;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.textContent = open ? 'Schließen' : 'Menü';
    lockScroll(open);
}
menuToggle?.addEventListener('click', () => setMenu(mobileMenu.hidden));
mobileMenu?.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileMenu && !mobileMenu.hidden) { setMenu(false); menuToggle.focus(); }
});
isMobile.addEventListener('change', () => { if (!isMobile.matches && mobileMenu && !mobileMenu.hidden) setMenu(false); });


// ── Bemaßung zeichnet sich beim Erscheinen ─────────────────
// Ohne JS oder mit reduced motion sind die Linien einfach da.
// Geprüft wird die Position beim Scrollen: eine weggeclippte Linie meldet der
// IntersectionObserver nie als sichtbar, getBoundingClientRect kennt sie trotzdem.
const pendingDraws = new Set();
let drawQueued = false;

function revealDraws() {
    drawQueued = false;
    const limit = window.innerHeight * 0.85;
    pendingDraws.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < limit && r.bottom > 0) { el.classList.remove('is-pending'); pendingDraws.delete(el); }
    });
    if (!pendingDraws.size) window.removeEventListener('scroll', queueDraws);
}
function queueDraws() {
    if (!drawQueued) { drawQueued = true; requestAnimationFrame(revealDraws); }
}

if (!reduceMotion.matches) {
    document.querySelectorAll('[data-draw]').forEach(el => {
        // Was beim Laden schon im Bild ist, nicht erst verstecken
        if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
        el.classList.add('is-pending');
        pendingDraws.add(el);
    });
    if (pendingDraws.size) window.addEventListener('scroll', queueDraws, { passive: true });
}


// ── Häufige Fragen: immer eine offen ──────────────────────
const faqButtons = [...document.querySelectorAll('.faq-item button')];
faqButtons.forEach(btn => btn.addEventListener('click', () => {
    const opening = btn.getAttribute('aria-expanded') !== 'true';
    faqButtons.forEach(other => {
        const open = other === btn && opening;
        other.setAttribute('aria-expanded', String(open));
        other.querySelector('.faq-sign').textContent = open ? '−' : '+';
        document.getElementById(other.getAttribute('aria-controls')).hidden = !open;
    });
}));


// ═══════════════════════════════════════════════════════════
// WERKSTÜCKE — Kategorien & Fotos aus Supabase (siehe galerie.js)
// Die ersten sechs Kategorien werden Werkplan-Blätter, der Rest eine Liste.
// ═══════════════════════════════════════════════════════════
const sheetsEl     = document.getElementById('sheets');
const moreWorks    = document.getElementById('more-works');
const moreList     = document.getElementById('more-works-list');
const worksStatus  = document.getElementById('works-status');
const GALLERY_CACHE = 'tischlerei-galerie-v1';
const MAX_SHEETS   = 6;

// Zu welcher Leistungsseite eine Kategorie gehört (unbekannte bleiben ohne Eintrag)
const AREA = {
    Stiege: ['Holzstiegen', 'holzstiegen.html'], Kastenstiege: ['Holzstiegen', 'holzstiegen.html'],
    Kueche: ['Küchen', 'kuechen.html'],
    Esstisch: ['Möbel', 'moebel.html'], Wohnzimmer: ['Möbel', 'moebel.html'], Stauraum: ['Möbel', 'moebel.html'],
    Bett: ['Möbel', 'moebel.html'], Spiegel: ['Möbel', 'moebel.html'], Badezimmer: ['Möbel', 'moebel.html']
};

let categories = [];

function readCache() {
    try {
        const data = JSON.parse(localStorage.getItem(GALLERY_CACHE));
        return Array.isArray(data?.cats) && data.cats.length ? data.cats : null;
    } catch { return null; }
}
function writeCache(cats) {
    try { localStorage.setItem(GALLERY_CACHE, JSON.stringify({ t: Date.now(), cats })); } catch {}
}

async function fetchCategories() {
    const manifest = await Galerie.loadCategories();
    const cats = manifest.kategorien.filter(c => c?.ordner && !c.versteckt);
    const results = await Promise.allSettled(cats.map(c => Galerie.loadPhotos(c.ordner)));
    if (results.length && results.every(r => r.status === 'rejected')) throw new Error('Galerie nicht erreichbar');
    return cats.map((c, i) => {
        const photos = results[i].status === 'fulfilled'
            ? results[i].value.map(({ name, url, thumb }) => ({ name, url, thumb }))
            : [];
        const coverIndex = Math.max(0, photos.findIndex(p => p.name === c.titelbild));
        return { ordner: c.ordner, titel: c.titel || c.ordner, photos, coverIndex };
    }).filter(c => c.photos.length);
}

const pad = n => String(n).padStart(2, '0');
const fotoCount = n => `${n} ${n === 1 ? 'Foto' : 'Fotos'}`;
const TRIANGLE = '<svg class="mark" width="15" height="14" viewBox="0 0 16 14" aria-hidden="true"><path d="M2.2 12.6 L8.1 1.8 L13.8 12.4 Z"/></svg>';

function coverImage(cat, wide) {
    const cover = cat.photos[cat.coverIndex] || cat.photos[0];
    const img = new Image();
    img.alt = `${cat.titel} – Tischlerarbeit der Tischlerei Ochenbauer, Pinggau`;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
    img.addEventListener('error', () => {
        // Optimierung oder Vorschaubild nicht verfügbar? Dann das Originalfoto nehmen
        if (img.src !== cover.url) { img.removeAttribute('srcset'); img.src = cover.url; }
    }, { once: true });
    if (Galerie.OPTIMIZE) {
        img.sizes = wide ? '(max-width: 859px) 92vw, 50vw' : '(max-width: 859px) 92vw, 30vw';
        img.srcset = Galerie.srcset(cover.url, [384, 640, 960, 1280]);
        img.src = Galerie.sized(cover.url, 960);
    } else {
        img.src = cover.url;
    }
    return img;
}

function renderWorks() {
    if (!sheetsEl) return;
    const sheetCats = categories.slice(0, MAX_SHEETS);
    const rest = categories.slice(MAX_SHEETS);
    sheetsEl.innerHTML = '';

    sheetCats.forEach((cat, i) => {
        const no = pad(i + 1);
        const area = AREA[cat.ordner];
        const article = document.createElement('article');
        article.className = 'sheet';
        article.innerHTML = `
            <button type="button" class="sheet-photo" aria-label="Fotos ansehen: Werkstück ${no}, ${escapeHtml(cat.titel)} (${fotoCount(cat.photos.length)})"></button>
            <div class="sheet-head"><span class="sheet-no">${TRIANGLE}Werkstück ${no}</span><h3 class="sheet-title">${escapeHtml(cat.titel)}</h3></div>
            <dl class="parts">
                ${area ? `<div><dt>Bereich</dt><dd><a href="${area[1]}">${area[0]}</a></dd></div>` : ''}
                <div><dt>Fotos</dt><dd>${cat.photos.length}</dd></div>
                <div><dt>Gefertigt</dt><dd>Werkstatt Schaueregg</dd></div>
            </dl>
            <button type="button" class="cta-link">Alle Fotos ansehen</button>
            ${i === 0 ? '<div class="pencil" aria-hidden="true"><svg width="80" height="40" viewBox="0 0 80 40" style="display:block"><path d="M78 30 C 54 34, 26 26, 6 8 M6 8 L 9 18 M6 8 L 16 10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg><p>jedes Stück ein Einzelstück</p></div>' : ''}`;
        const photoBtn = article.querySelector('.sheet-photo');
        photoBtn.appendChild(coverImage(cat, i % 4 === 0 || i % 4 === 2));
        photoBtn.addEventListener('click', () => openLightbox(cat, i + 1, photoBtn));
        const allBtn = article.querySelector('.cta-link');
        allBtn.addEventListener('click', () => openLightbox(cat, i + 1, allBtn));
        sheetsEl.appendChild(article);
    });

    moreList.innerHTML = '';
    rest.forEach((cat, j) => {
        const li = document.createElement('li');
        li.innerHTML = `<button type="button"><span>${escapeHtml(cat.titel)}</span><span>${fotoCount(cat.photos.length)}</span></button>`;
        const btn = li.querySelector('button');
        btn.addEventListener('click', () => openLightbox(cat, MAX_SHEETS + j + 1, btn));
        moreList.appendChild(li);
    });
    moreWorks.hidden = !rest.length;
    sheetsEl.setAttribute('aria-busy', 'false');
}

function showWorksError() {
    worksStatus.innerHTML = '<span>Die Fotos konnten gerade nicht geladen werden.</span><button type="button">Erneut versuchen</button>';
    worksStatus.hidden = false;
    worksStatus.querySelector('button').addEventListener('click', initWorks, { once: true });
    sheetsEl.innerHTML = '';
    sheetsEl.setAttribute('aria-busy', 'false');
}

async function initWorks() {
    // galerie.js legt Galerie mit const an: global sichtbar, aber nicht als window.Galerie
    if (!sheetsEl || typeof Galerie === 'undefined') return;
    worksStatus.hidden = true;
    const cached = readCache();
    if (cached) { categories = cached; renderWorks(); }
    try {
        const fresh = await fetchCategories();
        writeCache(fresh);
        if (JSON.stringify(fresh) !== JSON.stringify(cached)) {
            categories = fresh;
            if (!lightbox?.open) renderWorks();
        }
    } catch (err) {
        console.error(err);
        if (!cached) showWorksError();
    }
}
initWorks();


// ── Lightbox (native <dialog>: Fokus, Esc und Hintergrund-Sperre inklusive) ──
const lightbox = document.getElementById('lightbox');
const lbImage  = document.getElementById('lb-image');
const lbTitle  = document.getElementById('lb-title');
const lbCount  = document.getElementById('lb-count');
let lbCat = null, lbIndex = 0, lbOpener = null;

function lbUrl(photo) {
    return Galerie.OPTIMIZE ? Galerie.sized(photo.url, Math.min(1920, window.innerWidth * (window.devicePixelRatio || 1))) : photo.url;
}

function showPhoto(index) {
    const photos = lbCat.photos;
    lbIndex = (index + photos.length) % photos.length;
    const photo = photos[lbIndex];
    lbImage.src = lbUrl(photo);
    lbImage.alt = `${lbCat.titel} – Foto ${lbIndex + 1} von ${photos.length}`;
    lbCount.textContent = `${lbIndex + 1} / ${photos.length}`;
    // Nachbarn vorladen
    [1, -1].forEach(d => { const p = photos[(lbIndex + d + photos.length) % photos.length]; if (p) new Image().src = lbUrl(p); });
    if (!reduceMotion.matches) lbImage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
}

function openLightbox(cat, no, opener) {
    if (!lightbox || !cat.photos.length) return;
    lbCat = cat; lbOpener = opener;
    lbTitle.innerHTML = `<span>Werkstück ${pad(no)}</span> ${escapeHtml(cat.titel)}`;
    const single = cat.photos.length < 2;
    lightbox.querySelectorAll('[data-lb="prev"], [data-lb="next"]').forEach(b => { b.hidden = single; });
    showPhoto(cat.coverIndex || 0);
    lockScroll(true);
    lightbox.showModal();
}

lightbox?.addEventListener('close', () => {
    lockScroll(false);
    lbImage.src = 'data:,';
    lbOpener?.focus({ preventScroll: true });
});
lightbox?.addEventListener('click', e => {
    const action = e.target.closest('[data-lb]')?.dataset.lb;
    if (action === 'close') lightbox.close();
    else if (action === 'prev') showPhoto(lbIndex - 1);
    else if (action === 'next') showPhoto(lbIndex + 1);
    else if (e.target.classList.contains('lb-stage')) lightbox.close();
});
lightbox?.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') showPhoto(lbIndex - 1);
    if (e.key === 'ArrowRight') showPhoto(lbIndex + 1);
});
// Wischen auf dem Handy
let touchX = null;
lightbox?.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
lightbox?.addEventListener('touchend', e => {
    if (touchX === null || !lbCat || lbCat.photos.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) showPhoto(lbIndex + (dx < 0 ? 1 : -1));
}, { passive: true });


// ── Kontaktformular (Versand über den bestehenden n8n-Webhook) ──
const WEBHOOK_URL  = 'https://n8n.srv1070777.hstgr.cloud/webhook/d6271044-14b4-4bd1-b026-df33608b4a20';
const CONTACT_MAIL = 'tischlerei.ochenbauer@gmail.com';

const contactForm = document.getElementById('contact-form');
const formError   = document.getElementById('form-error');
const formSuccess = document.getElementById('form-success');

function setFieldError(field, message) {
    const msg = document.getElementById(field.getAttribute('aria-describedby'));
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    if (msg) msg.textContent = message || '';
}

function validateField(field) {
    const value = field.value.trim();
    let message = '';
    if (field.id === 'contact-name' && !value) {
        message = 'Bitte geben Sie Ihren Namen an.';
    } else if (field.id === 'contact-email') {
        if (!value) message = 'Bitte geben Sie Ihre E-Mail-Adresse an, damit wir antworten können.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) message = 'Diese E-Mail-Adresse scheint unvollständig zu sein (z. B. name@beispiel.at).';
    } else if (field.id === 'contact-message' && !value) {
        message = 'Bitte beschreiben Sie kurz Ihr Anliegen.';
    }
    setFieldError(field, message);
    return !message;
}

function showSuccess() {
    contactForm.hidden = true;
    formSuccess.hidden = false;
    formSuccess.focus({ preventScroll: true });
    const rect = formSuccess.getBoundingClientRect();
    if (rect.top < 40 || rect.bottom > window.innerHeight) {
        window.scrollTo({ top: window.scrollY + rect.top - 120, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }
}

if (contactForm) {
    const requiredFields = [...contactForm.querySelectorAll('[required]')];

    // Fehler erst nach dem ersten Verlassen zeigen, danach live korrigieren
    requiredFields.forEach(field => {
        field.addEventListener('blur', () => { if (field.value.trim()) validateField(field); });
        field.addEventListener('input', () => { if (field.getAttribute('aria-invalid')) validateField(field); });
    });

    contactForm.addEventListener('submit', async e => {
        e.preventDefault();
        formError.hidden = true;

        const invalid = requiredFields.filter(f => !validateField(f));
        if (invalid.length) { invalid[0].focus(); return; }

        const data = new FormData(contactForm);
        // Honeypot: Bots füllen das versteckte Feld aus
        if (data.get('website')) { contactForm.reset(); showSuccess(); return; }

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const label = submitBtn.querySelector('.btn-label');
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
        label.textContent = 'Wird gesendet …';

        try {
            const res = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    'ihr name':           data.get('name').trim(),
                    'ihre email':         data.get('email').trim(),
                    'ihre telefonnummer': (data.get('phone') || '').trim(),
                    'ihre nachricht':     data.get('message').trim()
                })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            contactForm.reset();
            showSuccess();
        } catch (err) {
            console.error('Fehler beim Senden:', err);
            formError.innerHTML = `<span class="label label--sm">Nicht gesendet</span><p>Die Nachricht konnte nicht gesendet werden. Ihre Eingaben bleiben erhalten. Bitte versuchen Sie es noch einmal oder schreiben Sie direkt an <a href="mailto:${CONTACT_MAIL}">${CONTACT_MAIL}</a>.</p>`;
            formError.hidden = false;
            formError.focus({ preventScroll: true });
        } finally {
            submitBtn.disabled = false;
            submitBtn.removeAttribute('aria-busy');
            label.textContent = 'Anfrage senden';
        }
    });
}


// ── Stand im Schriftfeld ───────────────────────────────────
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
