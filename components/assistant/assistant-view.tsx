"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import PageTitle from "@/components/ui/page-title";
import { BTN_PRIMARY } from "@/components/ui/styles";
import type { AssistantMessage } from "@/lib/assistant/gemini";

const WELCOME_FALLBACK =
  "Hi, I'm your study assistant! Ask me to explain a topic, quiz you, or help you plan your studying.";

export default function AssistantView({
  greeting,
  suggestions,
}: {
  greeting: string;
  suggestions: string[];
}) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { role: "assistant", content: greeting || WELCOME_FALLBACK },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending) return;

    const history: AssistantMessage[] = [
      ...messages,
      { role: "user", content },
    ];
    setMessages(history);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = (await res.json().catch(() => null)) as {
        reply?: unknown;
        error?: unknown;
      } | null;

      if (!res.ok) {
        const friendly =
          data && typeof data.error === "string"
            ? data.error
            : `Something went wrong (HTTP ${res.status}). Please try again.`;
        setMessages((list) => [
          ...list,
          { role: "assistant", content: friendly },
        ]);
        return;
      }

      const reply =
        data && typeof data.reply === "string" ? data.reply.trim() : "";
      if (!reply) {
        setMessages((list) => [
          ...list,
          { role: "assistant", content: "I got an empty response — try asking again." },
        ]);
        return;
      }
      setMessages((list) => [
        ...list,
        { role: "assistant", content: reply },
      ]);
    } catch {
      setMessages((list) => [
        ...list,
        { role: "assistant", content: "Couldn't reach the server. Is the dev server running?" },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send(input);
    }
  }

  const showSuggestions = messages.length === 1;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <PageTitle>Assistant</PageTitle>
        <p className="mt-3 text-sm text-muted">
          Chat with Gemini. It knows your courses and topics, so explanations
          and quizzes are grounded in what you&apos;re actually studying.
        </p>
      </div>

      <section className="flex max-h-[70vh] min-h-[420px] flex-col overflow-hidden rounded-container bg-surface shadow-extruded">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((message, index) =>
            message.role === "user" ? (
              <div
                key={index}
                className="ml-auto max-w-[85%] rounded-btn bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-extruded-sm"
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            ) : (
              <div
                key={index}
                className="max-w-[90%] rounded-btn bg-surface px-4 py-3 text-sm text-ink shadow-inset-sm"
              >
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            )
          )}

          {showSuggestions && suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void send(suggestion)}
                  className="rounded-btn bg-surface px-3 py-2 text-xs font-bold text-accent shadow-inset-sm transition-all duration-300 hover:text-accent-light active:shadow-inset"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {sending && (
            <div className="flex max-w-[90%] items-center gap-2 rounded-btn bg-surface px-4 py-3 shadow-inset-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent [animation-delay:200ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent [animation-delay:400ms]" />
              <span className="ml-1 text-xs font-medium text-muted">
                Thinking…
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
          className="border-t border-ink/10 p-4"
        >
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={sending ? "Gemini is replying…" : "Ask about your courses…"}
              disabled={sending}
              aria-label="Message the study assistant"
              className="w-full min-h-[44px] rounded-btn bg-surface px-4 text-sm text-ink shadow-inset outline-none placeholder:text-muted/60 transition-shadow duration-300 focus:shadow-inset-deep disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className={`${BTN_PRIMARY} h-[44px] shrink-0`}
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-right text-[11px] font-medium text-muted">
            Enter to send
          </p>
        </form>
      </section>
    </div>
  );
}