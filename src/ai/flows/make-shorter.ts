'use server';

/**
 * @fileOverview Implements the MakeShorter flow for shortening sections of text.
 *
 * - makeShorter - A function that accepts text and returns a shortened version.
 * - MakeShorterInput - The input type for the makeShorter function.
 * - MakeShorterOutput - The return type for the makeShorter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MakeShorterInputSchema = z.object({
  text: z.string().describe('The text to be made shorter.'),
  language: z.string().describe('The language for the shortened text. Can be "sv", "bs", "hr", or "sr".'),
});
export type MakeShorterInput = z.infer<typeof MakeShorterInputSchema>;

const MakeShorterOutputSchema = z.object({
  shorterText: z.string().describe('The shortened text.'),
});
export type MakeShorterOutput = z.infer<typeof MakeShorterOutputSchema>;

export async function makeShorter(input: MakeShorterInput): Promise<MakeShorterOutput> {
  return makeShorterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'makeShorterPrompt',
  input: {schema: MakeShorterInputSchema},
  output: {schema: MakeShorterOutputSchema},
  prompt: `Please shorten the following text while preserving its core meaning, in the specified language.

  The shortened text must be in the following language: {{{language}}}.
  
  Text to shorten:
  {{{text}}}`,
});

export const makeShorterFlow = ai.defineFlow(
  {
    name: 'makeShorterFlow',
    inputSchema: MakeShorterInputSchema,
    outputSchema: MakeShorterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return { shorterText: output!.shorterText };
  }
);
