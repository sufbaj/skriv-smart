import { genkitHandler } from '@genkit-ai/next';
import { generateTextFromPromptFlow } from '@/ai/flows/generate-text-from-prompt';
import { suggestImprovementsFlow } from '@/ai/flows/suggest-improvements';
import { verifySourceFactsFlow } from '@/ai/flows/verify-source-facts';
import { creativeBrainstormFlow } from '@/ai/flows/creative-brainstorming';
import { rewriteTextFlow } from '@/ai/flows/rewrite-text';
import { continueWritingFlow } from '@/ai/flows/continue-writing';
import { makeLongerFlow } from '@/ai/flows/make-longer';
import { makeShorterFlow } from '@/ai/flows/make-shorter';

export const { GET, POST } = genkitHandler({
  flows: [
    generateTextFromPromptFlow,
    suggestImprovementsFlow,
    verifySourceFactsFlow,
    creativeBrainstormFlow,
    rewriteTextFlow,
    continueWritingFlow,
    makeLongerFlow,
    makeShorterFlow,
  ],
});
