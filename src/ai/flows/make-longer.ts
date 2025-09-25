'use server';

/**
 * @fileOverview Implements the MakeLonger flow for expanding sections of text.
 *
 * - makeLonger - A function that accepts text and returns an expanded version.
 * - MakeLongerInput - The input type for the makeLonger function.
 * - MakeLongerOutput - The return type for the makeLonger function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MakeLongerInputSchema = z.object({
  text: z.string().describe('The text to be made longer.'),
  language: z.string().describe('The language for the expanded text. Can be "sv", "bs", "hr", or "sr".'),
});
export type MakeLongerInput = z.infer<typeof MakeLongerInputSchema>;

const MakeLongerOutputSchema = z.object({
  longerText: z.string().describe('The expanded text.'),
});
export type MakeLongerOutput = z.infer<typeof MakeLongerOutputSchema>;

export async function makeLonger(input: MakeLongerInput): Promise<MakeLongerOutput> {
  return makeLongerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'makeLongerPrompt',
  input: {schema: MakeLongerInputSchema},
  output: {schema: MakeLongerOutputSchema},
  prompt: `Please expand on the following text to make it longer and more detailed, in the specified language.

  The expanded text must be in the following language: {{{language}}}.
  
  Text to expand:
  {{{text}}}`,
});

export const makeLongerFlow = ai.defineFlow(
  {
    name: 'makeLongerFlow',
    inputSchema: MakeLongerInputSchema,
    outputSchema: MakeLongerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return { longerText: output!.longerText };
  }
);
