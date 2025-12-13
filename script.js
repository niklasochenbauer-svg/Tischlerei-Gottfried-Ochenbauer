// ===== Mobile Navigation =====

const hamburger = document.querySelector('.hamburger');

const navMenu = document.querySelector('.nav-menu');

const backdrop = document.querySelector('.mobile-menu-backdrop');



if (hamburger && navMenu && backdrop) {

    hamburger.addEventListener('click', () => {

        hamburger.classList.toggle('active');

        navMenu.classList.toggle('active');

        backdrop.classList.toggle('active');

    });



    backdrop.addEventListener('click', () => {

        hamburger.classList.remove('active');

        navMenu.classList.remove('active');

        backdrop.classList.remove('active');

    });



    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {

        hamburger.classList.remove('active');

        navMenu.classList.remove('active');

        backdrop.classList.remove('active');

    }));

}



// ===== Smooth Scrolling =====

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

    anchor.addEventListener('click', function (e) {

            e.preventDefault();

            const targetId = link.getAttribute("href");

            if (targetId && targetId !== "#") {
              const target = document.querySelector(targetId);
              if (target) {
                target.scrollIntoView({ behavior: "smooth" });
              }
            }
        });

});



// ===== Navbar Scroll Effect =====

window.addEventListener('scroll', () => {

    const navbar = document.querySelector('.navbar');

    if (navbar) {

        if (window.scrollY > 100) {

            navbar.style.background = 'linear-gradient(135deg, rgba(245, 230, 211, 0.99) 0%, rgba(239, 235, 233, 0.99) 100%)';

            navbar.style.boxShadow = '0 4px 25px rgba(93, 64, 55, 0.15)';

    } else {

            navbar.style.background = 'linear-gradient(135deg, rgba(245, 230, 211, 0.98) 0%, rgba(239, 235, 233, 0.98) 100%)';

            navbar.style.boxShadow = '0 4px 20px rgba(93, 64, 55, 0.1)';

        }

    }

});



// ===== Contact Form =====

const contactForm = document.getElementById('contact-form');

if (contactForm) {

    contactForm.addEventListener('submit', function(e) {

    e.preventDefault();

        

        const successMessage = document.getElementById('success-message');

        const errorMessage = document.getElementById('error-message');

        if (successMessage) successMessage.style.display = 'none';

        if (errorMessage) errorMessage.style.display = 'none';

        

        const name = document.getElementById('contact-name').value.trim();

        const email = document.getElementById('contact-email').value.trim();

        const phone = document.getElementById('contact-phone').value.trim();

        const message = document.getElementById('contact-message').value.trim();

        

    if (!name || !email || !message) {

            alert('Bitte füllen Sie alle Pflichtfelder aus.');

        return;

    }

        
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {

            alert('Bitte geben Sie eine gültige E-Mail-Adresse ein.');

        return;

        }

        

        const submitButton = this.querySelector('button[type="submit"]');

        const originalText = submitButton.textContent;

        

        submitButton.textContent = 'Wird gesendet...';

        submitButton.disabled = true;

        

        const webhookData = {

            'ihr name': name,

            'ihre email': email,

            'ihre telefonnummer': phone || '',

            'ihre nachricht': message

        };

        

        fetch('https://n8n.srv1070777.hstgr.cloud/webhook/d6271044-14b4-4bd1-b026-df33608b4a20', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify(webhookData)

        })

        .then(response => {

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            return response.text().then(text => {

                try {

                    return JSON.parse(text);

                } catch {

                    return { success: true };

                }

            });

        })

        .then(data => {

            if (successMessage) {

                successMessage.style.display = 'block';

                successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

            }

            this.reset();

            console.log('Nachricht erfolgreich gesendet!', data);

        })

        .catch(error => {

            console.error('Fehler beim Senden:', error);

            if (errorMessage) {

                errorMessage.style.display = 'block';

                errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

            }

        })

        .finally(() => {

            submitButton.textContent = originalText;

            submitButton.disabled = false;

        });

    });

}



// ===== Scroll to Top Button =====

const scrollToTopBtn = document.createElement('button');

scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';

scrollToTopBtn.className = 'scroll-to-top';

scrollToTopBtn.style.cssText = `

    position: fixed;

    bottom: 20px;

    right: 20px;

    width: 50px;

    height: 50px;

    border-radius: 50%;

    background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);

    color: white;

    border: 2px solid rgba(255, 255, 255, 0.2);

    cursor: pointer;

    opacity: 0;

    visibility: hidden;

    transition: all 0.3s ease;

    z-index: 1000;

    font-size: 1.2rem;

    box-shadow: 0 5px 15px rgba(139, 69, 19, 0.3);

`;



