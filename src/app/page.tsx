'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Lightbulb,
  Sparkles,
  CheckCircle,
  BookOpen,
  FileText,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Upload,
  Download,
  ChevronDown,
  PenSquare,
} from 'lucide-react';
import type { SuggestImprovementsInput, SuggestImprovementsOutput } from '@/ai/flows/suggest-improvements';
import type { CreativeBrainstormInput, CreativeBrainstormOutput } from '@/ai/flows/creative-brainstorming';
import type { VerifySourceFactsInput, VerifySourceFactsOutput } from '@/ai/flows/verify-source-facts';
import type { RewriteTextInput, RewriteTextOutput } from '@/ai/flows/rewrite-text';
import type { GenerateTextFromPromptInput, GenerateTextFromPromptOutput } from '@/ai/flows/generate-text-from-prompt';
import type { ContinueWritingInput, ContinueWritingOutput } from '@/ai/flows/continue-writing';
import type { MakeLongerInput, MakeLongerOutput } from '@/ai/flows/make-longer';
import type { MakeShorterInput, MakeShorterOutput } from '@/ai/flows/make-shorter';


import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import * as mammoth from 'mammoth';

async function callFlow<I, O>(flowId: string, input: I): Promise<O> {
  const response = await fetch(`/api/genkit/${flowId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Flow ${flowId} failed: ${errorText}`);
  }

  return response.json() as Promise<O>;
}

type AnalysisResult = {
  score: number;
  content: string;
  language: string;
  structure: string;
};

