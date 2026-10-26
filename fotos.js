// ═══════════════════════════════════════════════════════════
// FOTO-VERWALTUNG — fotos.html
// Anmeldung über Supabase Auth, Upload in den Bucket „bilder“.
// Schreibrechte regelt supabase/foto-admin.sql (nur freigegebene E-Mails).
// ═══════════════════════════════════════════════════════════

const { SUPABASE_URL, ANON_KEY, BUCKET, MANIFEST } = Galerie;
const SESSION_KEY = 'tischlerei-fotos-session';
const FULL_SIZE   = 2000;   // längste Seite des Galeriefotos in px
const THUMB_SIZE  = 800;    // längste Seite des Vorschaubilds in px
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let session  = null;          // { access_token, refresh_token, expires_at, email }
let manifest = null;          // { kategorien: [{ ordner, titel, titelbild?, versteckt? }] }
const photos = new Map();     // ordner → Foto-Liste
let queue    = [];            // Upload-Warteschlange


// ── Kleine Helfer ──────────────────────────────────────────
let toastTimer;
function toast(text, type = 'ok') {
    const el = $('toast');
    el.textContent = text;
    el.dataset.type = type;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('is-visible'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        el.classList.remove('is-visible');
        setTimeout(() => { el.hidden = true; }, 300);
    }, type === 'error' ? 6000 : 2800);
}

function setBusy(button, busy, label) {
    button.disabled = busy;
    button.toggleAttribute('aria-busy', busy);
    const l = button.querySelector('.btn-label');
    if (l && label) l.textContent = label;
}

// Mit View Transition umbauen, wenn verfügbar (z. B. beim Umsortieren)
function morph(update) {
    if (!reduceMotion && document.startViewTransition) document.startViewTransition(update);
    else update();
}

function slugify(text) {
    return text.trim()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
        .replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue').replace(/ß/g, 'ss')
        .normalize('NFKD').replace(/[̀-ͯ]/g, '')
        .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        .slice(0, 60);
}


// ── Anmeldung ──────────────────────────────────────────────
async function auth(path, body, token) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
        method: path === 'user' ? 'PUT' : 'POST',
        headers: { apikey: ANON_KEY, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.error_description || data.msg || data.message || `Fehler ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return data;
}

function storeSession(data) {
    session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in || 3600) * 1000,
        email: data.user?.email || session?.email
    };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
}

function clearSession() {
    session = null;
    try { localStorage.removeItem(SESSION_KEY); } catch {}
}

async function token() {
    if (!session) throw new Error('Nicht angemeldet');
    if (Date.now() > session.expires_at - 60_000) {
        try {
            storeSession(await auth('token?grant_type=refresh_token', { refresh_token: session.refresh_token }));
        } catch {
            clearSession();
            showLogin('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
            throw new Error('Sitzung abgelaufen');
        }
    }
    return session.access_token;
}

async function checkAdmin() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/is_foto_admin`, {
        method: 'POST',
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
        body: '{}'
    });
    if (res.status === 404) return 'missing';
    if (!res.ok) return 'error';
    return (await res.json()) === true ? 'ok' : 'denied';
}

function showLogin(message = '') {
    $('app-view').hidden = true;
    $('logout').hidden = true;
    $('login-view').hidden = false;
    $('login-msg').textContent = message;
}

async function enterApp() {
    const status = await checkAdmin();
    if (status === 'missing') {
        showLogin('Die Foto-Verwaltung ist noch nicht eingerichtet. Bitte einmalig supabase/foto-admin.sql im Supabase-SQL-Editor ausführen.');
        return;
    }
    if (status === 'denied') {
        showLogin(`Das Konto ${session.email || ''} ist nicht für die Foto-Verwaltung freigeschaltet.`);
        return;
    }
    $('login-view').hidden = true;
    $('app-view').hidden = false;
    $('logout').hidden = false;
    await loadAll();
}