document.body.appendChild(scrollToTopBtn);



window.addEventListener('scroll', () => {

    if (window.scrollY > 300) {

        scrollToTopBtn.style.opacity = '1';

        scrollToTopBtn.style.visibility = 'visible';

                } else {

        scrollToTopBtn.style.opacity = '0';

        scrollToTopBtn.style.visibility = 'hidden';

    }

});



scrollToTopBtn.addEventListener('click', () => {

    window.scrollTo({ top: 0, behavior: 'smooth' });

});



// ===== Cookie Banner =====

const cookieBanner = document.getElementById('cookie-banner');

const acceptCookiesBtn = document.getElementById('accept-cookies');

const declineCookiesBtn = document.getElementById('decline-cookies');



function checkCookieConsent() {

    const consent = localStorage.getItem('cookieConsent');

    if (!consent && cookieBanner) {

        setTimeout(() => {

            cookieBanner.classList.add('show');

        }, 2000);

    }

}



if (acceptCookiesBtn) {

    acceptCookiesBtn.addEventListener('click', () => {

        localStorage.setItem('cookieConsent', 'accepted');

        if (cookieBanner) cookieBanner.classList.remove('show');

    });

}



if (declineCookiesBtn) {

    declineCookiesBtn.addEventListener('click', () => {

        localStorage.setItem('cookieConsent', 'declined');

        if (cookieBanner) cookieBanner.classList.remove('show');

    });

}



// ===== Privacy & Impressum Modals =====

const privacyModal = document.getElementById('privacy-modal');

const privacyLink = document.getElementById('privacy-link');

const impressumModal = document.getElementById('impressum-modal');

const impressumLink = document.getElementById('impressum-link');

const closeModals = document.querySelectorAll('.close');



if (privacyLink && privacyModal) {

    privacyLink.addEventListener('click', (e) => {

        e.preventDefault();

        privacyModal.style.display = 'block';

        document.body.style.overflow = 'hidden';

    });

}



if (impressumLink && impressumModal) {

    impressumLink.addEventListener('click', (e) => {

        e.preventDefault();

        impressumModal.style.display = 'block';

        document.body.style.overflow = 'hidden';

    });

}



closeModals.forEach(closeBtn => {

    closeBtn.addEventListener('click', () => {

        if (privacyModal) privacyModal.style.display = 'none';

        if (impressumModal) impressumModal.style.display = 'none';

        document.body.style.overflow = 'auto';

    });

});



window.addEventListener('click', (e) => {

    if (e.target === privacyModal) {

        privacyModal.style.display = 'none';

        document.body.style.overflow = 'auto';

    }

    if (e.target === impressumModal) {

        impressumModal.style.display = 'none';

        document.body.style.overflow = 'auto';

    }

});



// ===== SUPABASE GALLERY =====

const SUPABASE_URL = 'https://oirmfkagzasujjlekvsw.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pcm1ma2FnemFzdWpqbGVrdnN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODcxMzIsImV4cCI6MjA4MDc2MzEzMn0.w9ae07N1tkev28L840lACS_nVIIRKFYXAk_8iu1ARg4';

const SUPABASE_BUCKET = 'bilder';



let supabaseClient = null;



// Dynamisch Supabase Script laden

function loadScriptOnce(src) {

    return new Promise((resolve, reject) => {

        if (document.querySelector(`script[src="${src}"]`)) {

            resolve();

            return;

        }

        const s = document.createElement('script');

        s.src = src;

        s.defer = true;

        s.onload = () => resolve();

        s.onerror = (err) => reject(err);

        document.head.appendChild(s);

    });

}



async function ensureSupabaseClient() {

    if (supabaseClient) return supabaseClient;

    if (typeof window === 'undefined') return null;

    
    
    if (!window.supabase) {

        try {

            await loadScriptOnce('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js');

        } catch (err) {

            console.error('❌ Supabase Script konnte nicht geladen werden:', err);

            return null;

        }

    }

    
    
    if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {

        try {

            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            console.log('✅ Supabase Client erfolgreich erstellt');

        } catch (err) {

            console.error('❌ Fehler beim Erstellen des Supabase Clients:', err);

        }

    } else {

        console.warn('⚠️ Supabase Client konnte nicht initialisiert werden');

    }

    
    
    return supabaseClient;

}



// Kategorie-Definitionen - Namen müssen EXAKT mit Supabase Ordnern übereinstimmen!

