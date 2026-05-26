import { useState } from 'react';
import { generateLLMResponse } from '../hooks/useLLM';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

export default function LLM() {
  const [prompt, setPrompt] = useState(
    'Beschreibe kurz, warum Lebensmittelrettung wichtig ist und wie Studierende davon profitieren.'
  );
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResponseText('');

    try {
      const result = await generateLLMResponse(prompt);
      setResponseText(result.output.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim LLM-Aufruf');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="size-4" /> Zurück
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">KI-Assistent</h1>
            <p className="text-sm text-muted-foreground">Lokal mit Ollama verbinden und Texte generieren.</p>
          </div>
        </div>

        <section className="space-y-4 rounded-2xl border border-input bg-surface p-5 shadow-sm">
          <label className="block text-sm font-medium text-foreground">Prompt</label>
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="min-h-[160px]"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-muted-foreground">
              Verwende dein lokal laufendes Ollama unter <code>127.0.0.1:11434</code>.
            </span>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generiere …' : 'Generieren'}
            </Button>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive mt-4">
            {error}
          </div>
        ) : null}

        {responseText ? (
          <section className="rounded-2xl border border-input bg-background p-5 mt-4 shadow-sm">
            <h2 className="text-lg font-semibold">Antwort</h2>
            <p className="whitespace-pre-wrap mt-3 text-sm leading-7">{responseText}</p>
          </section>
        ) : null}
      </main>
    </div>
  );
}
