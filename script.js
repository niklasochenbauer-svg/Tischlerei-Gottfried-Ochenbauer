// ═══════════════════════════════════════════════════════════
// TISCHLEREI OCHENBAUER — script.js
// ═══════════════════════════════════════════════════════════

// ── Mobile Navigation ──────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navMenu   = document.getElementById('nav-menu');
const backdrop  = document.getElementById('nav-backdrop');

function closeNav() {
    hamburger?.classList.remove('active');
    navMenu?.classList.remove('active');
    backdrop?.classList.remove('active');
    hamburger?.setAttribute('aria-expanded', 'false');
}

if (hamburger && navMenu && backdrop) {
    hamburger.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('active');
        hamburger.classList.toggle('active', isOpen);
        backdrop.classList.toggle('active', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
    });
    backdrop.addEventListener('click', closeNav);
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', closeNav));
}


// ── Smooth Scrolling ───────────────────────────────────────
document.querySelectorAll("a[href^='#']").forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        if (!targetId || targetId === '#') return;
        const target = document.querySelector(targetId);
        if (!target) return;
        window.scrollTo({
            top: target.getBoundingClientRect().top + window.pageYOffset - 80,
            behavior: 'smooth'
        });
    });
});


// ── Navbar — scroll state ──────────────────────────────────
const navbar = document.getElementById('navbar');


// ── Active Nav Link (Scrollspy) ────────────────────────────
const sections    = document.querySelectorAll('section[id]');
const navLinks    = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
            link.classList.toggle(
                'active',
                link.getAttribute('href') === '#' + entry.target.id
            );
        });
    });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => sectionObserver.observe(s));


// ── Scroll Reveal ──────────────────────────────────────────
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        // Stagger siblings inside the same parent grid
        const parent = entry.target.parentElement;
        const siblings = parent
            ? [...parent.querySelectorAll('[data-reveal]')].filter(
                el => el.closest('[data-reveal]') === el
              )
            : [];
        const idx = siblings.indexOf(entry.target);
        const delay = idx >= 0 ? idx * 80 : 0;

        setTimeout(() => {
            entry.target.classList.add('revealed');
        }, delay);

        revealObserver.unobserve(entry.target);
    });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('[data-reveal]')
    .forEach(el => revealObserver.observe(el));


// ── Contact Form ───────────────────────────────────────────
const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const successMessage = document.getElementById('success-message');
        const errorMessage   = document.getElementById('error-message');
        if (successMessage) successMessage.style.display = 'none';
        if (errorMessage)   errorMessage.style.display   = 'none';

        const nameField    = document.getElementById('contact-name');
        const emailField   = document.getElementById('contact-email');
        const messageField = document.getElementById('contact-message');
        const name    = nameField.value.trim();
        const email   = emailField.value.trim();
        const phone   = document.getElementById('contact-phone').value.trim();
        const message = messageField.value.trim();

        // Clear previous field errors
        [nameField, emailField, messageField].forEach(f => f.classList.remove('field-error'));
        if (errorMessage) errorMessage.style.display = 'none';

        let firstError = null;
        if (!name)    { nameField.classList.add('field-error');    firstError = firstError || nameField; }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            emailField.classList.add('field-error'); firstError = firstError || emailField;
        }
        if (!message) { messageField.classList.add('field-error'); firstError = firstError || messageField; }

        if (firstError) {
            if (errorMessage) {
                errorMessage.textContent = 'Bitte füllen Sie alle Pflichtfelder korrekt aus.';
                errorMessage.style.display = 'block';
            }
            firstError.focus();
            return;
        }

        const submitButton = this.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = 'Wird gesendet…';
        submitButton.disabled  = true;

        fetch('https://n8n.srv1070777.hstgr.cloud/webhook/d6271044-14b4-4bd1-b026-df33608b4a20', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                'ihr name':           name,
                'ihre email':         email,
                'ihre telefonnummer': phone || '',
                'ihre nachricht':     message
            })
        })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.text().then(t => { try { return JSON.parse(t); } catch { return { ok: true }; } });
        })
        .then(() => {
            if (successMessage) {
                successMessage.style.display = 'block';
                successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            this.reset();
            [nameField, emailField, messageField].forEach(f => f.classList.remove('field-error'));
        })
        .catch(err => {
            console.error('Fehler beim Senden:', err);
            if (errorMessage) {
                errorMessage.style.display = 'block';
                errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        })
        .finally(() => {
            submitButton.innerHTML = originalText;
            submitButton.disabled  = false;
        });
    });
}


