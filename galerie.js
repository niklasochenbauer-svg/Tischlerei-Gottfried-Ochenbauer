// ═══════════════════════════════════════════════════════════
// GALERIE-DATEN — gemeinsam für Website (script.js) und Foto-Verwaltung (fotos.js)
//
// Fotos liegen im öffentlichen Supabase-Bucket „bilder“, ein Ordner pro Kategorie.
// Reihenfolge, Anzeigenamen und Titelbilder stehen in „_kategorien.json“ im selben
// Bucket. Fehlt die Datei, werden die Ordner automatisch erkannt.
// ═══════════════════════════════════════════════════════════

const Galerie = (() => {
    const SUPABASE_URL = 'https://oirmfkagzasujjlekvsw.supabase.co';
    const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pcm1ma2FnemFzdWpqbGVrdnN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODcxMzIsImV4cCI6MjA4MDc2MzEzMn0.w9ae07N1tkev28L840lACS_nVIIRKFYXAk_8iu1ARg4';
    const BUCKET       = 'bilder';
    const MANIFEST     = '_kategorien.json';
    const THUMB_SUFFIX = '__thumb';

    // Ordner, die keine Galerie-Kategorien sind
    const SYSTEM_FOLDERS = ['Logo', 'Portrait'];

    // Für automatisch erkannte Ordner: Reihenfolge und Anzeigenamen
    const DEFAULT_ORDER  = ['Stiege', 'Kueche', 'Esstisch', 'Wohnzimmer', 'Stauraum', 'Gartenhaus', 'Bett', 'Spiegel', 'Kastenstiege', 'Badezimmer', 'Tor'];
    const DEFAULT_TITLES = { Kueche: 'Küche' };

    const encodePath = path => path.split('/').map(encodeURIComponent).join('/');
    const publicUrl  = path => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodePath(path)}`;

    function headers(token) {
        return { apikey: ANON_KEY, Authorization: `Bearer ${token || ANON_KEY}` };
    }

    async function list(prefix, token) {
        const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
            method: 'POST',
            headers: { ...headers(token), 'Content-Type': 'application/json' },
            body: JSON.stringify({ prefix, limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } })
        });
        if (!res.ok) throw new Error(`Supabase ${res.status}`);
        return res.json();
    }

    const isThumb = name => name.replace(/\.[^.]+$/, '').endsWith(THUMB_SUFFIX);
    const thumbNameFor = name => name.replace(/(\.[^.]+)?$/, `${THUMB_SUFFIX}.webp`);
    const isImage = entry => entry.id && (
        entry.metadata?.mimetype?.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif)$/i.test(entry.name)
    );

    // Kategorien-Datei lesen (null, wenn es noch keine gibt)
    async function loadManifest(token) {
        try {
            const url = token
                ? `${SUPABASE_URL}/storage/v1/object/authenticated/${BUCKET}/${MANIFEST}`
                : `${publicUrl(MANIFEST)}?v=${Math.floor(Date.now() / 60000)}`;
            const res = await fetch(url, { headers: token ? headers(token) : {}, cache: 'no-store' });
            if (!res.ok) return null;
            const data = await res.json();
            return Array.isArray(data?.kategorien) ? data : null;
        } catch {
            return null;
        }
    }

    // Ordner im Bucket automatisch erkennen
    async function discover(token, entries) {
        entries = entries || await list('', token);
        const folders = entries
            .filter(e => !e.id && !SYSTEM_FOLDERS.includes(e.name))
            .map(e => e.name);
        const rank = name => { const i = DEFAULT_ORDER.indexOf(name); return i < 0 ? 999 : i; };
        folders.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, 'de'));
        return {
            kategorien: folders.map(ordner => ({
                ordner,
                titel: DEFAULT_TITLES[ordner] || ordner.replace(/[-_]+/g, ' ')
            }))
        };
    }

    // Kategorien-Datei nur abrufen, wenn sie im Bucket liegt (spart eine
    // fehlschlagende Anfrage); sonst die Ordner selbst erkennen.
    // `gespeichert` sagt, ob es die Datei schon gibt.
    async function loadCategories(token) {
        const entries = await list('', token);
        if (entries.some(e => e.id && e.name === MANIFEST)) {
            const manifest = await loadManifest(token);
            if (manifest) return { ...manifest, gespeichert: true };
        }
        return { ...(await discover(token, entries)), gespeichert: false };
    }

    // Fotos einer Kategorie inkl. Vorschaubild (falls vorhanden)
    async function loadPhotos(ordner, token) {
        const entries = (await list(ordner, token)).filter(isImage);
        const names = new Set(entries.map(e => e.name));
        return entries
            .filter(e => !isThumb(e.name))
            .map(e => {
                const thumb = thumbNameFor(e.name);
                return {
                    name: e.name,
                    path: `${ordner}/${e.name}`,
                    url: publicUrl(`${ordner}/${e.name}`),
                    thumb: names.has(thumb) ? publicUrl(`${ordner}/${thumb}`) : publicUrl(`${ordner}/${e.name}`),
                    thumbPath: names.has(thumb) ? `${ordner}/${thumb}` : null,
                    created: e.created_at
                };
            });
    }

    return {
        SUPABASE_URL, ANON_KEY, BUCKET, MANIFEST, SYSTEM_FOLDERS, THUMB_SUFFIX,
        headers, list, publicUrl, encodePath, thumbNameFor,
        loadManifest, discover, loadCategories, loadPhotos
    };
})();
