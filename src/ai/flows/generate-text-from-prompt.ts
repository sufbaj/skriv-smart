'use server';
/**
 * @fileOverview An AI agent that generates an introductory paragraph from a short idea.
 *
 * - generateTextFromPrompt - A function that generates an introductory paragraph from a short idea.
 * - GenerateTextFromPromptInput - The input type for the generateTextFromPrompt function.
 * - GenerateTextFromPromptOutput - The return type for the generateTextFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTextFromPromptInputSchema = z.object({
  prompt: z.string().describe('A short idea to generate an introductory paragraph from.'),
  language: z.string().describe('The language for the generated text. Can be "sv", "bs", "hr", or "sr".'),
});
export type GenerateTextFromPromptInput = z.infer<typeof GenerateTextFromPromptInputSchema>;

const GenerateTextFromPromptOutputSchema = z.object({
  generatedText: z.string().describe('The generated introductory paragraph.'),
});
export type GenerateTextFromPromptOutput = z.infer<typeof GenerateTextFromPromptOutputSchema>;

export async function generateTextFromPrompt(input: GenerateTextFromPromptInput): Promise<GenerateTextFromPromptOutput> {
  return generateTextFromPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTextFromPromptPrompt',
  input: {schema: GenerateTextFromPromptInputSchema},
  output: {schema: GenerateTextFromPromptOutputSchema},
  prompt: `You are a creative writing assistant helping students write stories.

  Generate an engaging introductory paragraph based on the following idea: {{{prompt}}}.
  
  The generated text must be in the following language: {{{language}}}.`,
});

const generateTextFromPromptFlow = ai.defineFlow(
  {
    name: 'generateTextFromPromptFlow',
    inputSchema: GenerateTextFromPromptInputSchema,
    outputSchema: GenerateTextFromPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      generatedText: output!.generatedText,
    };
  }
);