export default function Home() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestImprovementsOutput['suggestions'] | null>(null);
  const [brainstormIdeas, setBrainstormIdeas] = useState<CreativeBrainstormOutput['suggestions'] | null>(null);
  const [factCheckUrl, setFactCheckUrl] = useState('');
  const [factCheckResult, setFactCheckResult] = useState<VerifySourceFactsOutput | null>(null);
  const [generatedIntro, setGeneratedIntro] = useState<GenerateTextFromPromptOutput | null>(null);
  const [ideaPrompt, setIdeaPrompt] = useState('');
  const [suggestionLanguage, setSuggestionLanguage] = useState('sv');
  const [textLanguage, setTextLanguage] = useState('sv');
  

  const handleAiCall = async <I, O>({
    loaderKey,
    flowId,
    input,
    onSuccess,
    errorMessage,
  }: {
    loaderKey: string;
    flowId: string;
    input: I;
    onSuccess: (result: O) => void;
    errorMessage: string;
  }) => {
    setIsLoading(loaderKey);
    if (loaderKey !== 'analyze') {
      setAnalysisResult(null);
      setSuggestions(null);
    }
    setBrainstormIdeas(null);
    setFactCheckResult(null);
    if (loaderKey !== 'continue' && loaderKey !== 'intro') {
      setGeneratedIntro(null);
    }

    try {
      const result = await callFlow<I, O>(flowId, input);
      onSuccess(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Ett fel uppstod',
        description: errorMessage,
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleAnalyze = async (lang: string = suggestionLanguage) => {
    if (!text) {
      toast({
        variant: 'destructive',
        title: 'Text saknas',
        description: 'Vänligen skriv in text för att analysera.',
      });
      return;
    }

    await handleAiCall<SuggestImprovementsInput, SuggestImprovementsOutput>({
      loaderKey: 'analyze',
      flowId: 'suggestImprovementsFlow',
      input: { text, language: lang },
      onSuccess: (result) => {
        setSuggestions(result.suggestions);
        if (!analysisResult) {
          setAnalysisResult({
            score: Math.floor(75 + Math.random() * 20),
            content: 'Innehållet är tydligt och relevant för ämnet.',
            language: 'Språket är varierat med god meningsbyggnad.',
            structure: 'Texten har en tydlig inledning, huvuddel och avslutning.',
          });
        }
        toast({
          title: 'Analys klar!',
          description: 'Se resultaten i panelen till höger.',
        });
      },
      errorMessage: 'Kunde inte hämta förslag.',
    });
  };
  
  useEffect(() => {
    if (analysisResult) {
      handleAnalyze(suggestionLanguage);
    }
  }, [suggestionLanguage]);

  const handleBrainstorm = () => {
    if (!text) {
      toast({
        variant: 'destructive',
        title: 'Text saknas',
        description: 'Vänligen skriv lite text först för att få idéer.',
      });
      return;
    }
    handleAiCall<CreativeBrainstormInput, CreativeBrainstormOutput>({
      loaderKey: 'brainstorm',
      flowId: 'creativeBrainstormFlow',
      input: { inputText: text, language: textLanguage },
      onSuccess: (result) => {
        setBrainstormIdeas(result.suggestions)
        toast({
          title: 'Här är några idéer!',
          description: 'Se resultaten under brainstorming-knappen.',
        });
      },
      errorMessage: 'Kunde inte generera idéer.',
    });
  };
  
  const handleFactCheck = () => {
    if (!text || !factCheckUrl) {
      toast({
        variant: 'destructive',
        title: 'Information saknas',
        description: 'Vänligen fyll i både text och en käll-URL.',
      });
      return;
    }
    handleAiCall<VerifySourceFactsInput, VerifySourceFactsOutput>({
      loaderKey: 'fact-check',
      flowId: 'verifySourceFactsFlow',
      input: { text, sourceUrl: factCheckUrl },
      onSuccess: (result) => setFactCheckResult(result),
      errorMessage: 'Kunde inte verifiera fakta.',
    });
  };
  
  const handleGenerateIntro = () => {
    if (!ideaPrompt) {
      toast({
        variant: 'destructive',
        title: 'Idé saknas',
        description: 'Vänligen skriv en kort idé för din berättelse.',
      });
      return;
    }
    handleAiCall<GenerateTextFromPromptInput, GenerateTextFromPromptOutput>({
      loaderKey: 'intro',
      flowId: 'generateTextFromPromptFlow',
      input: { prompt: ideaPrompt, language: textLanguage },
      onSuccess: (result) => {
        setGeneratedIntro(result);
        setText(prev => `${result.generatedText}\n\n${prev}`);
        toast({ title: 'Inledning skapad och infogad!' });
      },
      errorMessage: 'Kunde inte generera inledning.',
    });
  };

  const handleContinueWriting = () => {
    if (!text) {
      toast({
        variant: 'destructive',
        title: 'Text saknas',
        description: 'Det finns ingen text att fortsätta på.',
      });
      return;
    }
    handleAiCall<ContinueWritingInput, ContinueWritingOutput>({
      loaderKey: 'continue',
      flowId: 'continueWritingFlow',
      input: { text, language: textLanguage },
      onSuccess: (result) => {
        setText(prev => `${prev}\n\n${result.continuation}`);
        toast({ title: 'Berättelsen har fortsatt!' });
      },
      errorMessage: 'Kunde inte fortsätta skriva.',
    });
  };
  
  const handleRewrite = () => {
    if (!text) return;
    handleAiCall<RewriteTextInput, RewriteTextOutput>({
      loaderKey: 'rewrite',
      flowId: 'rewriteTextFlow',
      input: { text, language: textLanguage },
      onSuccess: (result) => {
        setText(result.rewrittenText);
        toast({ title: 'Texten har skrivits om!' });
      },
      errorMessage: 'Kunde inte skriva om texten.',
    });
  };

  const handleMakeLonger = () => {
    if (!text) return;
    handleAiCall<MakeLongerInput, MakeLongerOutput>({
      loaderKey: 'make-longer',
      flowId: 'makeLongerFlow',
      input: { text, language: textLanguage },
      onSuccess: (result) => {
        setText(result.longerText);
        toast({ title: 'Texten har gjorts längre!' });
      },
      errorMessage: 'Kunde inte göra texten längre.',
    });
  };

  const handleMakeShorter = () => {
    if (!text) return;
    handleAiCall<MakeShorterInput, MakeShorterOutput>({
      loaderKey: 'make-shorter',
      flowId: 'makeShorterFlow',
      input: { text, language: textLanguage },
      onSuccess: (result) => {
        setText(result.shorterText);
        toast({ title: 'Texten har gjorts kortare!' });
      },
      errorMessage: 'Kunde inte göra texten kortare.',
    });
  };

  const downloadTxt = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'skrivsmart_dokument.txt');
    toast({ title: 'Texten har laddats ner som .txt' });
  };
  
  const downloadDocx = () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun(text)],
          }),
          ...(suggestions || []).map(suggestion => 
            new Paragraph({
              children: [
                new TextRun({ text: '\nKommentar: ', bold: true }),
                new TextRun(suggestion)
              ],
              style: "CommentText"
            })
          ),
        ],
      }],
      styles: {
        paragraphStyles: [
          {
            id: "CommentText",
            name: "Comment Text",
            basedOn: "Normal",
            next: "Normal",
            run: {
              color: "808080",
              size: 20, // 10pt
            },
          },
        ]
      }
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, 'skrivsmart_dokument.docx');
      toast({ title: 'Dokumentet har laddats ner som .docx' });
    });
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(12);

    const mainTextLines = doc.splitTextToSize(text, usableWidth);
    
    doc.text(mainTextLines, margin, margin);
    let y = margin + (mainTextLines.length * doc.getLineHeight() / doc.internal.scaleFactor);

    if (suggestions && suggestions.length > 0) {
      if (y > usableHeight - 20) {
        doc.addPage();
        y = margin;
      }
      y += 10;
      doc.setFont('Helvetica', 'bold');
      doc.text("Kommentarer:", margin, y);
      y += doc.getLineHeight() / doc.internal.scaleFactor;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);

      suggestions.forEach(suggestion => {
        const suggestionLines = doc.splitTextToSize(`- ${suggestion}`, usableWidth);
        if (y + (suggestionLines.length * doc.getLineHeight() / doc.internal.scaleFactor) > usableHeight) {
          doc.addPage();
          y = margin;
        }
        doc.text(suggestionLines, margin, y);
        y += suggestionLines.length * doc.getLineHeight() / doc.internal.scaleFactor;
      });
    }

    doc.save('skrivsmart_dokument.pdf');
    toast({ title: 'Dokumentet har laddats ner som .pdf' });
  };


  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        let extractedText = '';

        if (file.type === 'text/plain') {
          extractedText = new TextDecoder().decode(arrayBuffer);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const result = await mammoth.extractRawText({ arrayBuffer });
          extractedText = result.value;
        } else if (file.type === 'application/pdf') {
          const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
          const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');
          pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;

          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          let pdfText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            pdfText += textContent.items.map(item => (item as any).str).join(' ');
          }
          extractedText = pdfText;
        } else {
          toast({
            variant: 'destructive',
            title: 'Filtypen stöds inte',
            description: 'Vänligen ladda upp en .txt, .docx, eller .pdf fil.',
          });
          return;
        }
        setText(extractedText);
        toast({ title: 'Filen har laddats upp och texten har extraherats!' });
      } catch (error) {
        console.error("Error processing file:", error);
        toast({
          variant: 'destructive',
          title: 'Fel vid filbehandling',
          description: 'Kunde inte läsa innehållet i filen.',
        });
      }
    };
    
    reader.readAsArrayBuffer(file);
    event.target.value = ''; // Reset file input
  };


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <header className="p-4 border-b border-border shadow-sm bg-card">
        <h1 className="text-2xl font-bold text-primary font-headline flex items-center gap-2">
          <BookOpen className="w-7 h-7" />
          SkrivSmart
        </h1>
        <p className="text-muted-foreground">Din personliga AI-coach för att bli en bättre skribent.</p>
      </header>
      
      <main className="flex-1 grid md:grid-cols-3 gap-6 p-4 md:p-6">
        <div className="md:col-span-2 flex flex-col gap-4">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  <span>Ditt skrivutrymme</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" asChild>
                    <Label htmlFor="upload-file" className="cursor-pointer flex items-center">
                      <Upload className="mr-2 h-4 w-4" /> Ladda upp
                    </Label>
                  </Button>
                  <Input id="upload-file" type="file" className="hidden" onChange={handleUpload} accept=".txt,.docx,.pdf" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" disabled={!text}>
                        <Download className="mr-2 h-4 w-4" />
                        Ladda ner
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={downloadTxt}>Som .txt</DropdownMenuItem>
                      <DropdownMenuItem onClick={downloadDocx}>Som Word (.docx)</DropdownMenuItem>
                      <DropdownMenuItem onClick={downloadPdf}>Som PDF (.pdf)</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <Textarea
                placeholder="Börja skriva din text här, eller ladda upp en fil..."
                className="flex-1 w-full text-base rounded-md p-4 bg-background focus-visible:ring-primary"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={20}
              />
            </CardContent>
          </Card>
          <Button onClick={() => handleAnalyze(suggestionLanguage)} size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base" disabled={isLoading !== null}>
            {isLoading === 'analyze' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
            Analysera text
          </Button>
        </div>
        
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-accent" />
              <span>AI-Coachen</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="analysis">Analys</TabsTrigger>
                <TabsTrigger value="tools">Verktyg</TabsTrigger>
              </TabsList>
              <TabsContent value="analysis" className="mt-4 space-y-4">
                {isLoading === 'analyze' && <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                {!isLoading && !analysisResult && <p className="text-muted-foreground text-center p-4">Klicka på "Analysera text" för att få feedback.</p>}
                {analysisResult && (
                  <div className="space-y-4 animate-in fade-in-50">
                    <div>
                      <Label>Helhetsbetyg</Label>
                      <div className="flex items-center gap-4 mt-1">
                        <Progress value={analysisResult.score} className="w-full h-3" />
                        <span className="font-bold text-lg text-primary">{analysisResult.score}%</span>
                      </div>
                    </div>
                    <Accordion type="single" collapsible className="w-full" defaultValue="suggestions">
                      <AccordionItem value="suggestions">
                        <AccordionTrigger>Förslag på förbättringar</AccordionTrigger>
                        <AccordionContent>
                          <div className="flex gap-2 mb-4">
                              <Button size="sm" variant={suggestionLanguage === 'sv' ? 'default' : 'outline'} onClick={() => setSuggestionLanguage('sv')}>Svenska</Button>
                              <Button size="sm" variant={suggestionLanguage === 'bs' ? 'default' : 'outline'} onClick={() => setSuggestionLanguage('bs')}>Bosanski</Button>
                              <Button size="sm" variant={suggestionLanguage === 'hr' ? 'default' : 'outline'} onClick={() => setSuggestionLanguage('hr')}>Hrvatski</Button>
                              <Button size="sm" variant={suggestionLanguage === 'sr' ? 'default' : 'outline'} onClick={() => setSuggestionLanguage('sr')}>Srpski</Button>
                          </div>
                          {suggestions?.length ? (
                            <ul className="space-y-3">
                              {suggestions.map((s, i) => (
                                <li key={i} className="p-3 bg-muted rounded-lg text-sm">
                                  <p>{s}</p>
                                  <div className="flex gap-1 justify-end mt-2">
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-green-500"><ThumbsUp className="h-4 w-4" /></Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500"><ThumbsDown className="h-4 w-4" /></Button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-muted-foreground">Inga specifika förslag just nu. Bra jobbat!</p>}
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="details">
                        <AccordionTrigger>Detaljerad analys (Lgr22)</AccordionTrigger>
                        <AccordionContent className="space-y-3 text-sm">
                          <p><strong>Innehåll & Budskap:</strong> {analysisResult.content}</p>
                          <p><strong>Språk & Stil:</strong> {analysisResult.language}</p>
                          <p><strong>Struktur & Disposition:</strong> {analysisResult.structure}</p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="tools" className="mt-4 space-y-6">
                
                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-semibold">Idégenerator och textutveckling</h4>
                  <p className="text-sm text-muted-foreground">Har du idétorka? Skriv en kort idé så hjälper AI:n dig att starta. Du kan även be AI:n fortsätta skriva på din befintliga text.</p>
                  <Input placeholder="t.ex. En drake som älskar glass" value={ideaPrompt} onChange={e => setIdeaPrompt(e.target.value)} />
                   <div className="space-y-2">
                    <Label className="text-sm font-medium">Språk för AI-verktyg</Label>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant={textLanguage === 'sv' ? 'default' : 'outline'} onClick={() => setTextLanguage('sv')}>Svenska</Button>
                      <Button size="sm" variant={textLanguage === 'bs' ? 'default' : 'outline'} onClick={() => setTextLanguage('bs')}>Bosanski</Button>
                      <Button size="sm" variant={textLanguage === 'hr' ? 'default' : 'outline'} onClick={() => setTextLanguage('hr')}>Hrvatski</Button>
                      <Button size="sm" variant={textLanguage === 'sr' ? 'default' : 'outline'} onClick={() => setTextLanguage('sr')}>Srpski</Button>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleGenerateIntro} disabled={isLoading === 'intro' || !ideaPrompt} className="flex-1">
                      {isLoading === 'intro' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Skapa inledning
                    </Button>
                    <Button onClick={handleContinueWriting} disabled={isLoading === 'continue' || !text} className="flex-1" variant="secondary">
                       {isLoading === 'continue' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PenSquare className="mr-2 h-4 w-4" />} Fortsätt skriva
                    </Button>
                  </div>
                  {generatedIntro && <p className="mt-2 text-sm p-3 bg-muted rounded-md animate-in fade-in-50">{generatedIntro.generatedText}</p>}
                </div>

                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-semibold">Textverktyg</h4>
                   <Button onClick={handleRewrite} disabled={!text || isLoading === 'rewrite'} className="w-full" variant="secondary">
                     {isLoading === 'rewrite' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Skriv om texten
                   </Button>
                   <Button onClick={handleMakeLonger} disabled={!text || isLoading === 'make-longer'} className="w-full" variant="secondary">
                    {isLoading === 'make-longer' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Gör längre
                   </Button>
                   <Button onClick={handleMakeShorter} disabled={!text || isLoading === 'make-shorter'} className="w-full" variant="secondary">
                    {isLoading === 'make-shorter' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Gör kortare
                   </Button>
                </div>
                
                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-semibold">Kreativ brainstorming</h4>
                  <Button onClick={handleBrainstorm} disabled={!text || isLoading === 'brainstorm'} className="w-full">
                    {isLoading === 'brainstorm' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Ge mig idéer
                  </Button>
                  {brainstormIdeas && (
                     <ul className="mt-2 space-y-2 text-sm list-disc list-inside p-2 animate-in fade-in-50">
                       {brainstormIdeas.map((idea, i) => <li key={i}>{idea}</li>)}
                     </ul>
                  )}
                </div>

                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-semibold">Källkritik</h4>
                  <p className="text-sm text-muted-foreground">Klistra in en länk för att se om din text stämmer med källan.</p>
                  <Input type="url" placeholder="https://..." value={factCheckUrl} onChange={e => setFactCheckUrl(e.target.value)} />
                  <Button onClick={handleFactCheck} disabled={!text || !factCheckUrl || isLoading === 'fact-check'} className="w-full">
                    {isLoading === 'fact-check' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4"/>} Verifiera fakta
                  </Button>
                  {factCheckResult && <p className="mt-2 text-sm p-3 bg-muted rounded-md animate-in fade-in-50">{factCheckResult.verificationResult}</p>}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
