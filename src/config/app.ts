/**
 * Product configuration. Nothing here is final: the app name, pricing, trial terms
 * and Scripture licensing are intentionally configurable rather than hard-coded.
 */
export const appConfig = {
  /** Working title only — the product name is still TBD. */
  appName: 'Selah',
  tagline: "The Bible, explained for the life you're actually living.",

  /** Translations the app knows about. Only `available` ones can be selected. */
  translations: [
    {
      code: 'WEB',
      name: 'World English Bible',
      available: true,
      license: 'Public domain',
      note: 'Used for the prototype. Text verified against bible-api.com.',
    },
    {
      code: 'NLT',
      name: 'New Living Translation',
      available: false,
      license: 'Requires Tyndale House license',
      note: 'Preferred translation. Enable once licensed text is supplied by an authorized provider.',
    },
  ],
  defaultTranslation: 'WEB',

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
    webOrigin: 'https://example.app',
  },

  care: {
    crisisLine: '988',
    crisisLineLabel: 'Call or text 988 (Suicide & Crisis Lifeline, US)',
  },
} as const;

export type TranslationCode = (typeof appConfig.translations)[number]['code'];
