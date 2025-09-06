'use server';

/**
 * @fileOverview This file defines a Genkit flow for answering questions based on the content of a PDF document.
 *
 * It includes:
 * - `answerQuestionsFromPdf`: An async function that takes a PDF data URI and a question as input and returns an answer.
 * - `AnswerQuestionsFromPdfInput`: The TypeScript type definition for the input object.
 * - `AnswerQuestionsFromPdfOutput`: The TypeScript type definition for the output object.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionsFromPdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      'The PDF document as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'  
    ),
  question: z.string().describe('The question to be answered based on the PDF content.'),
});
export type AnswerQuestionsFromPdfInput = z.infer<typeof AnswerQuestionsFromPdfInputSchema>;

const AnswerQuestionsFromPdfOutputSchema = z.object({
  answer: z.string().describe('The answer to the question based on the PDF content, formatted in Markdown.'),
});
export type AnswerQuestionsFromPdfOutput = z.infer<typeof AnswerQuestionsFromPdfOutputSchema>;

export async function answerQuestionsFromPdf(
  input: AnswerQuestionsFromPdfInput
): Promise<AnswerQuestionsFromPdfOutput> {
  return answerQuestionsFromPdfFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerQuestionsFromPdfPrompt',
  input: {schema: AnswerQuestionsFromPdfInputSchema},
  output: {schema: AnswerQuestionsFromPdfOutputSchema},
  prompt: `You are an AI assistant that answers questions based on the content of a PDF document.

  Use the document provided to answer the question. Your answer should be formatted in Markdown, using headings, bold text, lists, and paragraphs to improve readability.

  Question: {{{question}}}
  PDF Document: {{media url=pdfDataUri}}`,
});

const answerQuestionsFromPdfFlow = ai.defineFlow(
  {
    name: 'answerQuestionsFromPdfFlow',
    inputSchema: AnswerQuestionsFromPdfInputSchema,
    outputSchema: AnswerQuestionsFromPdfOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
