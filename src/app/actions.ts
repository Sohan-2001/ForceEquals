
'use server';

import { answerQuestionsFromPdf } from '@/ai/flows/answer-questions-from-pdf';
import { summarizePdf } from '@/ai/flows/summarize-pdf';
import { z } from 'zod';

const PdfSchema = z.object({
  pdfDataUri: z.string().startsWith('data:application/pdf;base64,', { message: 'Invalid PDF data format.' }),
});

const QuestionSchema = z.object({
  question: z.string().min(1, { message: 'Question cannot be empty.' }),
  pdfDataUri: z.string().startsWith('data:application/pdf;base64,', { message: 'Invalid PDF data format.' }),
});

export async function getSummary(pdfDataUri: string) {
  const validation = PdfSchema.safeParse({ pdfDataUri });
  if (!validation.success) {
    const errorMessage = validation.error.errors.map(e => e.message).join(', ');
    return { error: errorMessage };
  }
  try {
    const result = await summarizePdf({ pdfDataUri });
    if (result && result.summary) {
        return { data: result.summary };
    }
    return { error: 'Failed to generate summary. The document might be empty or unreadable.' };
  } catch (e) {
    console.error('Error in getSummary:', e);
    return { error: 'An unexpected error occurred while generating the summary.' };
  }
}

export async function getAnswer(question: string, pdfDataUri: string) {
  const validation = QuestionSchema.safeParse({ question, pdfDataUri });
  if (!validation.success) {
    const errorMessage = validation.error.errors.map(e => e.message).join(', ');
    return { error: errorMessage };
  }
  try {
    const result = await answerQuestionsFromPdf({ question, pdfDataUri });
    if (result && result.answer) {
        return { data: result.answer };
    }
    return { error: 'Failed to generate an answer.' };
  } catch (e) {
    console.error('Error in getAnswer:', e);
    return { error: 'An unexpected error occurred while generating the answer.' };
  }
}