const galleryCategories = [

    { id: 'badezimmer', title: 'Badezimmer', storagePrefix: 'Badezimmer' },

    { id: 'bett', title: 'Bett', storagePrefix: 'Bett' },

    { id: 'esstisch', title: 'Esstisch', storagePrefix: 'Esstisch' },

    { id: 'gartenhaus', title: 'Gartenhaus', storagePrefix: 'Gartenhaus' },

    { id: 'kastenstiege', title: 'Kastenstiege', storagePrefix: 'Kastenstiege' },

    { id: 'kueche', title: 'Küche', storagePrefix: 'Kueche' },

    { id: 'spiegel', title: 'Spiegel', storagePrefix: 'Spiegel' },

    { id: 'stauraum', title: 'Stauraum', storagePrefix: 'Stauraum' },

    { id: 'stiege', title: 'Stiege', storagePrefix: 'Stiege' },

    { id: 'tor', title: 'Tor', storagePrefix: 'Tor' },

    { id: 'wohnzimmer', title: 'Wohnzimmer', storagePrefix: 'Wohnzimmer' },

];



const categoryImagesMap = new Map();



function isImagePath(path) {

    return /\.(png|jpe?g|webp|gif|bmp)$/i.test(path);

}



async function listSupabaseImagesFor(storagePrefix) {

    if (!supabaseClient) {

        console.warn('⚠️ Kein Supabase Client für:', storagePrefix);

        return [];

    }

    
    
    try {

        console.log(`🔍 Lade Dateien aus: ${storagePrefix}`);

        

        const { data, error } = await supabaseClient

            .storage

            .from(SUPABASE_BUCKET)

            .list(storagePrefix, { 

                limit: 100, 

                sortBy: { column: 'name', order: 'asc' } 

            });

        
        
        if (error) {

            console.error(`❌ Fehler beim Laden von ${storagePrefix}:`, error);

            return [];

        }

        

        console.log(`📦 Rohdaten von ${storagePrefix}:`, data);

        

        if (!data || data.length === 0) {

            console.warn(`⚠️ Keine Dateien in ${storagePrefix} gefunden`);

            return [];

        }

        

        // WICHTIG: Filtere NUR echte Bilder (haben eine ID)

        const files = data.filter((f) => {

            // Prüfe ob es eine echte Datei ist (hat ID und name)

            const isFile = f.id && f.name;

            // Prüfe ob es ein Bild ist

            const isImage = f.name && isImagePath(f.name);

            

            if (isFile && isImage) {

                console.log(`  ✅ Bild gefunden: ${f.name}`);

                return true;

            } else {

                console.log(`  ⏭️  Überspringe: ${f.name || 'Ordner'} (ID: ${f.id || 'keine'})`);

                return false;

            }

        });

        

        console.log(`✅ ${storagePrefix}: ${files.length} Bilder gefiltert`);

        
        
        return files.map((f) => ({ 

            path: `${storagePrefix}/${f.name}`, 

            name: f.name 

        }));

    } catch (err) {

        console.error(`❌ Exception beim Laden von ${storagePrefix}:`, err);

        return [];

    }

}



async function getSupabasePublicUrl(path) {

    if (!supabaseClient) return '';

    try {

        const { data } = supabaseClient.storage.from(SUPABASE_BUCKET).getPublicUrl(path);

        const url = data?.publicUrl || '';

        console.log(`🔗 URL: ${path} → ${url}`);

        return url;

    } catch (err) {

        console.error('❌ Fehler beim Abrufen der Public URL:', err);

        return '';

    }

}



async function preloadAllCategories() {

    console.log('🔄 Lade Kategorien von Supabase...');

    const client = await ensureSupabaseClient();

    
    
    if (!client) {

        console.warn('⚠️ Supabase Client nicht verfügbar. Galerie bleibt leer.');

        return;

    }

    
    
    const promises = galleryCategories.map(async (cat) => {

        try {

            const files = await listSupabaseImagesFor(cat.storagePrefix);

            

            if (files.length === 0) {

                console.warn(`⚠️ ${cat.title}: Keine Bilder gefunden`);

                categoryImagesMap.set(cat.id, []);

                return;

            }

            

            const images = await Promise.all(

                files.map(async (f) => ({

                    url: await getSupabasePublicUrl(f.path),

                    name: f.name,

                }))

            );

            

            const validImages = images.filter((img) => !!img.url);

            categoryImagesMap.set(cat.id, validImages);

            console.log(`✅ ${cat.title}: ${validImages.length} Bilder geladen`);

        } catch (err) {

            console.error(`❌ Fehler bei Kategorie ${cat.title}:`, err);

            categoryImagesMap.set(cat.id, []);

        }

    });

    
    
    await Promise.all(promises);

    

    const totalImages = Array.from(categoryImagesMap.values()).reduce((sum, imgs) => sum + imgs.length, 0);

    console.log(`✅ GESAMT: ${totalImages} Bilder aus ${galleryCategories.length} Kategorien geladen`);

}



