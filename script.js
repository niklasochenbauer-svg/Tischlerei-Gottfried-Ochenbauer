// ═══════════════════════════════════════════════════════════
// TISCHLEREI OCHENBAUER — script.js
// ═══════════════════════════════════════════════════════════

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';

const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));


// ── Mobile Navigation ──────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navMenu   = document.getElementById('nav-menu');
const backdrop  = document.getElementById('nav-backdrop');

let navAnimTimer;
function setNav(open) {
    if (!hamburger || !navMenu || !backdrop) return;
    if (open !== navMenu.classList.contains('active')) {
        navMenu.classList.add('is-animating');
        clearTimeout(navAnimTimer);
        navAnimTimer = setTimeout(() => navMenu.classList.remove('is-animating'), 700);
    }
    navMenu.classList.toggle('active', open);
    hamburger.classList.toggle('active', open);
    backdrop.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) navMenu.querySelector('a')?.focus({ preventScroll: true });
}
const closeNav = () => setNav(false);

backdrop?.removeAttribute('hidden');
hamburger?.addEventListener('click', () => setNav(!navMenu.classList.contains('active')));
backdrop?.addEventListener('click', closeNav);
navMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
window.matchMedia('(min-width: 769px)').addEventListener('change', e => { if (e.matches) closeNav(); });


// ── Navbar-Zustand & Nach-oben-Button ──────────────────────
const navbar      = document.getElementById('navbar');
const scrollTopEl = document.getElementById('scroll-top');
let scrollRafPending = false;

function onScroll() {
    const y = window.scrollY;
    navbar?.classList.toggle('scrolled', y > 40);
    scrollTopEl?.classList.toggle('is-visible', y > 600);
    scrollRafPending = false;
}
window.addEventListener('scroll', () => {
    if (scrollRafPending) return;
    scrollRafPending = true;
    requestAnimationFrame(onScroll);
}, { passive: true });
onScroll();


// ── Aktiver Navigationspunkt (Scrollspy) ───────────────────
const navLinks = document.querySelectorAll('.nav-link');
const spyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
            const active = link.getAttribute('href') === '#' + entry.target.id;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    });
}, { rootMargin: '-40% 0px -55% 0px' });
document.querySelectorAll('main section[id]').forEach(s => spyObserver.observe(s));


// ── Scroll Reveal (gestaffelt) ─────────────────────────────
const revealEls = document.querySelectorAll('[data-reveal]');
revealEls.forEach(el => [...el.children].forEach((child, i) => child.style.setProperty('--i', i)));

function reveal(el) {
    el.classList.add('revealed');
    // Danach Verzögerungen entfernen, damit Hover sofort reagiert
    const total = 1400 + el.children.length * 90;
    setTimeout(() => el.classList.add('reveal-done'), total);
}

if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('revealed', 'reveal-done'));
} else {
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            reveal(entry.target);
            revealObserver.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
}


// ── Kontaktformular ────────────────────────────────────────
const WEBHOOK_URL  = 'https://n8n.srv1070777.hstgr.cloud/webhook/d6271044-14b4-4bd1-b026-df33608b4a20';
const CONTACT_MAIL = 'tischlerei.ochenbauer@gmail.com';

const contactForm = document.getElementById('contact-form');
const formStatus  = document.getElementById('form-status');

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

