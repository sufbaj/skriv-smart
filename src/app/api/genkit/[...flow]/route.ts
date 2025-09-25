import {genkitNext} from '@genkit-ai/next';
import '@/ai/flows/generate-text-from-prompt';
import '@/ai/flows/suggest-improvements';
import '@/ai/flows/verify-source-facts';
import '@/ai/flows/creative-brainstorming';
import '@/ai/flows/rewrite-text';
import '@/ai/flows/continue-writing';
import '@/ai/flows/make-longer';
import '@/ai/flows/make-shorter';

export const {POST} = genkitNext();
