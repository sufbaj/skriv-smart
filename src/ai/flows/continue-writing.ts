'use server';

/**
 * @fileOverview This file defines a Genkit flow for continuing a story based on existing text.
 *
 * It includes:
 * - `continueWriting` - An asynchronous function that takes existing text and returns the next part of the story.
 * - `ContinueWritingInput` - The input type for the `continueWriting` function.
 * - `ContinueWritingOutput` - The output type for the `continueWriting` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContinueWritingInputSchema = z.object({
  text: z
    .string()
    .describe('The existing text of the story to continue from.'),
  language: z.string().describe('The language for the story continuation. Can be "sv", "bs", "hr", or "sr".'),
});
export type ContinueWritingInput = z.infer<typeof ContinueWritingInputSchema>;

const ContinueWritingOutputSchema = z.object({
  continuation: z
    .string()
    .describe('The next paragraph or section of the story.'),
});
export type ContinueWritingOutput = z.infer<typeof ContinueWritingOutputSchema>;

export async function continueWriting(
  input: ContinueWritingInput
): Promise<ContinueWritingOutput> {
  return continueWritingFlow(input);
}

const continueWritingPrompt = ai.definePrompt({
  name: 'continueWritingPrompt',
  input: {schema: ContinueWritingInputSchema},
  output: {schema: ContinueWritingOutputSchema},
  prompt: `You are a creative writing assistant. Your task is to continue the story based on the text provided. Write one or two engaging paragraphs that logically follow the story.

  The story must be in the following language: {{{language}}}.

  Existing story:
  {{{text}}}

  Continue the story:
  `,
});

export const continueWritingFlow = ai.defineFlow(
  {
    name: 'continueWritingFlow',
    inputSchema: ContinueWritingInputSchema,
    outputSchema: ContinueWritingOutputSchema,
  },
  async input => {
    const {output} = await continueWritingPrompt(input);
    return output!;
  }
);
