require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const supabase = require('../supabaseClient');

const app = express();
const PORT = process.env.PORT || 3001;
const PRODUCTS_FILE = path.join(__dirname, '..', 'js', 'products.js');

// ==============================
// Multer — memory storage (Vercel-compatible)
// ==============================
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Тільки зображення!'));
    }
});

// ==============================
// Middleware
// ==============================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==============================
// Dynamic Route: /js/products.js
// ==============================
app.get('/js/products.js', async (req, res, next) => {
    if (!supabase) return next();
    try {
        const { data, error } = await supabase
            .from('products')
            .select('data')
            .order('data->title', { ascending: true });
        if (error) throw error;

        const products = data.map(row => row.data);
        const content = `const productsData = ${JSON.stringify(products, null, 2)};`;
        res.set('Content-Type', 'application/javascript; charset=utf-8');
        res.set('Cache-Control', 'no-cache');
        res.send(content);
    } catch (e) {
        console.error('Supabase fetch failed, falling back to local file:', e.message);
        next(); // serve local js/products.js instead
    }
});

// ==============================
// Dynamic Route: /sitemap.xml
// ==============================
app.get('/sitemap.xml', async (req, res) => {
    const BASE = 'https://project-1ra3d.vercel.app';
    const today = new Date().toISOString().slice(0, 10);

    const staticUrls = [
        { loc: `${BASE}/`,                          priority: '1.0', freq: 'weekly'  },
        { loc: `${BASE}/privacy-policy.html`,       priority: '0.3', freq: 'monthly' },
        { loc: `${BASE}/shipping-returns.html`,     priority: '0.3', freq: 'monthly' },
        { loc: `${BASE}/terms-of-use.html`,         priority: '0.3', freq: 'monthly' },
    ];

    let productUrls = [];
    if (supabase) {
        try {
            const { data } = await supabase.from('products').select('data');
            if (data) {
                productUrls = data
                    .filter(r => !r.data.hidden)
                    .map(r => ({
                        loc: `${BASE}/product.html?id=${encodeURIComponent(r.data.id)}`,
                        priority: '0.8',
                        freq: 'weekly'
                    }));
            }
        } catch (e) {
            console.warn('Sitemap: Supabase error, products will be skipped:', e.message);
        }
    }

    const allUrls = [...staticUrls, ...productUrls];
    const urlEntries = allUrls.map(u => `
  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('');

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}\n</urlset>`);
});

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// ==============================
// Auth & Rate-limiting middleware
// ==============================
const requireAdmin = (req, res, next) => {
    const providedPassword = req.headers['x-admin-password'] || req.query.admin_password;
    if (process.env.ADMIN_PASSWORD && providedPassword !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, error: 'Неавторизовано: Невірний пароль.' });
    }
    next();
};

const rateLimitWindowMs = 15 * 60 * 1000;
const maxRequestsPerWindow = 5;
const ipRequestCounts = new Map();

const checkoutRateLimiter = (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();

    if (!ipRequestCounts.has(ip)) {
        ipRequestCounts.set(ip, { count: 1, windowStart: now });
        return next();
    }

    const record = ipRequestCounts.get(ip);
    if (now - record.windowStart > rateLimitWindowMs) {
        record.count = 1;
        record.windowStart = now;
        return next();
    }
    if (record.count >= maxRequestsPerWindow) {
        return res.status(429).json({ success: false, error: 'Забагато запитів. Зачекайте 15 хвилин.' });
    }
    record.count++;
    next();
};

