'use client';

import { useState, useRef, ChangeEvent, useTransition, useEffect } from 'react';
import { Loader2, Paperclip, Send, Search, Lock } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { getAnswer } from './actions';
import { Form } from '@/components/ui/form';

const formSchema = z.object({
  question: z.string().min(1, {
    message: 'Question cannot be empty.',
  }),
});

interface Message {
    sender: 'user' | 'bot';
    text: string | null;
    isTyping?: boolean;
    timestamp: string;
}

export default function Home() {
  const [pdfFile, setPdfFile] = useState<{ name: string; dataUri: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [isAnswering, startAnswerTransition] = useTransition();
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
    },
  });
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

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
      setMessages([]);
      form.reset();
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

    const userMessage: Message = { sender: 'user', text: values.question, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    const botTypingMessage: Message = { sender: 'bot', text: null, isTyping: true, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    
    setMessages(prev => [...prev, userMessage, botTypingMessage]);
    form.reset();
    
    startAnswerTransition(async () => {
        const result = await getAnswer(values.question, pdfFile.dataUri);
        
        setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.isTyping) {
                lastMessage.isTyping = false;
                lastMessage.text = result.data || 'Sorry, I could not find an answer.';
                if(result.error){
                    toast({
                        variant: 'destructive',
                        title: 'Failed to get answer',
                        description: result.error,
                    });
                }
            }
            return newMessages;
        });
    });
  }

  return (
    <div className="flex flex-col h-screen bg-black text-gray-200 font-sans">
      <header className="flex items-center justify-between p-2.5 bg-[#202c33] border-b border-gray-700">
        <div className="flex items-center gap-4">
            <Avatar>
                <AvatarImage src="https://picsum.photos/100" alt="Arunava Dutta" />
                <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold">PDF Insights</p>
                <p className="text-xs text-gray-400">{pdfFile ? `Chatting with ${pdfFile.name}` : 'Offline'}</p>
            </div>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
            <Search className="cursor-pointer" />
        </div>
      </header>

      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4">
        <div className="flex justify-center my-2">
            <div className="bg-[#1a2831] px-3 py-1.5 rounded-lg text-xs text-gray-400">
                Today
            </div>
        </div>
        
        {messages.map((msg, index) => (
            <div key={index} className={`flex my-1 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg px-2.5 py-1.5 max-w-sm md:max-w-md lg:max-w-2xl shadow-md ${msg.sender === 'user' ? 'bg-[#005c4b]' : 'bg-[#202c33]'}`}>
                    {msg.isTyping ? (
                         <div className="flex items-center justify-center p-2">
                            <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s] mx-1"></span>
                            <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm">{msg.text}</p>
                            <p className="text-xs text-gray-400 text-right mt-1">{msg.timestamp}</p>
                        </div>
                    )}
                </div>
            </div>
        ))}
        <div className="flex justify-center my-4">
            <div className="bg-[#1a2831] p-2.5 rounded-lg text-xs text-gray-400 flex items-center gap-2 text-center">
                <Lock className="h-3 w-3" />
                <p>Messages are end-to-end encrypted. No one outside of this chat, not even PDF Insights, can read them.</p>
            </div>
        </div>

        {!pdfFile && (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className='p-8 bg-[#202c33]/80 rounded-lg shadow-lg backdrop-blur-sm'>
                    <h2 className="text-xl font-semibold mb-4">Start a conversation</h2>
                    <p className="text-gray-400 mb-6">Upload a PDF document to begin chatting with it.</p>
                    <Button onClick={handleUploadClick} variant={'ghost'} className='bg-teal-600 hover:bg-teal-700 text-white'>
                        <Paperclip className="mr-2 h-4 w-4" />
                        Upload PDF
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
            </div>
        )}
      </main>
      
      <footer className="p-2.5 bg-[#202c33]">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-3">
                <Button type="button" variant="ghost" size="icon" onClick={handleUploadClick} title="Upload PDF">
                    <Paperclip className='text-gray-400' />
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                />
                <Input 
                    {...form.register('question')}
                    placeholder="Type a message..." 
                    autoComplete="off"
                    disabled={!pdfFile || isAnswering}
                    className="flex-1 bg-[#2a3942] border-none text-gray-200 placeholder-gray-400"
                />
                <Button type="submit" size="icon" disabled={!pdfFile || isAnswering} className='bg-teal-600 hover:bg-teal-700 rounded-full'>
                    {isAnswering ? <Loader2 className="animate-spin" /> : <Send />}
                </Button>
            </form>
        </Form>
      </footer>
    </div>
  );
}
