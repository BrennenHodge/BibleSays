import { appConfig } from '@/config/app';
import type { CareKind } from '@/content/types';

const CRISIS = /\b(suicid\w*|kill(ing)? myself|end (it|my life)|self[- ]?harm|hurt(ing)? myself|don'?t want to (live|be alive)|overdose)\b/i;
const ABUSE = /\b(abus\w*|hits? me|hit me|beats? me|threaten\w*|unsafe at home|forced me|rape\w*|assault\w*)\b/i;

/** Detects disclosures that need a safety-first response before any study content. */
export function detectRisk(text: string): 'crisis' | 'abuse' | null {
  if (CRISIS.test(text)) return 'crisis';
  if (ABUSE.test(text)) return 'abuse';
  return null;
}

export function crisisMessage(): string {
  return `I'm really glad you said something. You matter, and you don't have to carry this alone. If you're in danger or thinking about ending your life, please reach out right now: ${appConfig.care.crisisLineLabel}, or contact your local emergency number. Talking with someone you trust today is a brave and faithful step.`;
}

export function abuseMessage(): string {
  return `What you're describing sounds serious, and your safety matters to God and to us. Forgiveness never requires staying somewhere unsafe. If you're in immediate danger, contact local emergency services. In the US you can reach the National Domestic Violence Hotline at 1-800-799-7233, and ${appConfig.care.crisisLineLabel}. A trusted pastor, counselor, or friend can help you take the next step.`;
}

/** Gentle standing note shown with sensitive cards. Prayer is never framed as a replacement for care. */
export function careNote(kind: CareKind): string {
  switch (kind) {
    case 'mental-health':
      return 'If anxiety is affecting your sleep, work, or relationships, talking with a doctor or licensed counselor is a wise and faithful step. Prayer and professional care work together.';
    case 'abuse':
      return 'Forgiveness never requires staying in an unsafe situation. If someone is hurting you, please reach out to a trusted person or a local support service.';
    case 'health':
      return 'If this keeps happening, please talk with a doctor. Caring for your body is part of caring for your whole self.';
  }
}
