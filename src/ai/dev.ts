import { config } from 'dotenv';
config();

import '@/ai/flows/generate-text-from-prompt.ts';
import '@/ai/flows/suggest-improvements.ts';
import '@/ai/flows/verify-source-facts.ts';
import '@/ai/flows/creative-brainstorming.ts';
import '@/ai/flows/rewrite-text.ts';
import '@/ai/flows/continue-writing.ts';
import '@/ai/flows/make-longer.ts';
import '@/ai/flows/make-shorter.ts';
