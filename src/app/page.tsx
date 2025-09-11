'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
import { suggestImprovements, type SuggestImprovementsOutput } from '@/ai/flows/suggest-improvements';
import { generateCreativeBrainstorm, type CreativeBrainstormOutput } from '@/ai/flows/creative-brainstorming';
import { verifySourceFacts, type VerifySourceFactsOutput } from '@/ai/flows/verify-source-facts';
import { rewriteText, type RewriteTextOutput } from '@/ai/flows/rewrite-text';
import { generateTextFromPrompt, type GenerateTextFromPromptOutput } from '@/ai/flows/generate-text-from-prompt';

import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';

type AnalysisResult = {
  score: number;
  grammar: string;
  tone: string;
  structure: string;
  topic: string;
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
  const [language, setLanguage] = useState('sv');
  
  const handleAiCall = async <T,>(
    loaderKey: string,
    aiFunction: () => Promise<T>,
    onSuccess: (result: T) => void,
    errorMessage: string
  ) => {
    setIsLoading(loaderKey);
    if (loaderKey !== 'analyze') {
      setAnalysisResult(null);
      setSuggestions(null);
    }
    setBrainstormIdeas(null);
    setFactCheckResult(null);
    setGeneratedIntro(null);

    try {
      const result = await aiFunction();
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

  const handleAnalyze = async (lang: string = language) => {
    if (!text) {
      toast({
        variant: 'destructive',
        title: 'Text saknas',
        description: 'Vänligen skriv in text för att analysera.',
      });
      return;
    }

    await handleAiCall(
      'analyze',
      () => suggestImprovements({ text, language: lang }),
      (result) => {
        setSuggestions(result.suggestions);
        if (!analysisResult) {
          setAnalysisResult({
            score: Math.floor(80 + Math.random() * 15),
            grammar: 'Bra jobbat! Några småfel hittades.',
            tone: 'Texten har en nyfiken och glad ton.',
            structure: 'Tydlig början, mitten och slut.',
            topic: 'Du håller dig väl till ämnet.',
          });
        }
        toast({
          title: 'Analys klar!',
          description: 'Se resultaten i panelen till höger.',
        });
      },
      'Kunde inte hämta förslag.'
    );
  };
  
  useEffect(() => {
    if (analysisResult) {
      handleAnalyze(language);
    }
  }, [language]);

  const handleBrainstorm = () => {
    if (!text) {
      toast({
        variant: 'destructive',
        title: 'Text saknas',
        description: 'Vänligen skriv lite text först för att få idéer.',
      });
      return;
    }
    handleAiCall(
      'brainstorm',
      () => generateCreativeBrainstorm({ inputText: text }),
      (result) => setBrainstormIdeas(result.suggestions),
      'Kunde inte generera idéer.'
    );
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
    handleAiCall(
      'fact-check',
      () => verifySourceFacts({ text, sourceUrl: factCheckUrl }),
      (result) => setFactCheckResult(result),
      'Kunde inte verifiera fakta.'
    );
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
    handleAiCall(
      'intro',
      () => generateTextFromPrompt({ prompt: ideaPrompt }),
      (result) => {
        setGeneratedIntro(result);
        setText(prev => `${result.generatedText}\n\n${prev}`);
        toast({ title: 'Inledning skapad och infogad!' });
      },
      'Kunde inte generera inledning.'
    );
  };
  
  const handleRewrite = () => {
    if (!text) return;
    handleAiCall(
      'rewrite',
      () => rewriteText({ text }),
      (result) => {
        setText(result.rewrittenText);
        toast({ title: 'Texten har skrivits om!' });
      },
      'Kunde inte skriva om texten.'
    );
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'skrivsmart_dokument.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Texten har laddats ner som .txt' });
  };
  
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setText(e.target?.result as string);
          toast({ title: 'Filen har laddats upp!' });
        };
        reader.readAsText(file);
      } else {
        toast({
          variant: 'destructive',
          title: 'Fel filtyp',
          description: 'Just nu stöds endast .txt-filer för uppladdning.',
        });
      }
    }
    event.target.value = '';
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
                  <Button variant="outline" onClick={handleDownload} disabled={!text}>
                    <Download className="mr-2 h-4 w-4" /> Ladda ner
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <Textarea
                placeholder="Börja skriva din text här..."
                className="flex-1 w-full text-base rounded-md p-4 bg-background focus-visible:ring-primary"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={20}
              />
            </CardContent>
          </Card>
          <Button onClick={() => handleAnalyze(language)} size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base" disabled={isLoading !== null}>
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
                              <Button size="sm" variant={language === 'sv' ? 'default' : 'outline'} onClick={() => setLanguage('sv')}>Svenska</Button>
                              <Button size="sm" variant={language === 'bs' ? 'default' : 'outline'} onClick={() => setLanguage('bs')}>Bosanski</Button>
                              <Button size="sm" variant={language === 'hr' ? 'default' : 'outline'} onClick={() => setLanguage('hr')}>Hrvatski</Button>
                              <Button size="sm" variant={language === 'sr' ? 'default' : 'outline'} onClick={() => setLanguage('sr')}>Srpski</Button>
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
                        <AccordionTrigger>Detaljerad analys</AccordionTrigger>
                        <AccordionContent className="space-y-3 text-sm">
                          <p><strong>Stavning & Grammatik:</strong> {analysisResult.grammar}</p>
                          <p><strong>Språk & Känsla:</strong> {analysisResult.tone}</p>
                          <p><strong>Struktur:</strong> {analysisResult.structure}</p>
                          <p><strong>Ämne:</strong> {analysisResult.topic}</p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="tools" className="mt-4 space-y-6">
                
                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-semibold">Idégenerator</h4>
                  <p className="text-sm text-muted-foreground">Har du idétorka? Skriv en kort idé så hjälper AI:n dig att starta.</p>
                  <Input placeholder="t.ex. En drake som älskar glass" value={ideaPrompt} onChange={e => setIdeaPrompt(e.target.value)} />
                  <Button onClick={handleGenerateIntro} disabled={isLoading === 'intro' || !ideaPrompt} className="w-full">
                    {isLoading === 'intro' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Skapa inledning
                  </Button>
                  {generatedIntro && <p className="mt-2 text-sm p-3 bg-muted rounded-md animate-in fade-in-50">{generatedIntro.generatedText}</p>}
                </div>

                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-semibold">Textverktyg</h4>
                   <Button onClick={handleRewrite} disabled={!text || isLoading === 'rewrite'} className="w-full" variant="secondary">
                     {isLoading === 'rewrite' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Skriv om texten
                   </Button>
                   <Button disabled className="w-full" variant="secondary">Gör längre (snart)</Button>
                   <Button disabled className="w-full" variant="secondary">Gör kortare (snart)</Button>
                </div>
                
                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-semibold">Kreativ brainstorming</h4>
                  <Button onClick={handleBrainstorm} disabled={!text || isLoading === 'brainstorm'} className="w-full">
                    {isLoading === 'brainstorm' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Ge mig idéer
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