function renderPortfolioCategories() {

    const portfolioGrid = document.getElementById('portfolio-grid');

    if (!portfolioGrid) {

        console.warn('⚠️ Portfolio Grid Element nicht gefunden!');

        return;

    }

    
    
    portfolioGrid.innerHTML = '';

    

    let renderedCount = 0;

    
    
    galleryCategories.forEach((category) => {

        const images = categoryImagesMap.get(category.id) || [];

        const cover = images[0]?.url || '';

        
        
        const item = document.createElement('div');

        item.className = 'portfolio-item';

        item.dataset.categoryId = category.id;

        

        if (cover) {
        
        item.innerHTML = `

                <img src="${cover}" alt="${category.title}" loading="lazy">

                <div class="portfolio-overlay">

                    <h3>${category.title}</h3>

                    <p>${images.length} Foto${images.length === 1 ? '' : 's'}</p>

                </div>

            `;

            renderedCount++;

        } else {

            item.innerHTML = `

                <div class="portfolio-placeholder">

                     <i class="fas fa-image"></i>

                     <p>${category.title}</p>

                </div>

            <div class="portfolio-overlay">

                <h3>${category.title}</h3>

                    <p>Keine Bilder</p>

            </div>

        `;
        
        }

        

        item.addEventListener('click', () => openLightbox(category));

        portfolioGrid.appendChild(item);

    });
    
    

    console.log(`✅ Portfolio gerendert: ${renderedCount}/${galleryCategories.length} Kategorien mit Bildern`);

}



// ===== LIGHTBOX =====

let currentCategory = null;

let currentIndex = 0;



const lightbox = document.getElementById('lightbox');

const lightboxImg = document.querySelector('.lightbox-image');

const lightboxTitle = document.querySelector('.lightbox-title');

const lightboxCounter = document.querySelector('.lightbox-counter');

const btnPrev = document.querySelector('.lightbox-prev');

const btnNext = document.querySelector('.lightbox-next');

const btnClose = document.querySelector('.lightbox-close');



function openLightbox(category) {

    const images = categoryImagesMap.get(category.id) || [];

    if (images.length === 0) {

        alert(`Keine Bilder in der Kategorie "${category.title}" gefunden.`);

        return;

    }
    
    

    currentCategory = category;

    currentIndex = 0;

    updateLightbox();
    
    if (lightbox) {

        lightbox.classList.add('show');

        lightbox.setAttribute('aria-hidden', 'false');

        document.body.style.overflow = 'hidden';

    }

}



function closeLightbox() {

    if (lightbox) {

        lightbox.classList.remove('show');

        lightbox.setAttribute('aria-hidden', 'true');

        document.body.style.overflow = 'auto';

    }

}



function updateLightbox() {

    if (!currentCategory) return;

    const images = categoryImagesMap.get(currentCategory.id) || [];

    if (!images.length) return;

    

    const total = images.length;

    const file = images[currentIndex];

    

    if (lightboxImg) lightboxImg.src = file.url;

    if (lightboxTitle) lightboxTitle.textContent = currentCategory.title;

    if (lightboxCounter) lightboxCounter.textContent = `${currentIndex + 1} / ${total}`;

}



function nextImage() {

    if (!currentCategory) return;

    const images = categoryImagesMap.get(currentCategory.id) || [];

    if (!images.length) return;

    currentIndex = (currentIndex + 1) % images.length;

    updateLightbox();

}



function prevImage() {

    if (!currentCategory) return;

    const images = categoryImagesMap.get(currentCategory.id) || [];

    if (!images.length) return;

    currentIndex = (currentIndex - 1 + images.length) % images.length;

    updateLightbox();

}



if (btnNext) btnNext.addEventListener('click', nextImage);

if (btnPrev) btnPrev.addEventListener('click', prevImage);

if (btnClose) btnClose.addEventListener('click', closeLightbox);



if (lightbox) {

    lightbox.addEventListener('click', (e) => {

        if (e.target === lightbox) closeLightbox();

    });

}



document.addEventListener('keydown', (e) => {

    if (!lightbox || lightbox.getAttribute('aria-hidden') === 'true') return;

    if (e.key === 'Escape') closeLightbox();

    if (e.key === 'ArrowRight') nextImage();

    if (e.key === 'ArrowLeft') prevImage();

});



// ===== Mobile Portfolio Toggle =====