$('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('login-email').value.trim();
    const password = $('login-password').value;
    if (!email || !password) { $('login-msg').textContent = 'Bitte E-Mail-Adresse und Passwort eingeben.'; return; }
    const btn = e.submitter || $('login-form').querySelector('button[type=submit]');
    setBusy(btn, true, 'Anmelden …');
    $('login-msg').textContent = '';
    try {
        storeSession(await auth('token?grant_type=password', { email, password }));
        $('login-password').value = '';
        await enterApp();
    } catch (err) {
        $('login-msg').textContent = err.status === 400
            ? 'E-Mail-Adresse oder Passwort stimmt nicht.'
            : 'Anmeldung gerade nicht möglich. Bitte später erneut versuchen.';
    } finally {
        setBusy(btn, false, 'Anmelden');
    }
});

$('forgot').addEventListener('click', async () => {
    const email = $('login-email').value.trim();
    if (!email) { $('login-msg').textContent = 'Bitte zuerst Ihre E-Mail-Adresse eingeben.'; $('login-email').focus(); return; }
    try {
        const redirect = encodeURIComponent(location.origin + location.pathname);
        await auth(`recover?redirect_to=${redirect}`, { email });
        $('login-msg').textContent = 'Falls das Konto existiert, kommt gleich eine E-Mail mit einem Link zum Zurücksetzen.';
    } catch {
        $('login-msg').textContent = 'Das hat nicht geklappt. Bitte später erneut versuchen.';
    }
});

$('reset-form').addEventListener('submit', async e => {
    e.preventDefault();
    const password = $('new-password').value;
    if (password.length < 8) { $('login-msg').textContent = 'Das Passwort braucht mindestens 8 Zeichen.'; return; }
    try {
        await auth('user', { password }, session.access_token);
        $('reset-form').hidden = true;
        $('login-form').hidden = false;
        toast('Neues Passwort gespeichert.');
        await enterApp();
    } catch (err) {
        $('login-msg').textContent = `Passwort konnte nicht gespeichert werden: ${err.message}`;
    }
});

$('logout').addEventListener('click', async () => {
    try { await auth('logout', {}, session?.access_token); } catch {}
    clearSession();
    showLogin('Sie wurden abgemeldet.');
});


// ── Daten laden & speichern ────────────────────────────────
async function loadAll() {
    $('category-list').setAttribute('aria-busy', 'true');
    const t = await token();
    manifest = await Galerie.loadCategories(t);
    await Promise.all(manifest.kategorien.map(async c => {
        try { photos.set(c.ordner, await Galerie.loadPhotos(c.ordner, t)); }
        catch { photos.set(c.ordner, []); }
    }));
    renderCategorySelect();
    renderCategories();
}

