import { create } from 'zustand';
import { nanoid } from 'nanoid';

const SEED_PAGES = [
  {
    id: 'page-1',
    title: 'Getting Started',
    content: '<h2>Getting Started</h2><p>Welcome to the DevCollab project wiki. This space is used to document project decisions, architecture notes, and team processes.</p><h3>Quick Links</h3><ul><li>Project setup instructions</li><li>Contribution guidelines</li><li>Tech stack overview</li></ul>',
    updatedAt: new Date(Date.now() - 3600000*200).toISOString(),
  },
  {
    id: 'page-2',
    title: 'API Documentation',
    content: '<h2>API Documentation</h2><p>All REST endpoints follow the <strong>DRF</strong> standard. Authentication uses JWT tokens passed in the Authorization header.</p><h3>Base URL</h3><pre><code>https://api.devcollab.io/v1/</code></pre>',
    updatedAt: new Date(Date.now() - 3600000*150).toISOString(),
  },
  {
    id: 'page-3',
    title: 'Authentication Guide (OAuth)',
    content: '<h2>OAuth Authentication</h2><p>We are using Google and GitHub as OAuth providers. Flow:</p><ol><li>Frontend redirects to backend `/api/v1/auth/google/`</li><li>Backend redirects to provider</li><li>Provider returns to backend with code</li><li>Backend issues JWT tokens to frontend via cookie</li></ol>',
    updatedAt: new Date(Date.now() - 3600000*24).toISOString(),
  },
  {
    id: 'page-4',
    title: 'Payment Flow Design',
    content: '<h2>Razorpay Integration</h2><p>The checkout flow uses Razorpay standard checkout.</p><ul><li>Order is created on backend first.</li><li>Frontend uses Razorpay.js with the order ID.</li><li>Webhook at `/api/v1/webhooks/razorpay/` verifies signature.</li></ul>',
    updatedAt: new Date(Date.now() - 3600000*48).toISOString(),
  }
];

export const useWikiStore = create((set, get) => ({
  pages: SEED_PAGES,
  activePage: SEED_PAGES[0],

  setActivePage: (pageId) => {
    const page = get().pages.find((p) => p.id === pageId);
    if (page) set({ activePage: page });
  },

  createPage: (title) => {
    const page = {
      id: `page-${nanoid(6)}`,
      title: title || 'Untitled Page',
      content: `<h2>${title || 'Untitled Page'}</h2><p>Start writing...</p>`,
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ pages: [...state.pages, page], activePage: page }));
    return page;
  },

  updatePage: (pageId, updates) => {
    set((state) => {
      const pages = state.pages.map((p) =>
        p.id === pageId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      );
      const activePage = state.activePage?.id === pageId
        ? { ...state.activePage, ...updates }
        : state.activePage;
      return { pages, activePage };
    });
  },

  deletePage: (pageId) => {
    set((state) => {
      const pages = state.pages.filter((p) => p.id !== pageId);
      const activePage = state.activePage?.id === pageId ? pages[0] || null : state.activePage;
      return { pages, activePage };
    });
  },
}));
