'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Sparkles, RotateCcw, ArrowRight, CalendarClock } from 'lucide-react';
import { useStore } from '@/lib/store';
import { welcome, offerText } from '@/lib/assistant';
import { artistById } from '@/lib/mock/studio';
import { dayLong, hhmm, durLabel, cap } from '@/lib/dates';
import { Avatar } from '../ui';
import type { ChatMsg } from '@/lib/types';

export default function ChatWidget() {
  const { s, chatOpen, setChatOpen, chatSend, chatReset, typing, ready } = useStore();
  const [text, setText] = useState('');
  const body = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const msgs: ChatMsg[] = s.chat.messages.length ? s.chat.messages : [{ ...welcome(), id: 'w', at: '' }];

  useEffect(() => {
    body.current?.scrollTo({ top: body.current.scrollHeight });
  }, [msgs.length, typing, chatOpen]);
  useEffect(() => {
    if (chatOpen) setTimeout(() => input.current?.focus(), 250);
  }, [chatOpen]);

  const send = (t: string) => {
    if (!t.trim() || typing) return;
    chatSend(t);
    setText('');
  };
  const lastBot = [...msgs].reverse().find((m) => m.from !== 'user');

  if (!ready) return null;
  if (!chatOpen) {
    return (
      <button className="chat-fab" onClick={() => setChatOpen(true)} aria-label="Abrir el asistente">
        <span className="pulse" />
        <MessageCircle size={20} />
        <span className="lbl">¿Dudas? Pregúntame</span>
      </button>
    );
  }
  return (
    <section className="chat-panel" aria-label="Asistente de Tintamar">
      <div className="chat-head">
        <span className="av"><Sparkles size={19} /></span>
        <div className="grow">
          <div className="strong">Asistente de Tintamar</div>
          <div className="tiny" style={{ color: 'var(--cream-muted)' }}>Responde con la información del estudio y su agenda real</div>
        </div>
        <button className="icon-btn" onClick={chatReset} aria-label="Empezar de nuevo" title="Empezar de nuevo"><RotateCcw size={17} /></button>
        <button className="icon-btn" onClick={() => setChatOpen(false)} aria-label="Cerrar el asistente"><X size={20} /></button>
      </div>
      <div className="chat-body" ref={body}>
        {msgs.map((m) => (
          <div key={m.id} className="stack" style={{ gap: 8, alignItems: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
            <div className={`msg ${m.from}`}>
              {m.from === 'equipo' && <div className="who">Equipo Tintamar</div>}
              {m.text}
              {m.link && (
                <div>
                  <Link className="lnk" href={m.link.href} onClick={() => setChatOpen(false)}>{m.link.label} <ArrowRight size={14} /></Link>
                </div>
              )}
            </div>
            {m.slots && m === lastBot && (
              <div className="slot-list">
                {m.slots.map((o) => {
                  const a = artistById(o.artistId)!;
                  return (
                    <button key={`${o.artistId}${o.date}${o.start}`} className="slot-btn" onClick={() => send(offerText(o))} disabled={typing}>
                      <Avatar k={a.photo} size={36} radius={10} />
                      <span className="grow">
                        <span className="when" style={{ display: 'block' }}>{cap(dayLong(o.date))}, {hhmm(o.start)}</span>
                        <span className="tiny muted">Con {a.short} · {durLabel(o.end - o.start)}</span>
                      </span>
                      <CalendarClock size={17} color="var(--sea)" />
                    </button>
                  );
                })}
              </div>
            )}
            {m.chips && m === lastBot && (
              <div className="chat-chips">
                {m.chips.map((c) => (
                  <button key={c} className="chip" onClick={() => send(c)} disabled={typing}>{c}</button>
                ))}
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div className="typing" aria-label="Escribiendo">
            <i /><i /><i />
          </div>
        )}
      </div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <input ref={input} className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe tu pregunta" aria-label="Escribe tu pregunta" />
        <button className="send" aria-label="Enviar" disabled={typing}><Send size={18} /></button>
      </form>
      <div className="chat-foot">Si no sabe algo, te pasa con una persona del estudio. No inventa precios ni horarios.</div>
    </section>
  );
}
