// ═══════════════════════════════════════════════════════════
// TISCHLEREI OCHENBAUER — script.js
// ═══════════════════════════════════════════════════════════

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ── Mobile Navigation ──────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navMenu   = document.getElementById('nav-menu');
const backdrop  = document.getElementById('nav-backdrop');

function setNav(open) {
    if (!hamburger || !navMenu || !backdrop) return;
    navMenu.classList.toggle('active', open);
    hamburger.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    backdrop.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) navMenu.querySelector('a')?.focus();
}
const closeNav = () => setNav(false);

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


// ── Scroll Reveal ──────────────────────────────────────────
const revealEls = document.querySelectorAll('[data-reveal]');
if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('revealed'));
} else {
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
}


// ── Kontaktformular ────────────────────────────────────────
const WEBHOOK_URL = 'https://n8n.srv1070777.hstgr.cloud/webhook/d6271044-14b4-4bd1-b026-df33608b4a20';
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
// GALERIE — Bilder aus Supabase Storage (öffentlicher Bucket)
// ═══════════════════════════════════════════════════════════
const SUPABASE_URL      = 'https://oirmfkagzasujjlekvsw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pcm1ma2FnemFzdWpqbGVrdnN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODcxMzIsImV4cCI6MjA4MDc2MzEzMn0.w9ae07N1tkev28L840lACS_nVIIRKFYXAk_8iu1ARg4';
const SUPABASE_BUCKET   = 'bilder';

// Reihenfolge = Reihenfolge in der Galerie; die erste Kategorie wird groß gezeigt
const galleryCategories = [
    { id: 'stiege',       title: 'Stiege',       storagePrefix: 'Stiege'       },
    { id: 'kueche',       title: 'Küche',        storagePrefix: 'Kueche'       },
    { id: 'esstisch',     title: 'Esstisch',     storagePrefix: 'Esstisch'     },
    { id: 'wohnzimmer',   title: 'Wohnzimmer',   storagePrefix: 'Wohnzimmer'   },
    { id: 'stauraum',     title: 'Stauraum',     storagePrefix: 'Stauraum'     },
    { id: 'gartenhaus',   title: 'Gartenhaus',   storagePrefix: 'Gartenhaus',  wide: true },
    { id: 'bett',         title: 'Bett',         storagePrefix: 'Bett'         },
    { id: 'spiegel',      title: 'Spiegel',      storagePrefix: 'Spiegel'      },
    { id: 'kastenstiege', title: 'Kastenstiege', storagePrefix: 'Kastenstiege' },
    { id: 'badezimmer',   title: 'Badezimmer',   storagePrefix: 'Badezimmer'   },
    { id: 'tor',          title: 'Tor',          storagePrefix: 'Tor',         wide: true },
];

const categoryImages = new Map();
const isImagePath = name => /\.(png|jpe?g|webp|gif|avif)$/i.test(name);
const publicUrl = path => `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`;

async function listImages(prefix) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${SUPABASE_BUCKET}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ prefix, limit: 100, offset: 0, sortBy: { column: 'name', order: 'asc' } })
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    const files = await res.json();
    return files
        .filter(f => f.id && f.name && isImagePath(f.name))
        .map(f => ({ url: publicUrl(`${prefix}/${f.name}`), name: f.name }));
}

async function loadGallery() {
    const results = await Promise.allSettled(
        galleryCategories.map(async cat => categoryImages.set(cat.id, await listImages(cat.storagePrefix)))
    );
    if (results.every(r => r.status === 'rejected')) throw new Error('Galerie nicht erreichbar');
}

const portfolioGrid   = document.getElementById('portfolio-grid');
const portfolioStatus = document.getElementById('portfolio-status');

function renderSkeleton() {
    if (!portfolioGrid) return;
    portfolioGrid.innerHTML = galleryCategories.map(cat => `
        <div class="portfolio-item is-skeleton${cat.wide ? ' is-wide' : ''}" aria-hidden="true">
            <div class="portfolio-overlay"><h3>${cat.title}</h3></div>
        </div>`).join('');
}