function showStatus(type, html) {
    if (!formStatus) return;
    formStatus.className = `form-feedback is-${type}`;
    formStatus.innerHTML = html;
    formStatus.hidden = false;
    formStatus.focus({ preventScroll: true });
    formStatus.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
    if (!reduceMotion.matches) {
        formStatus.animate(
            [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
            { duration: 320, easing: EASE_OUT }
        );
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
        if (formStatus) formStatus.hidden = true;

        const invalid = requiredFields.filter(f => !validateField(f));
        if (invalid.length) { invalid[0].focus(); return; }

        const data = new FormData(contactForm);
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const label = submitBtn.querySelector('.btn-label');

        // Honeypot: Bots füllen das versteckte Feld aus
        if (data.get('website')) {
            contactForm.reset();
            showStatus('success', '<strong>Vielen Dank!</strong> Ihre Nachricht wurde gesendet.');
            return;
        }

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
            showStatus('success', '<strong>Vielen Dank für Ihre Nachricht!</strong> Wir melden uns so schnell wie möglich bei Ihnen.');
        } catch (err) {
            console.error('Fehler beim Senden:', err);
            showStatus('error', `<strong>Die Nachricht konnte nicht gesendet werden.</strong> Ihre Eingaben bleiben erhalten — bitte versuchen Sie es noch einmal oder schreiben Sie uns direkt an <a href="mailto:${CONTACT_MAIL}">${CONTACT_MAIL}</a>.`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.removeAttribute('aria-busy');
            label.textContent = 'Nachricht senden';
        }
    });
}


// ═══════════════════════════════════════════════════════════
// GALERIE — Kategorien & Fotos aus Supabase (siehe galerie.js)
// ═══════════════════════════════════════════════════════════
const portfolioGrid   = document.getElementById('portfolio-grid');
const portfolioStatus = document.getElementById('portfolio-status');
const GALLERY_CACHE   = 'tischlerei-galerie-v1';
let galleryCategories = [];   // [{ ordner, titel, photos: [{ name, url, thumb }], coverIndex }]
let galleryRequest    = null;

// Zuletzt geladene Galerie merken: beim nächsten Besuch sofort da,
// und die Platzhalter haben gleich die richtige Anzahl (kein Springen)
function readGalleryCache() {
    try {
        const data = JSON.parse(localStorage.getItem(GALLERY_CACHE));
        return Array.isArray(data?.cats) && data.cats.length ? data.cats : null;
    } catch { return null; }
}
function writeGalleryCache(cats) {
    try { localStorage.setItem(GALLERY_CACHE, JSON.stringify({ t: Date.now(), cats })); } catch {}
}

