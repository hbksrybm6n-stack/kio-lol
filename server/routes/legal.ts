import { Router } from 'express';
import db from '../db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

const defaultPages: Record<string, { title: string; content: string }> = {
  'tos': {
    title: 'Terms of Service',
    content: `# Terms of Service

Last updated: ${new Date().toISOString().split('T')[0]}

## 1. Acceptance of Terms
By accessing and using kio.lol, you accept and agree to be bound by these Terms of Service.

## 2. User Accounts
You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.

## 3. User Content
You retain ownership of content you create on kio.lol. By using our service, you grant us a limited license to display your content.

## 4. Prohibited Activities
You may not use kio.lol for any unlawful purpose, to harass others, or to distribute spam or malicious content.

## 5. Termination
We reserve the right to suspend or terminate accounts that violate these terms.

## 6. Disclaimer
kio.lol is provided "as is" without warranties of any kind.`,
  },
  'privacy': {
    title: 'Privacy Policy',
    content: `# Privacy Policy

Last updated: ${new Date().toISOString().split('T')[0]}

## 1. Information We Collect
- Account information (email, username)
- Profile data you choose to share
- Usage analytics (page views, clicks)
- IP addresses for security purposes

## 2. How We Use Your Information
- To provide and maintain our service
- To personalize your experience
- To protect against abuse

## 3. Data Security
We implement appropriate security measures to protect your personal information.

## 4. Cookies
We use cookies to maintain your session and improve your experience.

## 5. Data Retention
We retain your data for as long as your account is active or as needed to provide services.`,
  },
  'dmca': {
    title: 'DMCA Policy',
    content: `# DMCA Policy

Last updated: ${new Date().toISOString().split('T')[0]}

kio.lol respects the intellectual property rights of others. If you believe that content on our platform infringes your copyright, please submit a DMCA takedown request.`,
  },
  'impressum': {
    title: 'Impressum',
    content: `# Impressum

Last updated: ${new Date().toISOString().split('T')[0]}

## Service Provider
kio.lol is operated by the kio.lol team.

Contact: support@kio.lol`,
  },
  'cookie-policy': {
    title: 'Cookie Policy',
    content: `# Cookie Policy

Last updated: ${new Date().toISOString().split('T')[0]}

## What Are Cookies
Cookies are small text files stored on your device when you visit our website.

## How We Use Cookies
- Essential cookies for authentication
- Analytics cookies to understand usage patterns
- Preference cookies to remember your settings

## Managing Cookies
You can control cookie preferences through your browser settings.`,
  },
};

function ensureDefaultPages() {
  for (const [slug, page] of Object.entries(defaultPages)) {
    const existing = db.prepare('SELECT slug FROM legal_pages WHERE slug = ?').get(slug);
    if (!existing) {
      db.prepare('INSERT INTO legal_pages (slug, title, content) VALUES (?, ?, ?)').run(slug, page.title, page.content);
    }
  }
}

ensureDefaultPages();

router.get('/:slug', (req, res) => {
  try {
    const page = db.prepare('SELECT * FROM legal_pages WHERE slug = ?').get(req.params.slug) as any;
    if (!page) return res.status(404).json({ error: 'Page not found' });
    res.json(page);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:slug', authMiddleware, (req: AuthRequest, res) => {
  try {
    const admin = db.prepare('SELECT is_admin FROM profiles WHERE user_id = ?').get(req.userId!) as any;
    if (!admin?.is_admin) return res.status(403).json({ error: 'Forbidden' });

    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

    const existing = db.prepare('SELECT slug FROM legal_pages WHERE slug = ?').get(req.params.slug);
    if (existing) {
      db.prepare("UPDATE legal_pages SET title = ?, content = ?, updated_at = datetime('now') WHERE slug = ?").run(title, content, req.params.slug);
    } else {
      db.prepare('INSERT INTO legal_pages (slug, title, content) VALUES (?, ?, ?)').run(req.params.slug, title, content);
    }

    const page = db.prepare('SELECT * FROM legal_pages WHERE slug = ?').get(req.params.slug);
    res.json(page);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
