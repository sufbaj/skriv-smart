'use server';

/**
 * @fileOverview This flow verifies the facts in a student's text against a provided URL.
 *
 * - verifySourceFacts - A function that verifies the facts in a text against a source URL.
 * - VerifySourceFactsInput - The input type for the verifySourceFacts function.
 * - VerifySourceFactsOutput - The return type for the verifySourceFacts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifySourceFactsInputSchema = z.object({
  text: z.string().describe('The text to verify.'),
  sourceUrl: z.string().url().describe('The URL of the source to verify against.'),
});
export type VerifySourceFactsInput = z.infer<typeof VerifySourceFactsInputSchema>;

const VerifySourceFactsOutputSchema = z.object({
  verificationResult: z.string().describe('A summary of the fact verification results.'),
});
export type VerifySourceFactsOutput = z.infer<typeof VerifySourceFactsOutputSchema>;

export async function verifySourceFacts(input: VerifySourceFactsInput): Promise<VerifySourceFactsOutput> {
  return verifySourceFactsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifySourceFactsPrompt',
  input: {schema: VerifySourceFactsInputSchema},
  output: {schema: VerifySourceFactsOutputSchema},
  prompt: `You are an expert fact checker. You will be provided with a text and a source URL. You will compare the facts in the text against the information in the source URL and provide a summary of the verification results.

Text: {{{text}}}
Source URL: {{{sourceUrl}}}`,
});

export const verifySourceFactsFlow = ai.defineFlow(
  {
    name: 'verifySourceFactsFlow',
    inputSchema: VerifySourceFactsInputSchema,
    outputSchema: VerifySourceFactsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
