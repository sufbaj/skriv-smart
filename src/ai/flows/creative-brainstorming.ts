'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating creative writing prompts based on user input.
 *
 * It includes:
 * - `generateCreativeBrainstorm` - An asynchronous function that takes user input and returns creative suggestions.
 * - `CreativeBrainstormInput` - The input type for the `generateCreativeBrainstorm` function.
 * - `CreativeBrainstormOutput` - The output type for the `generateCreativeBrainstorm` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreativeBrainstormInputSchema = z.object({
  inputText: z
    .string()
    .describe('The user-provided text to generate creative ideas from.'),
  language: z.string().describe('The language for the suggestions. Can be "sv", "bs", "hr", or "sr".'),
});
export type CreativeBrainstormInput = z.infer<typeof CreativeBrainstormInputSchema>;

const CreativeBrainstormOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of creative writing suggestions based on the input text.'),
});
export type CreativeBrainstormOutput = z.infer<typeof CreativeBrainstormOutputSchema>;

export async function generateCreativeBrainstorm(
  input: CreativeBrainstormInput
): Promise<CreativeBrainstormOutput> {
  return creativeBrainstormFlow(input);
}

const creativeBrainstormPrompt = ai.definePrompt({
  name: 'creativeBrainstormPrompt',
  input: {schema: CreativeBrainstormInputSchema},
  output: {schema: CreativeBrainstormOutputSchema},
  prompt: `You are a creative writing assistant for elementary school students. Your goal is to provide fun and engaging ideas to help them overcome writer's block.

  The suggestions must be in the following language: {{{language}}}.
  
  Based on the following text:
  {{{inputText}}}

  Generate three distinct and creative writing suggestions, focusing on new ideas, characters, or settings that could inspire the student to continue writing. The suggestions should be different enough to provide a good set of options.

  Format each suggestion as a single sentence.
  `,
});

const creativeBrainstormFlow = ai.defineFlow(
  {
    name: 'creativeBrainstormFlow',
    inputSchema: CreativeBrainstormInputSchema,
    outputSchema: CreativeBrainstormOutputSchema,
  },
  async input => {
    const {output} = await creativeBrainstormPrompt(input);
    return output!;
  }
);
