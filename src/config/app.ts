/**
 * Product configuration. Nothing here is final: the app name, pricing, trial terms
 * and Scripture licensing are intentionally configurable rather than hard-coded.
 */
export const appConfig = {
  /** Working title only — the product name is still TBD. */
  appName: 'Selah',
  tagline: "The Bible, explained for the life you're actually living.",

  /**
   * Translations the app knows about. Only `available` ones can be selected, and each
   * needs verified text in content/scripture/<code>.json for every reference.
   */
  translations: [
    {
      code: 'NKJV',
      name: 'New King James Version',
      available: true,
      license: '© 1982 Thomas Nelson',
      attribution:
        'Scripture taken from the New King James Version®. Copyright © 1982 by Thomas Nelson. Used by permission. All rights reserved.',
    },
    {
      code: 'KJV',
      name: 'King James Version',
      available: true,
      license: 'Public domain',
      attribution: 'King James Version (public domain).',
    },
    {
      code: 'WEB',
      name: 'World English Bible',
      available: true,
      license: 'Public domain',
      attribution: 'World English Bible (public domain).',
    },
    {
      code: 'NLT',
      name: 'New Living Translation',
      available: false,
      license: 'Requires Tyndale House license',
      attribution: '',
    },
  ],
  defaultTranslation: 'NKJV',

  premium: {
    productName: 'Go Deeper',
    /** Display-only prototype pricing — wire to a store/billing provider in Phase 2. */
    priceMonthly: '$4.99',
    priceYearly: '$39.99',
    trialDays: 7,
    features: [
      'Personal, Scripture-grounded study on any card',
      'Ask follow-up questions in your own words',
      'Explore historical and literary context',
      'Guided reflections and saved study history',
    ],
  },

  share: {
    /** Public origin used to build deep links when sharing. */
    webOrigin: 'https://biblesays.brennen-d06.workers.dev',
  },

  care: {
    crisisLine: '988',
    crisisLineLabel: 'Call or text 988 (Suicide & Crisis Lifeline, US)',
  },
} as const;

export type TranslationCode = (typeof appConfig.translations)[number]['code'];

export const availableTranslations = appConfig.translations.filter((t) => t.available);