// ==============================
// API: Get all products
// ==============================
app.get('/api/products', async (req, res) => {
    if (supabase) {
        try {
            const { data, error } = await supabase.from('products').select('data');
            if (error) throw error;
            return res.json({ success: true, products: data.map(r => r.data) });
        } catch (e) {
            console.error('Supabase read failed, falling back to local file:', e.message);
        }
    }

    try {
        const content = fs.readFileSync(PRODUCTS_FILE, 'utf8');
        const match = content.match(/const productsData\s*=\s*(\[[\s\S]*\]);/);
        const products = match ? JSON.parse(match[1]) : [];
        res.json({ success: true, products });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ==============================
// API: Save all products
// ==============================
app.post('/api/products', requireAdmin, async (req, res) => {
    try {
        const products = req.body;
        if (!Array.isArray(products)) {
            return res.status(400).json({ success: false, error: 'Expected array of products' });
        }

        // Save to Supabase
        if (supabase) {
            // Determine which rows were removed
            try {
                const { data: currentIdsData, error: fetchError } = await supabase.from('products').select('id');
                if (fetchError) throw fetchError;

                const currentIds = currentIdsData ? currentIdsData.map(r => r.id) : [];
                const newIds = products.map(p => String(p.id));
                const idsToDelete = currentIds.filter(id => !newIds.includes(id));

                if (idsToDelete.length > 0) {
                    const { error: delError } = await supabase.from('products').delete().in('id', idsToDelete);
                    if (delError) throw delError;
                }

                if (products.length > 0) {
                    const rows = products.map(p => ({ id: String(p.id), data: p }));
                    const { error: upsertError } = await supabase.from('products').upsert(rows);
                    if (upsertError) throw upsertError;
                }
            } catch (sbErr) {
                console.error('❌ Supabase Error:', sbErr.message);
                return res.status(500).json({ success: false, error: 'Supabase: ' + sbErr.message });
            }
        }

        try {
            const content = `const productsData = ${JSON.stringify(products, null, 2)};`;
            fs.writeFileSync(PRODUCTS_FILE, content, 'utf8');
        } catch (_) {}

        res.json({ success: true, count: products.length });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ==============================
// API: Checkout
// ==============================
const TG_TOKEN = process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;

app.post('/api/checkout', checkoutRateLimiter, async (req, res) => {
    try {
        const { name, phone, items, total } = req.body;

        let message = `📦 *НОВЕ ЗАМОВЛЕННЯ!*\n\n`;
        message += `👤 *Клієнт:* ${name}\n`;
        message += `📞 *Телефон:* ${phone}\n`;
        message += `\n🛒 *Товари:*\n`;

        items.forEach((item, idx) => {
            message += `${idx + 1}. ${item.title} ${item.qty > 1 ? '(' + item.qty + ' шт.)' : ''} — ${item.price}\n`;
        });

        message += `\n💰 *РАЗОМ:* ${total}\n---`;

        const tgResp = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TG_CHAT_ID, text: message, parse_mode: 'Markdown' })
        });

        const tgRes = await tgResp.json();
        if (tgRes.ok) {
            res.json({ success: true });
        } else {
            res.status(500).json({ success: false, error: 'Telegram API error' });
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ==============================
// API: Proxy
// ==============================
app.get('/api/proxy', requireAdmin, async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const content = await resp.text();
        res.set('Content-Type', 'text/plain');
        res.send(content);
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ==============================
// API: Upload image
// ==============================
app.post('/api/upload', requireAdmin, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: 'Файл не отримано' });

    if (supabase) {
        try {
            const ext = path.extname(req.file.originalname) || '.jpg';
            const filename = `${Date.now()}-${Math.round(Math.random() * 1000)}${ext}`;

            const { error } = await supabase.storage
                .from('product-images')
                .upload(filename, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filename);

            return res.json({ success: true, url: publicUrl });
        } catch (e) {
            return res.status(500).json({ success: false, error: 'Помилка завантаження зображення: ' + e.message });
        }
    }

    try {
        const UPLOAD_DIR = path.join(__dirname, '..', 'img', 'products');
        if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

        const ext = path.extname(req.file.originalname);
        const filename = `${Date.now()}-${Math.round(Math.random() * 1000)}${ext}`;
        fs.writeFileSync(path.join(UPLOAD_DIR, filename), req.file.buffer);
        res.json({ success: true, url: 'img/products/' + filename });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Сервер запущено на порту ${PORT}`);
});

module.exports = app;
