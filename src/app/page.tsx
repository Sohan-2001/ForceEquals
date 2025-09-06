'use client';

import { useState, useRef, ChangeEvent, useTransition } from 'react';
import { BrainCircuit, FileText, Loader2, Sparkles, UploadCloud } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getSummary, getAnswer } from './actions';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  question: z.string().min(10, {
    message: 'Question must be at least 10 characters.',
  }),
});

export default function Home() {
  const [pdfFile, setPdfFile] = useState<{ name: string; dataUri: string } | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  
  const [isSummarizing, startSummaryTransition] = useTransition();
  const [isAnswering, startAnswerTransition] = useTransition();
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
    },
  });

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a PDF document.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      setPdfFile({ name: file.name, dataUri });
      form.reset();
      setAnswer(null);

      startSummaryTransition(async () => {
        setSummary(null);
        const result = await getSummary(dataUri);
        if (result.error) {
          toast({
            variant: 'destructive',
            title: 'Summarization Failed',
            description: result.error,
          });
          setSummary('Could not generate a summary for this document.');
        } else {
          setSummary(result.data || 'No summary could be generated.');
        }
      });
    };
    reader.readAsDataURL(file);
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!pdfFile) {
        toast({
            variant: 'destructive',
            title: 'No PDF found',
            description: 'Please upload a PDF file first.',
        });
        return;
    };
    
    startAnswerTransition(async () => {
        setAnswer(null);
        const result = await getAnswer(values.question, pdfFile.dataUri);
        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Failed to get answer',
                description: result.error,
            });
            setAnswer('Sorry, I could not find an answer to your question.');
        } else {
            setAnswer(result.data);
        }
    });
  }

  return (
    <div className="flex flex-col min-h-screen bg-background font-body text-foreground">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">PDF Insights</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <Card className="shadow-lg border-2 border-transparent hover:border-primary/50 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="text-accent" />
                Document
              </CardTitle>
              <CardDescription>Upload your PDF document to get started.</CardDescription>
            </CardHeader>
            <CardContent>
              {!pdfFile ? (
                <div
                  className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={handleUploadClick}
                >
                  <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="font-semibold text-lg mb-1">Click to upload your PDF</p>
                  <p className="text-sm text-muted-foreground">Or drag and drop</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div>
                  <div className="mb-6 p-4 bg-muted rounded-lg border">
                    <p className="font-semibold truncate">{pdfFile.name}</p>
                    <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => {
                      setPdfFile(null);
                      setSummary(null);
                      setAnswer(null);
                      form.reset();
                    }}>
                      Upload another file
                    </Button>
                  </div>
                  
                  <h3 className="font-semibold mb-2">Summary</h3>
                  {isSummarizing ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{summary}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`shadow-lg border-2 border-transparent transition-all duration-300 ${!pdfFile ? 'opacity-50 pointer-events-none' : 'hover:border-primary/50'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-accent" />
                Ask a Question
              </CardTitle>
              <CardDescription>Get answers based on the content of your document.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="question"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Question</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., What are the main conclusions of the report?"
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isAnswering} className="w-full">
                    {isAnswering ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Getting Answer...
                      </>
                    ) : (
                      'Ask'
                    )}
                  </Button>
                </form>
              </Form>

              {(isAnswering || answer) && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="font-semibold mb-2">Answer</h3>
                  {isAnswering ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                  ) : (
                    <p className="text-sm text-foreground whitespace-pre-wrap">{answer}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
