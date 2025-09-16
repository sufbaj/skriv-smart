'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting improvements to student writing.
 *
 * - suggestImprovements - A function that takes student text as input and returns suggestions for improvement.
 * - SuggestImprovementsInput - The input type for the suggestImprovements function.
 * - SuggestImprovementsOutput - The return type for the suggestImprovements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestImprovementsInputSchema = z.object({
  text: z
    .string()
    .describe('The text to be improved.'),
  language: z.string().describe('The language for the suggestions. Can be "sv", "bs", "hr", or "sr".'),
});
export type SuggestImprovementsInput = z.infer<typeof SuggestImprovementsInputSchema>;

const SuggestImprovementsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of suggestions for improving the text.'),
});
export type SuggestImprovementsOutput = z.infer<typeof SuggestImprovementsOutputSchema>;

export async function suggestImprovements(input: SuggestImprovementsInput): Promise<SuggestImprovementsOutput> {
  return suggestImprovementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestImprovementsPrompt',
  input: {schema: SuggestImprovementsInputSchema},
  output: {schema: SuggestImprovementsOutputSchema},
  prompt: `You are an AI writing coach that helps middle schoolers improve their writing by providing feedback based on the Swedish curriculum Lgr22.

  Given the following text, provide a list of suggestions on how to improve the text. Your feedback should align with the goals for writing in Lgr22, focusing on areas like clarity, structure, language variation, and adapting text for purpose and audience. The suggestions should be actionable and easy for a student to understand.
  
  Start your suggestions with "Jag noterar..." and write in a neutral, encouraging tone.

  The suggestions must be in the following language: {{{language}}}.

  Text: {{{text}}}
  `,
});

const suggestImprovementsFlow = ai.defineFlow(
  {
    name: 'suggestImprovementsFlow',
    inputSchema: SuggestImprovementsInputSchema,
    outputSchema: SuggestImprovementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