async function fetchGalleryData() {
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

// Daten früh im Hintergrund holen, damit beim Hinscrollen nichts mehr wartet
function prefetchGallery() {
    if (!galleryRequest) {
        galleryRequest = fetchGalleryData().catch(err => { galleryRequest = null; throw err; });
    }
    return galleryRequest;
}

function renderSkeleton(count = readGalleryCache()?.length || 11) {
    if (!portfolioGrid) return;
    portfolioGrid.innerHTML = Array.from({ length: count }, () =>
        '<div class="portfolio-item is-skeleton" aria-hidden="true"></div>').join('');
    layoutGallery();
}

// Breite Kacheln so verteilen, dass die letzte Reihe immer voll ist
function layoutGallery() {
    if (!portfolioGrid) return;
    const items = [...portfolioGrid.children];
    if (!items.length) return;
    items.forEach(el => el.classList.remove('is-wide'));
    const cols = getComputedStyle(portfolioGrid).gridTemplateColumns.split(' ').length;
    const featureCells = cols >= 3 ? 4 : cols;
    const cells = featureCells + items.length - 1;
    let missing = (cols - (cells % cols)) % cols;
    for (let i = items.length - 1; i > 0 && missing > 0; i--) {
        items[i].classList.add('is-wide');
        missing -= 1;
        i -= 1; // breite Kacheln nicht direkt nebeneinander
    }
}

function renderGallery() {
    if (!portfolioGrid) return;
    const visible = galleryCategories.filter(c => c.photos.length);
    portfolioGrid.innerHTML = '';

    visible.forEach((cat, i) => {
        const cover = cat.photos[cat.coverIndex] || cat.photos[0];
        const count = `${cat.photos.length} ${cat.photos.length === 1 ? 'Foto' : 'Fotos'}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'portfolio-item is-loading';
        btn.setAttribute('aria-label', `${cat.titel}: Galerie mit ${count} öffnen`);

        const img = new Image();
        img.alt = '';
        img.loading = i < 5 ? 'eager' : 'lazy';
        img.decoding = 'async';
        img.addEventListener('load', () => { img.classList.add('is-loaded'); btn.classList.remove('is-loading'); }, { once: true });
        img.addEventListener('error', () => {
            // Optimierung oder Vorschaubild nicht verfügbar? Dann das Originalfoto nehmen
            if (img.src !== cover.url) { img.removeAttribute('srcset'); img.src = cover.url; }
        });
        if (Galerie.OPTIMIZE) {
            // Kachelgröße: die erste ist doppelt so groß wie die übrigen
            img.sizes = i === 0 ? '(max-width: 768px) 92vw, 50vw' : '(max-width: 768px) 46vw, 25vw';
            img.srcset = Galerie.srcset(cover.url);
            img.src = Galerie.sized(cover.url, 640);
        } else {
            img.src = cover.thumb || cover.url;
        }

        btn.appendChild(img);
        btn.insertAdjacentHTML('beforeend', `
            <div class="portfolio-overlay">
                <h3>${escapeHtml(cat.titel)}</h3>
                <span>${count}</span>
            </div>`);
        btn.addEventListener('click', () => openLightbox(cat, btn));
        portfolioGrid.appendChild(btn);
    });

    portfolioGrid.setAttribute('aria-busy', 'false');
    layoutGallery();
}

function showGalleryError() {
    if (!portfolioStatus) return;
    portfolioStatus.innerHTML = '<span>Die Galerie konnte gerade nicht geladen werden.</span><button type="button">Erneut versuchen</button>';
    portfolioStatus.hidden = false;
    portfolioStatus.querySelector('button').addEventListener('click', initGallery, { once: true });
    portfolioGrid.innerHTML = '';
    portfolioGrid.setAttribute('aria-busy', 'false');
}

async function initGallery() {
    if (portfolioStatus) portfolioStatus.hidden = true;
    const cached = readGalleryCache();
    if (cached) {
        galleryCategories = cached;
        renderGallery();
    } else {
        portfolioGrid?.setAttribute('aria-busy', 'true');
        renderSkeleton();
    }
    try {
        const fresh = await prefetchGallery();
        writeGalleryCache(fresh);
        // Nur neu aufbauen, wenn sich wirklich etwas geändert hat
        if (JSON.stringify(fresh) !== JSON.stringify(cached)) {
            galleryCategories = fresh;
            if (!lightbox || lightbox.hidden) renderGallery();
        }
    } catch (err) {
        console.error(err);
        if (!cached) showGalleryError();
    }
}

if (portfolioGrid && 'ResizeObserver' in window) {
    let lastCols = 0;
    new ResizeObserver(() => {
        const cols = getComputedStyle(portfolioGrid).gridTemplateColumns.split(' ').length;
        if (cols !== lastCols) { lastCols = cols; layoutGallery(); }
    }).observe(portfolioGrid);
}


// ── Lightbox ───────────────────────────────────────────────
const lightbox      = document.getElementById('lightbox');
const lightboxImg   = lightbox?.querySelector('.lightbox-image');
const lightboxTitle = lightbox?.querySelector('.lightbox-title');
const lightboxCount = lightbox?.querySelector('.lightbox-counter');
const btnPrev       = lightbox?.querySelector('.lightbox-prev');
const btnNext       = lightbox?.querySelector('.lightbox-next');
const btnClose      = lightbox?.querySelector('.lightbox-close');

let currentCategory = null;
let currentIndex    = 0;
let lightboxOpener  = null;
let swapToken       = 0;

const canMorph = () => 'startViewTransition' in document && !reduceMotion.matches;
const currentPhotos = () => currentCategory?.photos || [];

// Lädt ein Bild vor; liefert true bei Erfolg
function loadImage(url) {
    return new Promise(resolve => {
        const probe = new Image();
        probe.onload = () => resolve(true);
        probe.onerror = () => resolve(false);
        probe.src = url;
    });
}
const withTimeout = (promise, ms) => Promise.race([promise, new Promise(r => setTimeout(r, ms))]);

// Große Version passend zu Bildschirm und Pixeldichte (max. 1920 px)
function largeUrl(photo) {
    const width = Math.min(window.innerWidth, 1400) * Math.min(window.devicePixelRatio || 1, 2);
    return Galerie.sized(photo.url, Math.min(1920, Math.round(width)));
}

// Große Version laden und einsetzen, sobald sie da ist (Fallback: Original)
async function upgradeLightboxImage(photo, index) {
    let url = largeUrl(photo);
    if (!(await loadImage(url)) && url !== photo.url) {
        url = photo.url;
        await loadImage(url);
    }
    if (lightbox.hidden || index !== currentIndex || currentPhotos()[index] !== photo) return;
    lightboxImg.src = url;
    lightboxImg.classList.remove('lb-loading');
}

function setLightboxText() {
    const photos = currentPhotos();
    lightboxTitle.textContent = currentCategory.titel;
    lightboxCount.textContent = `${currentIndex + 1} / ${photos.length}`;
    lightboxImg.alt = `${currentCategory.titel} – Foto ${currentIndex + 1} von ${photos.length}`;
}

function preloadNeighbours() {
    const photos = currentPhotos();
    const n = photos.length;
    if (n < 2) return;
    new Image().src = largeUrl(photos[(currentIndex + 1) % n]);
    new Image().src = largeUrl(photos[(currentIndex - 1 + n) % n]);
}

async function openLightbox(category, opener) {
    if (!lightbox || !category.photos.length) return;
    currentCategory = category;
    currentIndex    = category.coverIndex;
    lightboxOpener  = opener;
    const multiple  = category.photos.length > 1;
    btnPrev.hidden  = !multiple;
    btnNext.hidden  = !multiple;

    const photo = category.photos[currentIndex];
    const tileImg = opener.querySelector('img');
    // Sofort mit dem bereits geladenen Kachelbild öffnen, große Version folgt
    const instantSrc = tileImg?.complete && tileImg.naturalWidth ? tileImg.currentSrc : '';
    loadImage(largeUrl(photo)); // schon jetzt anstoßen

    const show = () => {
        lightboxImg.src = instantSrc || largeUrl(photo);
        lightboxImg.classList.toggle('lb-loading', !instantSrc);
        setLightboxText();
        lightbox.hidden = false;
        document.body.style.overflow = 'hidden';
    };

    if (canMorph() && tileImg) {
        // Foto wächst aus der angeklickten Kachel in die Lightbox
        lightbox.classList.add('is-instant', 'is-open');
        tileImg.style.viewTransitionName = 'lb-photo';
        const vt = document.startViewTransition(() => {
            tileImg.style.viewTransitionName = '';
            lightboxImg.style.viewTransitionName = 'lb-photo';
            show();
        });
        await vt.finished.catch(() => {});
        lightboxImg.style.viewTransitionName = '';
        lightbox.classList.remove('is-instant');
    } else {
        show();
        lightbox.offsetWidth; // Startzustand festschreiben, dann einblenden
        lightbox.classList.add('is-open');
    }
    btnClose.focus({ preventScroll: true });
    upgradeLightboxImage(photo, currentIndex);
    preloadNeighbours();
}

async function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    const opener = lightboxOpener;
    const tileImg = opener?.querySelector('img');
    // Nur zurück in die Kachel morphen, wenn noch das Titelbild gezeigt wird
    const backToTile = canMorph() && tileImg && currentIndex === currentCategory.coverIndex;

    const hide = () => {
        lightbox.hidden = true;
        lightbox.classList.remove('is-open');
        document.body.style.overflow = '';
    };

    if (backToTile) {
        lightbox.classList.add('is-instant');
        lightboxImg.style.viewTransitionName = 'lb-photo';
        const vt = document.startViewTransition(() => {
            lightboxImg.style.viewTransitionName = '';
            tileImg.style.viewTransitionName = 'lb-photo';
            hide();
        });
        await vt.finished.catch(() => {});
        tileImg.style.viewTransitionName = '';
        lightbox.classList.remove('is-instant');
    } else if (!reduceMotion.matches) {
        lightbox.classList.remove('is-open');
        await new Promise(r => setTimeout(r, 280));
        if (!lightbox.classList.contains('is-open')) hide();
    } else {
        hide();
    }
    opener?.focus({ preventScroll: true });
}

// Bildwechsel: altes Foto gleitet weg, neues gleitet aus der Blätterrichtung herein
async function step(dir) {
    const photos = currentPhotos();
    if (photos.length < 2) return;
    currentIndex = (currentIndex + dir + photos.length) % photos.length;
    const token = ++swapToken;
    const photo = photos[currentIndex];
    let url = largeUrl(photo);
    setLightboxText();

    if (reduceMotion.matches) {
        if (!(await loadImage(url))) url = photo.url;
        if (token === swapToken) lightboxImg.src = url;
        preloadNeighbours();
        return;
    }

    lightboxImg.getAnimations().forEach(a => a.cancel());
    const out = lightboxImg.animate(
        [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 24}px)` }],
        { duration: 160, easing: 'ease-out', fill: 'forwards' }
    );
    const [, loaded] = await Promise.all([out.finished.catch(() => {}), withTimeout(loadImage(url), 2500)]);
    if (token !== swapToken) return; // schneller weitergeblättert
    if (loaded === false) url = photo.url; // Optimierung nicht verfügbar → Original

    lightboxImg.src = url;
    await withTimeout(lightboxImg.decode?.().catch(() => {}) ?? Promise.resolve(), 400);
    if (token !== swapToken) return;
    out.cancel();
    lightboxImg.animate(
        [{ opacity: 0, transform: `translateX(${dir * 24}px)` }, { opacity: 1, transform: 'none' }],
        { duration: 280, easing: EASE_OUT }
    );
    preloadNeighbours();
}