// ── Scroll to Top Button ───────────────────────────────────
const scrollToTopBtn = document.createElement('button');
scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
scrollToTopBtn.className = 'scroll-to-top';
scrollToTopBtn.setAttribute('aria-label', 'Nach oben scrollen');
scrollToTopBtn.style.cssText = 'opacity:0; visibility:hidden; transition: opacity 0.3s ease, visibility 0.3s ease;';
document.body.appendChild(scrollToTopBtn);

// Single RAF-throttled scroll handler for all scroll-dependent DOM writes
let scrollRafPending = false;
window.addEventListener('scroll', () => {
    if (scrollRafPending) return;
    scrollRafPending = true;
    requestAnimationFrame(() => {
        const y = window.scrollY;
        if (navbar) navbar.classList.toggle('scrolled', y > 60);
        const show = y > 400;
        scrollToTopBtn.style.opacity    = show ? '1' : '0';
        scrollToTopBtn.style.visibility = show ? 'visible' : 'hidden';
        scrollRafPending = false;
    });
}, { passive: true });

scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));


// ── Cookie Banner ──────────────────────────────────────────
const cookieBanner     = document.getElementById('cookie-banner');
const acceptCookiesBtn = document.getElementById('accept-cookies');
const declineCookiesBtn = document.getElementById('decline-cookies');

if (!localStorage.getItem('cookieConsent') && cookieBanner) {
    setTimeout(() => cookieBanner.classList.add('show'), 2200);
}
acceptCookiesBtn?.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    cookieBanner?.classList.remove('show');
});
declineCookiesBtn?.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'declined');
    cookieBanner?.classList.remove('show');
});


// ── Modals (Privacy & Impressum) ───────────────────────────
const privacyModal  = document.getElementById('privacy-modal');
const privacyLink   = document.getElementById('privacy-link');
const impressumModal = document.getElementById('impressum-modal');
const impressumLink = document.getElementById('impressum-link');

let modalOpener = null;

function openModal(modal) {
    if (!modal) return;
    modalOpener = document.activeElement;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    const focusTarget = modal.querySelector('.close, button, [href], input');
    if (focusTarget) focusTarget.focus();
}
function closeAllModals() {
    if (privacyModal)  privacyModal.style.display  = 'none';
    if (impressumModal) impressumModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    if (modalOpener) { modalOpener.focus(); modalOpener = null; }
}

privacyLink?.addEventListener('click',   e => { e.preventDefault(); openModal(privacyModal); });
impressumLink?.addEventListener('click', e => { e.preventDefault(); openModal(impressumModal); });

document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
    btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') closeAllModals(); });
});
window.addEventListener('click', e => {
    if (e.target === privacyModal || e.target === impressumModal) closeAllModals();
});
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (navMenu?.classList.contains('active')) { closeNav(); return; }
    closeAllModals();
});


// ═══════════════════════════════════════════════════════════
// SUPABASE GALLERY
// ═══════════════════════════════════════════════════════════
const SUPABASE_URL      = 'https://oirmfkagzasujjlekvsw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pcm1ma2FnemFzdWpqbGVrdnN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODcxMzIsImV4cCI6MjA4MDc2MzEzMn0.w9ae07N1tkev28L840lACS_nVIIRKFYXAk_8iu1ARg4';
const SUPABASE_BUCKET   = 'bilder';