function setupMobilePortfolioToggle() {

    const toggleBtn = document.getElementById('portfolio-toggle');

    const grid = document.getElementById('portfolio-grid');

    if (!toggleBtn || !grid) return;



    function applyInitialState() {

        if (window.innerWidth <= 768) {

            grid.classList.remove('open');

            toggleBtn.setAttribute('aria-expanded', 'false');

            toggleBtn.textContent = 'Kategorien anzeigen';

        } else {

            grid.classList.add('open');

            toggleBtn.setAttribute('aria-expanded', 'true');

            toggleBtn.textContent = 'Kategorien ausblenden';

        }

    }



    applyInitialState();



    toggleBtn.addEventListener('click', () => {

        if (window.innerWidth > 768) return;

        const isOpen = grid.classList.toggle('open');

        toggleBtn.setAttribute('aria-expanded', String(isOpen));

        toggleBtn.textContent = isOpen ? 'Kategorien ausblenden' : 'Kategorien anzeigen';

    });



    window.addEventListener('resize', applyInitialState);

}



// ===== Load Logo and Portrait from Supabase =====

async function loadLogoFromSupabase() {

    const client = await ensureSupabaseClient();

    if (!client) {

        console.warn('⚠️ Supabase Client nicht verfügbar. Logo bleibt lokal.');

        return;

    }

    

    try {

        console.log('🔄 Lade Logo von Supabase...');

        const files = await listSupabaseImagesFor('Logo');

        

        if (files.length === 0) {

            console.warn('⚠️ Kein Logo in Supabase gefunden');

            return;

        }

        

        // Nimm das erste Bild aus dem Logo-Ordner

        const logoUrl = await getSupabasePublicUrl(files[0].path);

        

        if (!logoUrl) {

            console.warn('⚠️ Logo-URL konnte nicht abgerufen werden');

            return;

        }

        

        console.log('✅ Logo geladen:', logoUrl);

        

        // Setze Logo in alle entsprechenden Elemente

        const navLogoImg = document.getElementById('nav-logo-img');

        const heroLogoImage = document.getElementById('hero-logo-image');

        const footerLogo = document.querySelector('.footer-logo img');

        const favicon = document.querySelector('link[rel="icon"]');

        

        if (navLogoImg) {

            navLogoImg.src = logoUrl;

            console.log('✅ Nav Logo gesetzt');

        }

        

        if (heroLogoImage) {

            heroLogoImage.src = logoUrl;

            console.log('✅ Hero Logo gesetzt');

        }

        

        if (footerLogo) {

            footerLogo.src = logoUrl;

            console.log('✅ Footer Logo gesetzt');

        }

        

        if (favicon) {

            favicon.href = logoUrl;

            console.log('✅ Favicon gesetzt');

        }

    } catch (err) {

        console.error('❌ Fehler beim Laden des Logos:', err);

    }

}



async function loadPortraitFromSupabase() {

    const client = await ensureSupabaseClient();

    if (!client) {

        console.warn('⚠️ Supabase Client nicht verfügbar. Portrait bleibt lokal.');

        return;

    }

    

    try {

        console.log('🔄 Lade Portrait von Supabase...');

        const files = await listSupabaseImagesFor('Portrait');

        

        if (files.length === 0) {

            console.warn('⚠️ Kein Portrait in Supabase gefunden');

            return;

        }

        

        // Nimm das erste Bild aus dem Portrait-Ordner

        const portraitUrl = await getSupabasePublicUrl(files[0].path);

        

        if (!portraitUrl) {

            console.warn('⚠️ Portrait-URL konnte nicht abgerufen werden');

            return;

        }

        

        console.log('✅ Portrait geladen:', portraitUrl);

        

        // Setze Portrait in das About-Bild

        const aboutImage = document.querySelector('.about-image .about-placeholder img');

        

        if (aboutImage) {

            aboutImage.src = portraitUrl;

            aboutImage.alt = 'Erfahrener Meister - Tischlerei Ochenbauer';

            console.log('✅ About Portrait gesetzt');

        } else {

            console.warn('⚠️ About-Bild Element nicht gefunden');

        }

    } catch (err) {

        console.error('❌ Fehler beim Laden des Portraits:', err);

    }

}



// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', async () => {

    console.log('🚀 Website wird initialisiert...');

    

    checkCookieConsent();

    setupMobilePortfolioToggle();

    

    // Lade Logo und Portrait von Supabase

    await loadLogoFromSupabase();

    await loadPortraitFromSupabase();

    

    await preloadAllCategories();

    renderPortfolioCategories();

    

    console.log('✅ Initialisierung abgeschlossen');

});