btnNext?.addEventListener('click', () => step(1));
btnPrev?.addEventListener('click', () => step(-1));
btnClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

let touchStartX = 0;
lightbox?.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
lightbox?.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
}, { passive: true });

document.addEventListener('keydown', e => {
    if (lightbox && !lightbox.hidden) {
        if (e.key === 'Escape')     closeLightbox();
        if (e.key === 'ArrowRight') step(1);
        if (e.key === 'ArrowLeft')  step(-1);
        if (e.key === 'Tab') {
            // Fokus im Dialog halten
            const focusables = [btnClose, btnPrev, btnNext].filter(b => b && !b.hidden);
            const idx = focusables.indexOf(document.activeElement);
            e.preventDefault();
            const next = e.shiftKey ? idx - 1 : idx + 1;
            focusables[(next + focusables.length) % focusables.length].focus();
        }
        return;
    }
    if (e.key === 'Escape' && navMenu?.classList.contains('active')) {
        closeNav();
        hamburger?.focus();
    }
});


// ═══════════════════════════════════════════════════════════
// INITIALISIERUNG
// ═══════════════════════════════════════════════════════════
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Galerie-Daten (kleine JSON-Listen) gleich nach dem Seitenaufbau im Hintergrund holen,
// die Fotos selbst erst, wenn die Galerie in die Nähe kommt
const portfolioSection = document.getElementById('portfolio');
const whenIdle = cb => ('requestIdleCallback' in window ? requestIdleCallback(cb, { timeout: 2500 }) : setTimeout(cb, 1200));
window.addEventListener('load', () => whenIdle(() => prefetchGallery().catch(() => {})), { once: true });

if (portfolioSection && 'IntersectionObserver' in window) {
    renderSkeleton();
    const galleryObserver = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        galleryObserver.disconnect();
        initGallery();
    }, { rootMargin: '1000px 0px' });
    galleryObserver.observe(portfolioSection);
} else {
    initGallery();
}

// Verbindung zum Formular-Webhook vorwärmen, sobald Kontakt in Sicht kommt
const contactSection = document.getElementById('contact');
if (contactSection && 'IntersectionObserver' in window) {
    const warm = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        warm.disconnect();
        document.head.appendChild(Object.assign(document.createElement('link'), {
            rel: 'preconnect', href: new URL(WEBHOOK_URL).origin
        }));
    }, { rootMargin: '400px 0px' });
    warm.observe(contactSection);
}