let supabaseClient = null;

async function ensureSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    if (!window.supabase) {
        await new Promise((resolve, reject) => {
            if (document.querySelector(`script[src*="supabase"]`)) { resolve(); return; }
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
            s.defer = true;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }
    if (window.supabase) {
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (err) {
            console.error('Supabase Client Fehler:', err);
        }
    } else {
        console.warn('Supabase nicht geladen');
    }
    return supabaseClient;
}

const galleryCategories = [
    { id: 'badezimmer',   title: 'Badezimmer',   storagePrefix: 'Badezimmer'   },
    { id: 'bett',         title: 'Bett',         storagePrefix: 'Bett'         },
    { id: 'esstisch',     title: 'Esstisch',     storagePrefix: 'Esstisch'     },
    { id: 'gartenhaus',   title: 'Gartenhaus',   storagePrefix: 'Gartenhaus'   },
    { id: 'kastenstiege', title: 'Kastenstiege', storagePrefix: 'Kastenstiege' },
    { id: 'kueche',       title: 'Küche',        storagePrefix: 'Kueche'       },
    { id: 'spiegel',      title: 'Spiegel',      storagePrefix: 'Spiegel'      },
    { id: 'stauraum',     title: 'Stauraum',     storagePrefix: 'Stauraum'     },
    { id: 'stiege',       title: 'Stiege',       storagePrefix: 'Stiege'       },
    { id: 'tor',          title: 'Tor',          storagePrefix: 'Tor'          },
    { id: 'wohnzimmer',   title: 'Wohnzimmer',   storagePrefix: 'Wohnzimmer'   },
];

const categoryImagesMap = new Map();

function isImagePath(path) {
    return /\.(png|jpe?g|webp|gif|bmp)$/i.test(path);
}

async function listSupabaseImagesFor(storagePrefix) {
    if (!supabaseClient) return [];
    try {
        const { data, error } = await supabaseClient
            .storage
            .from(SUPABASE_BUCKET)
            .list(storagePrefix, { limit: 100, sortBy: { column: 'name', order: 'asc' } });
        if (error || !data?.length) return [];
        return data
            .filter(f => f.id && f.name && isImagePath(f.name))
            .map(f => ({ path: `${storagePrefix}/${f.name}`, name: f.name }));
    } catch (err) {
        console.error(`Fehler beim Laden von ${storagePrefix}:`, err);
        return [];
    }
}

async function getSupabasePublicUrl(path) {
    if (!supabaseClient) return '';
    try {
        const { data } = supabaseClient.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
        return data?.publicUrl || '';
    } catch (err) {
        console.error('Fehler bei Public URL:', err);
        return '';
    }
}

async function preloadAllCategories() {
    const client = await ensureSupabaseClient();
    if (!client) { console.warn('Supabase nicht verfügbar. Galerie bleibt leer.'); return; }

    await Promise.all(galleryCategories.map(async cat => {
        try {
            const files = await listSupabaseImagesFor(cat.storagePrefix);
            if (!files.length) { categoryImagesMap.set(cat.id, []); return; }
            const images = await Promise.all(
                files.map(async f => ({ url: await getSupabasePublicUrl(f.path), name: f.name }))
            );
            categoryImagesMap.set(cat.id, images.filter(img => !!img.url));
        } catch (err) {
            console.error(`Fehler bei Kategorie ${cat.title}:`, err);
            categoryImagesMap.set(cat.id, []);
        }
    }));
}

function renderPortfolioCategories() {
    const portfolioGrid = document.getElementById('portfolio-grid');
    if (!portfolioGrid) return;
    portfolioGrid.innerHTML = '';

    galleryCategories.forEach(category => {
        const images = categoryImagesMap.get(category.id) || [];
        const cover  = images[0]?.url || '';
        const item   = document.createElement('div');
        item.className = 'portfolio-item';
        item.dataset.categoryId = category.id;

        if (cover) {
            item.innerHTML = `
                <img src="${cover}" alt="${category.title}" loading="lazy">
                <div class="portfolio-overlay">
                    <h3>${category.title}</h3>
                    <p>${images.length} Foto${images.length === 1 ? '' : 's'}</p>
                </div>`;
        } else {
            item.innerHTML = `
                <div class="portfolio-placeholder">
                    <i class="fas fa-image"></i>
                    <p>${category.title}</p>
                </div>
                <div class="portfolio-overlay">
                    <h3>${category.title}</h3>
                    <p>Bilder folgen</p>
                </div>`;
        }

        item.addEventListener('click', () => openLightbox(category));
        portfolioGrid.appendChild(item);
    });
}


// ── Lightbox ───────────────────────────────────────────────
let currentCategory = null;
let currentIndex    = 0;

const lightbox      = document.getElementById('lightbox');
const lightboxImg   = document.querySelector('.lightbox-image');
const lightboxTitle = document.querySelector('.lightbox-title');
const lightboxCount = document.querySelector('.lightbox-counter');
const btnPrev       = document.querySelector('.lightbox-prev');
const btnNext       = document.querySelector('.lightbox-next');
const btnClose      = document.querySelector('.lightbox-close');

function openLightbox(category) {
    const images = categoryImagesMap.get(category.id) || [];
    if (!images.length) { alert(`Noch keine Bilder in „${category.title}".`); return; }
    currentCategory = category;
    currentIndex    = 0;
    updateLightbox();
    lightbox?.classList.add('show');
    lightbox?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    btnClose?.focus();
}

function closeLightbox() {
    lightbox?.classList.remove('show');
    lightbox?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
}

function updateLightbox() {
    if (!currentCategory) return;
    const images = categoryImagesMap.get(currentCategory.id) || [];
    if (!images.length) return;

    if (lightboxImg) {
        lightboxImg.classList.add('lb-loading');
        lightboxImg.onload  = () => lightboxImg.classList.remove('lb-loading');
        lightboxImg.onerror = () => lightboxImg.classList.remove('lb-loading');
        lightboxImg.src = images[currentIndex].url;
    }
    if (lightboxTitle) lightboxTitle.textContent = currentCategory.title;
    if (lightboxCount) lightboxCount.textContent = `${currentIndex + 1} / ${images.length}`;

    // Preload neighbours so next/prev click is instant
    const n = images.length;
    if (n > 1) {
        new Image().src = images[(currentIndex + 1) % n].url;
        new Image().src = images[(currentIndex - 1 + n) % n].url;
    }
}

function nextImage() {
    const images = categoryImagesMap.get(currentCategory?.id) || [];
    if (!images.length) return;
    currentIndex = (currentIndex + 1) % images.length;
    updateLightbox();
}
function prevImage() {
    const images = categoryImagesMap.get(currentCategory?.id) || [];
    if (!images.length) return;
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateLightbox();
}

btnNext?.addEventListener('click', nextImage);
btnPrev?.addEventListener('click', prevImage);
btnClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

// Touch swipe for lightbox (mobile/tablet)
let lbTouchStartX = 0;
lightbox?.addEventListener('touchstart', e => {
    lbTouchStartX = e.changedTouches[0].clientX;
}, { passive: true });
lightbox?.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - lbTouchStartX;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) nextImage(); else prevImage();
}, { passive: true });