async function storage(method, path, body, extraHeaders = {}) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}${path ? '/' + Galerie.encodePath(path) : ''}`, {
        method,
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${await token()}`, ...extraHeaders },
        body
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const err = new Error(data.message || data.error || `Fehler ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return res;
}

let saveTimer;
function saveManifest(immediate = false) {
    clearTimeout(saveTimer);
    const run = async () => {
        try {
            await storage('POST', MANIFEST, JSON.stringify({ version: 1, kategorien: manifest.kategorien }, null, 2), {
                'Content-Type': 'application/json',
                'x-upsert': 'true',
                'cache-control': 'max-age=60'
            });
            manifest.gespeichert = true;
            toast('Gespeichert – auf der Website sichtbar in etwa einer Minute.');
        } catch (err) {
            toast(`Speichern fehlgeschlagen: ${err.message}`, 'error');
        }
    };
    if (immediate) return run();
    saveTimer = setTimeout(run, 600);
}


// ── Bilder verkleinern ─────────────────────────────────────
async function resize(file, maxSide) {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const toBlob = (type, q) => new Promise(r => canvas.toBlob(r, type, q));
    let blob = await toBlob('image/webp', 0.82);
    if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg', 0.86); // ältere Safari-Versionen
    canvas.width = canvas.height = 0;
    return blob;
}


// ── Upload ─────────────────────────────────────────────────
function renderCategorySelect() {
    const select = $('upload-category');
    const previous = select.value;
    select.innerHTML = manifest.kategorien
        .map(c => `<option value="${esc(c.ordner)}">${esc(c.titel || c.ordner)}</option>`)
        .join('');
    if (previous && manifest.kategorien.some(c => c.ordner === previous)) select.value = previous;
}

function renderQueue() {
    const list = $('upload-queue');
    list.innerHTML = queue.map((item, i) => `
        <li class="queue-item" data-state="${item.state}">
            <img src="${item.preview}" alt="">
            <span class="queue-name">${esc(item.file.name)}</span>
            <span class="queue-state">${{
                wait: 'bereit',
                work: 'wird verkleinert …',
                send: 'wird hochgeladen …',
                done: 'fertig',
                fail: esc(item.error || 'Fehler')
            }[item.state]}</span>
            ${item.state === 'wait' ? `<button type="button" class="icon-btn" data-remove="${i}" aria-label="${esc(item.file.name)} entfernen"><svg class="icon" aria-hidden="true"><use href="#i-trash"/></svg></button>` : ''}
        </li>`).join('');
    const waiting = queue.filter(q => q.state === 'wait').length;
    $('upload-btn').disabled = !waiting;
    $('upload-btn').querySelector('.btn-label').textContent = waiting
        ? `${waiting} ${waiting === 1 ? 'Foto' : 'Fotos'} hochladen`
        : 'Hochladen';
}

function addFiles(files) {
    const images = [...files].filter(f => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
    if (!images.length) { toast('Bitte Bilddateien auswählen (JPG, PNG, WebP).', 'error'); return; }
    queue = queue.filter(q => q.state !== 'done');
    images.forEach(file => queue.push({ file, state: 'wait', preview: URL.createObjectURL(file) }));
    renderQueue();
}

$('file-input').addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });
$('upload-queue').addEventListener('click', e => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    const [item] = queue.splice(Number(btn.dataset.remove), 1);
    URL.revokeObjectURL(item.preview);
    renderQueue();
});

const dropzone = $('dropzone');
['dragenter', 'dragover'].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('is-over'); }));
['dragleave', 'drop'].forEach(ev => dropzone.addEventListener(ev, () => dropzone.classList.remove('is-over')));
dropzone.addEventListener('drop', e => { e.preventDefault(); addFiles(e.dataTransfer.files); });

$('upload-btn').addEventListener('click', async () => {
    const ordner = $('upload-category').value;
    if (!ordner) { toast('Bitte zuerst eine Kategorie anlegen.', 'error'); return; }
    const btn = $('upload-btn');
    setBusy(btn, true, 'Lädt hoch …');
    let ok = 0;

    for (const item of queue.filter(q => q.state === 'wait')) {
        try {
            item.state = 'work'; renderQueue();
            const [full, thumb] = [await resize(item.file, FULL_SIZE), await resize(item.file, THUMB_SIZE)];
            const ext = full.type === 'image/webp' ? 'webp' : 'jpg';
            const base = `${slugify(item.file.name.replace(/\.[^.]+$/, '')) || 'foto'}-${Date.now().toString(36)}`;
            const name = `${base}.${ext}`;

            item.state = 'send'; renderQueue();
            const opts = type => ({ 'Content-Type': type, 'cache-control': 'max-age=31536000', 'x-upsert': 'false' });
            await storage('POST', `${ordner}/${name}`, full, opts(full.type));
            await storage('POST', `${ordner}/${Galerie.thumbNameFor(name)}`, thumb, opts(thumb.type));
            item.state = 'done'; ok += 1;
        } catch (err) {
            item.state = 'fail';
            item.error = err.status === 403 ? 'keine Berechtigung'
                : /decode|source|bitmap/i.test(err.message) ? 'Format nicht lesbar (bitte als JPG speichern)'
                : 'Upload fehlgeschlagen';
            console.error(err);
        }
        renderQueue();
    }

    setBusy(btn, false);
    renderQueue();
    if (ok) {
        photos.set(ordner, await Galerie.loadPhotos(ordner, await token()));
        if (!manifest.gespeichert) await saveManifest(true); // erste Kategorien-Datei anlegen
        renderCategories();
        toast(`${ok} ${ok === 1 ? 'Foto' : 'Fotos'} hochgeladen.`);
    }
});


// ── Kategorien & Fotos ordnen ──────────────────────────────
function renderCategories() {
    const list = $('category-list');
    const open = new Set([...list.querySelectorAll('details[open]')].map(d => d.dataset.ordner));
    list.innerHTML = manifest.kategorien.map((c, i) => {
        const items = photos.get(c.ordner) || [];
        const cover = c.titelbild || items[0]?.name;
        return `
        <li class="category" style="view-transition-name: cat-${esc(slugify(c.ordner) || i)}" data-index="${i}">
            <div class="category-row">
                <img class="category-cover" src="${items.find(p => p.name === cover)?.thumb || ''}" alt="" ${items.length ? '' : 'hidden'}>
                <div class="category-main">
                    <label class="sr-only" for="title-${i}">Name der Kategorie</label>
                    <input class="category-title" id="title-${i}" value="${esc(c.titel || c.ordner)}" data-title="${i}">
                    <span class="category-meta">${items.length} ${items.length === 1 ? 'Foto' : 'Fotos'}${c.versteckt ? ' · ausgeblendet' : ''}${i === 0 ? ' · groß angezeigt' : ''}</span>
                </div>
                <div class="category-actions">
                    <button type="button" class="icon-btn" data-move="${i}" data-dir="-1" aria-label="${esc(c.titel)} nach oben" ${i === 0 ? 'disabled' : ''}><svg class="icon" aria-hidden="true"><use href="#i-up"/></svg></button>
                    <button type="button" class="icon-btn" data-move="${i}" data-dir="1" aria-label="${esc(c.titel)} nach unten" ${i === manifest.kategorien.length - 1 ? 'disabled' : ''}><svg class="icon" aria-hidden="true"><use href="#i-down"/></svg></button>
                    <button type="button" class="icon-btn${c.versteckt ? ' is-active' : ''}" data-hide="${i}" aria-pressed="${!!c.versteckt}" aria-label="${esc(c.titel)} auf der Website ausblenden"><svg class="icon" aria-hidden="true"><use href="#i-eye-off"/></svg></button>
                </div>
            </div>
            <details data-ordner="${esc(c.ordner)}" ${open.has(c.ordner) ? 'open' : ''}>
                <summary>Fotos anzeigen</summary>
                ${items.length ? `<ul class="photo-grid">${items.map(p => `
                    <li class="photo${p.name === cover ? ' is-cover' : ''}">
                        <img src="${p.thumb}" alt="" loading="lazy">
                        <div class="photo-actions">
                            <button type="button" class="icon-btn" data-cover="${i}" data-name="${esc(p.name)}" aria-pressed="${p.name === cover}" aria-label="Als Titelbild verwenden"><svg class="icon" aria-hidden="true"><use href="#i-star"/></svg></button>
                            <button type="button" class="icon-btn icon-btn--danger" data-delete="${i}" data-name="${esc(p.name)}" aria-label="Foto löschen"><svg class="icon" aria-hidden="true"><use href="#i-trash"/></svg></button>
                        </div>
                    </li>`).join('')}</ul>`
                : `<p class="admin-hint">Noch keine Fotos. ${c.versteckt ? '' : 'Leere Kategorien erscheinen nicht auf der Website.'}
                    <button type="button" class="admin-link admin-link--danger" data-remove-cat="${i}">Kategorie entfernen</button></p>`}
            </details>
        </li>`;
    }).join('');
    list.setAttribute('aria-busy', 'false');
}

$('category-list').addEventListener('change', e => {
    const i = e.target.dataset.title;
    if (i === undefined) return;
    const value = e.target.value.trim();
    if (!value) { e.target.value = manifest.kategorien[i].titel; return; }
    manifest.kategorien[i].titel = value;
    renderCategorySelect();
    saveManifest();
});

$('category-list').addEventListener('click', async e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const d = btn.dataset;

    if (d.move !== undefined) {
        const i = Number(d.move), j = i + Number(d.dir);
        morph(() => {
            const cats = manifest.kategorien;
            [cats[i], cats[j]] = [cats[j], cats[i]];
            renderCategories();
            renderCategorySelect();
        });
        saveManifest();
    }

    if (d.hide !== undefined) {
        const c = manifest.kategorien[d.hide];
        c.versteckt = !c.versteckt || undefined;
        renderCategories();
        saveManifest();
    }

    if (d.cover !== undefined) {
        manifest.kategorien[d.cover].titelbild = d.name;
        renderCategories();
        saveManifest();
    }

    if (d.delete !== undefined) {
        const c = manifest.kategorien[d.delete];
        const photo = (photos.get(c.ordner) || []).find(p => p.name === d.name);
        if (!photo || !confirm('Dieses Foto endgültig löschen?')) return;
        btn.disabled = true;
        try {
            await storage('DELETE', '', JSON.stringify({ prefixes: [photo.path, photo.thumbPath].filter(Boolean) }), { 'Content-Type': 'application/json' });
            photos.set(c.ordner, (photos.get(c.ordner) || []).filter(p => p.name !== d.name));
            if (c.titelbild === d.name) { delete c.titelbild; saveManifest(); }
            renderCategories();
            toast('Foto gelöscht.');
        } catch (err) {
            btn.disabled = false;
            toast(`Löschen fehlgeschlagen: ${err.message}`, 'error');
        }
    }

    if (d.removeCat !== undefined) {
        const c = manifest.kategorien[d.removeCat];
        if (!confirm(`Kategorie „${c.titel}“ entfernen?`)) return;
        morph(() => {
            manifest.kategorien.splice(Number(d.removeCat), 1);
            renderCategories();
            renderCategorySelect();
        });
        saveManifest();
    }
});

$('add-category').addEventListener('click', () => {
    const titel = prompt('Name der neuen Kategorie (z. B. „Haustüren“):')?.trim();
    if (!titel) return;
    let ordner = slugify(titel) || 'Kategorie';
    while (manifest.kategorien.some(c => c.ordner.toLowerCase() === ordner.toLowerCase())) ordner += '-2';
    manifest.kategorien.push({ ordner, titel });
    photos.set(ordner, []);
    renderCategories();
    renderCategorySelect();
    $('upload-category').value = ordner;
    saveManifest();
    toast(`Kategorie „${titel}“ angelegt – jetzt Fotos hochladen.`);
});


// ── Start ──────────────────────────────────────────────────
(async function init() {
    // Rückkehr aus der „Passwort vergessen“-E-Mail
    const hash = new URLSearchParams(location.hash.slice(1));
    if (hash.get('type') === 'recovery' && hash.get('access_token')) {
        storeSession({ access_token: hash.get('access_token'), refresh_token: hash.get('refresh_token'), expires_in: Number(hash.get('expires_in')) || 3600 });
        history.replaceState(null, '', location.pathname);
        $('login-form').hidden = true;
        $('reset-form').hidden = false;
        $('login-msg').textContent = 'Bitte vergeben Sie ein neues Passwort.';
        return;
    }

    try { session = JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { session = null; }
    if (!session?.refresh_token) { showLogin(); return; }
    try {
        await token();
        await enterApp();
    } catch {
        showLogin();
    }
})();