function renderGallery() {
    if (!portfolioGrid) return;
    portfolioGrid.innerHTML = '';
    galleryCategories.forEach((cat, i) => {
        const images = categoryImages.get(cat.id) || [];
        const wide = cat.wide ? ' is-wide' : '';

        if (!images.length) {
            const empty = document.createElement('div');
            empty.className = `portfolio-item is-empty${wide}`;
            empty.innerHTML = `
                <svg class="icon" aria-hidden="true"><use href="#i-image"/></svg>
                <div class="portfolio-overlay"><h3>${cat.title}</h3><span>Bilder folgen</span></div>`;
            portfolioGrid.appendChild(empty);
            return;
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `portfolio-item${wide}`;
        btn.setAttribute('aria-label', `${cat.title}: Galerie mit ${images.length} ${images.length === 1 ? 'Foto' : 'Fotos'} öffnen`);
        const img = new Image();
        img.alt = '';
        img.loading = i < 4 ? 'eager' : 'lazy';
        img.decoding = 'async';
        img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
        img.addEventListener('error', () => btn.classList.add('is-skeleton'), { once: true });
        img.src = images[0].url;
        btn.appendChild(img);
        btn.insertAdjacentHTML('beforeend', `
            <div class="portfolio-overlay">
                <h3>${cat.title}</h3>
                <span>${images.length} ${images.length === 1 ? 'Foto' : 'Fotos'}</span>
            </div>`);
        btn.addEventListener('click', () => openLightbox(cat, btn));
        portfolioGrid.appendChild(btn);
    });
    portfolioGrid.setAttribute('aria-busy', 'false');
}

function showGalleryError() {
    if (!portfolioStatus) return;
    portfolioStatus.innerHTML = `<span>Die Galerie konnte gerade nicht geladen werden.</span><button type="button">Erneut versuchen</button>`;
    portfolioStatus.hidden = false;
    portfolioStatus.querySelector('button').addEventListener('click', initGallery, { once: true });
    portfolioGrid?.setAttribute('aria-busy', 'false');
}

async function initGallery() {
    if (portfolioStatus) portfolioStatus.hidden = true;
    portfolioGrid?.setAttribute('aria-busy', 'true');
    renderSkeleton();
    try {
        await loadGallery();
        renderGallery();
    } catch (err) {
        console.error(err);
        showGalleryError();
    }
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

const currentImages = () => categoryImages.get(currentCategory?.id) || [];

function openLightbox(category, opener) {
    if (!lightbox || !(categoryImages.get(category.id) || []).length) return;
    currentCategory = category;
    currentIndex    = 0;
    lightboxOpener  = opener;
    const multiple  = currentImages().length > 1;
    btnPrev.hidden  = !multiple;
    btnNext.hidden  = !multiple;
    updateLightbox();
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    btnClose.focus();
}

function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.style.overflow = '';
    lightboxOpener?.focus();
}

function updateLightbox() {
    const images = currentImages();
    if (!images.length || !lightboxImg) return;
    lightboxImg.classList.add('lb-loading');
    lightboxImg.onload = lightboxImg.onerror = () => lightboxImg.classList.remove('lb-loading');
    lightboxImg.src = images[currentIndex].url;
    if (lightboxImg.complete && lightboxImg.naturalWidth) lightboxImg.classList.remove('lb-loading');
    lightboxImg.alt = `${currentCategory.title} – Foto ${currentIndex + 1} von ${images.length}`;
    lightboxTitle.textContent = currentCategory.title;
    lightboxCount.textContent = `${currentIndex + 1} / ${images.length}`;

    // Nachbarn vorladen, damit Weiterblättern sofort reagiert
    const n = images.length;
    if (n > 1) {
        new Image().src = images[(currentIndex + 1) % n].url;
        new Image().src = images[(currentIndex - 1 + n) % n].url;
    }
}

function step(dir) {
    const n = currentImages().length;
    if (n < 2) return;
    currentIndex = (currentIndex + dir + n) % n;
    updateLightbox();
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

// Galerie erst laden, wenn sie in die Nähe des Viewports kommt
const portfolioSection = document.getElementById('portfolio');
if (portfolioSection && 'IntersectionObserver' in window) {
    renderSkeleton();
    const galleryObserver = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        galleryObserver.disconnect();
        initGallery();
    }, { rootMargin: '600px 0px' });
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