document.addEventListener('keydown', e => {
    if (lightbox?.getAttribute('aria-hidden') === 'true') return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft')  prevImage();
});


// ── Mobile Portfolio Toggle ────────────────────────────────
function setupMobilePortfolioToggle() {
    const toggleBtn = document.getElementById('portfolio-toggle');
    const grid      = document.getElementById('portfolio-grid');
    if (!toggleBtn || !grid) return;

    function applyState() {
        if (window.innerWidth > 768) {
            grid.classList.add('open');
            toggleBtn.setAttribute('aria-expanded', 'true');
            toggleBtn.textContent = 'Kategorien ausblenden';
        } else {
            grid.classList.remove('open');
            toggleBtn.setAttribute('aria-expanded', 'false');
            toggleBtn.textContent = 'Kategorien anzeigen';
        }
    }
    applyState();

    toggleBtn.addEventListener('click', () => {
        if (window.innerWidth > 768) return;
        const open = grid.classList.toggle('open');
        toggleBtn.setAttribute('aria-expanded', String(open));
        toggleBtn.textContent = open ? 'Kategorien ausblenden' : 'Kategorien anzeigen';
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(applyState, 150);
    }, { passive: true });
}


// ── Load Logo from Supabase ────────────────────────────────
async function loadLogoFromSupabase() {
    const client = await ensureSupabaseClient();
    if (!client) return;
    try {
        const files = await listSupabaseImagesFor('Logo');
        if (!files.length) return;
        const url = await getSupabasePublicUrl(files[0].path);
        if (!url) return;
        const navLogoImg   = document.getElementById('nav-logo-img');
        const heroLogoImg  = document.getElementById('hero-logo-image');
        const footerLogo   = document.querySelector('.footer-logo img');
        const favicon      = document.querySelector('link[rel="icon"]');
        if (navLogoImg)  navLogoImg.src  = url;
        if (heroLogoImg) heroLogoImg.src = url;
        if (footerLogo)  footerLogo.src  = url;
        if (favicon)     favicon.href    = url;
    } catch (err) {
        console.error('Fehler beim Laden des Logos:', err);
    }
}


