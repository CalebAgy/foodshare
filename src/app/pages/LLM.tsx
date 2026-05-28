import { useEffect, useRef, useState } from 'react';
import { generateLLMResponse } from '../hooks/useLLM';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { Input } from '../components/ui/input';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function LLM() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // initial bot prompt
    setMessages([{ role: 'assistant', content: 'Hallo! Was ist dein Anliegen?' }]);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const reportKeywords = ['schimmel', 'schimmelig', 'verderb', 'nicht konsumierbar', 'nicht in guter', 'fremdkörper', 'ekel'];

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg: Msg = { role: 'user', content: trimmed };
    setMessages((s) => [...s, userMsg]);
    setInput('');

    // detect report intent
    const text = trimmed.toLowerCase();
    const isReport = reportKeywords.some((k) => text.includes(k));

    setLoading(true);
    try {
      if (isReport) {
        const res = await fetch('/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: trimmed }),
        });
        const data = await res.json();
        // Prefer model text; avoid JS precedence bugs (output vs message vs fallback).
        const reply =
          typeof data?.output === 'string' && data.output.trim() !== ''
            ? data.output.trim()
            : typeof data?.message === 'string' && data.message.trim() !== ''
              ? data.message.trim()
              : JSON.stringify(data, null, 2);
        const botMsg: Msg = { role: 'assistant', content: reply };
        setMessages((s) => [...s, botMsg]);
      } else {
        const system = 'Du bist ein Support-Assistent für FoodShare. Antworte knapp, freundlich und gib Handlungsempfehlungen.';
        const llm = await generateLLMResponse(trimmed, { system });
        const out = llm.output?.trim() || '';
        const botMsg: Msg = {
          role: 'assistant',
          content: out || '(Leere Antwort vom Modell – prüfe Ollama/Modell.)',
        };
        setMessages((s) => [...s, botMsg]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((s) => [...s, { role: 'assistant', content: `Fehler: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center">
      <main className="w-full max-w-md px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="size-4" /> Zurück
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">KI-Assistent</h1>
            <p className="text-sm text-muted-foreground">Support-Bot: meldungen zu unzufriedenen Kunden</p>
          </div>
        </div>

        <section className="rounded-2xl border border-input bg-card p-4 shadow-sm">
          <div className="space-y-3 max-h-[60vh] overflow-auto px-2 py-1">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                  <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="mt-4 flex gap-2">
            <Input placeholder="Schreibe hier…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
            <Button onClick={sendMessage} disabled={loading || !input.trim()}>{loading ? 'Sende…' : 'Senden'}</Button>
          </div>
        </section>
      </main>
    </div>
  );
}
