// Kontaktformular → E-Mail an die Tischlerei, verschickt über das eigene Gmail-Konto (SMTP mit App-Passwort).
// Läuft als Vercel-Funktion neben der statischen Website, kein externer Formular-Dienst nötig.
// In Vercel unter Settings → Environment Variables eintragen:
//   GMAIL_USER          tischlerei.ochenbauer@gmail.com
//   GMAIL_APP_PASSWORD  16-stelliges App-Passwort aus dem Google-Konto
//   CONTACT_TO          (optional) andere Empfängeradresse
const nodemailer = require('nodemailer');

const ALLOWED_ORIGIN = /^https:\/\/(www\.)?tischlerei-ochenbauer\.at$|^https:\/\/tischlerei-gottfried-ochenbauer[a-z0-9-]*\.vercel\.app$|^http:\/\/localhost(:\d+)?$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Einzeilige Felder: Zeilenumbrüche raus, damit nichts in die Mail-Header rutscht
const line = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const text = (v, max) => String(v ?? '').replace(/\r\n?/g, '\n').trim().slice(0, max);

let transporter;
function getTransporter() {
    transporter ??= nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    return transporter;
}

async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ ok: false, error: 'method' });
    }
    const origin = req.headers.origin;
    if (origin && !ALLOWED_ORIGIN.test(origin)) return res.status(403).json({ ok: false, error: 'origin' });

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = null; }
    }
    if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, error: 'invalid' });

    // Honeypot: Bots füllen das versteckte Feld aus – so tun, als wäre alles gut
    if (body.website) return res.status(200).json({ ok: true });

    const name    = line(body.name, 120);
    const email   = line(body.email, 200);
    const phone   = line(body.phone, 60);
    const message = text(body.message, 5000);
    if (!name || !message || !EMAIL.test(email)) return res.status(400).json({ ok: false, error: 'invalid' });

    const { GMAIL_USER, GMAIL_APP_PASSWORD, CONTACT_TO } = process.env;
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return res.status(503).json({ ok: false, error: 'not-configured' });

    try {
        await handler.getTransporter().sendMail({
            from: { name: 'Website Tischlerei Ochenbauer', address: GMAIL_USER },
            to: CONTACT_TO || GMAIL_USER,
            replyTo: { name, address: email },
            subject: `Anfrage über die Website: ${name}`,
            text: [
                `Name: ${name}`,
                `E-Mail: ${email}`,
                ...(phone ? [`Telefon: ${phone}`] : []),
                '',
                message,
                '',
                '— Gesendet über das Kontaktformular auf www.tischlerei-ochenbauer.at. „Antworten“ schreibt direkt an den Absender.',
            ].join('\n'),
        });
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('Mailversand fehlgeschlagen:', err.message);
        return res.status(502).json({ ok: false, error: 'send' });
    }
}

handler.getTransporter = getTransporter;
module.exports = handler;