// ── Load Portrait from Supabase ────────────────────────────
async function loadPortraitFromSupabase() {
    const client = await ensureSupabaseClient();
    if (!client) return;
    try {
        const files = await listSupabaseImagesFor('Portrait');
        if (!files.length) return;
        const url = await getSupabasePublicUrl(files[0].path);
        if (!url) return;
        const aboutImg = document.querySelector('.about-image .about-placeholder img');
        if (aboutImg) {
            aboutImg.src = url;
            aboutImg.alt = 'Gottfried Ochenbauer – Tischler & Holzgestalter';
        }
    } catch (err) {
        console.error('Fehler beim Laden des Portraits:', err);
    }
}


// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
    setupMobilePortfolioToggle();

    // Show category placeholders immediately — grid is never empty
    renderPortfolioCategories();

    // Logo and portrait load in parallel — not sequential
    Promise.all([loadLogoFromSupabase(), loadPortraitFromSupabase()]);

    // Lazy-load gallery: only fire Supabase requests when portfolio is near viewport.
    // rootMargin 400px means loading starts before the section is visible.
    const portfolioSection = document.getElementById('portfolio');
    if (portfolioSection) {
        const galleryObserver = new IntersectionObserver(entries => {
            if (!entries[0].isIntersecting) return;
            galleryObserver.disconnect();
            preloadAllCategories().then(renderPortfolioCategories);
        }, { rootMargin: '400px 0px', threshold: 0 });
        galleryObserver.observe(portfolioSection);
    } else {
        preloadAllCategories().then(renderPortfolioCategories);
    }

    // Pre-warm TCP connection to form webhook before contact section is visible
    const contactSection = document.getElementById('contact');
    if (contactSection) {
        const formPreconnect = new IntersectionObserver(entries => {
            if (!entries[0].isIntersecting) return;
            formPreconnect.disconnect();
            const link = Object.assign(document.createElement('link'), {
                rel: 'preconnect', href: 'https://n8n.srv1070777.hstgr.cloud'
            });
            document.head.appendChild(link);
        }, { rootMargin: '300px 0px', threshold: 0 });
        formPreconnect.observe(contactSection);
    }
});
