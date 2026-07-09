import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Personal Finance Backend',
  description: 'API and domain documentation for the two-person household finance backend.',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/overview' },
      { text: 'API', link: '/api/' },
      { text: 'Product contract', link: '/product-context' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Overview', link: '/guide/overview' },
          { text: 'Authentication', link: '/guide/authentication' },
          { text: 'API conventions', link: '/guide/api-conventions' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Endpoint index', link: '/api/' },
          { text: 'Health', link: '/api/health' },
          { text: 'Auth', link: '/api/auth' },
          { text: 'Households', link: '/api/households' },
          { text: 'Categories', link: '/api/categories' },
          { text: 'Cash transactions', link: '/api/cash-transactions' },
          { text: 'Credit cards', link: '/api/credit-cards' },
          { text: 'Installments', link: '/api/installments' },
          { text: 'Assets', link: '/api/assets' },
          { text: 'Savings', link: '/api/savings' },
          { text: 'Reports', link: '/api/reports' },
        ],
      },
      {
        text: 'Context',
        items: [{ text: 'Product context', link: '/product-context' }],
      },
    ],
    search: { provider: 'local' },
  },
});
