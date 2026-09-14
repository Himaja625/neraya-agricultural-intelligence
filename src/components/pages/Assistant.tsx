import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useSpeechToText, useTextToSpeech } from '@/lib/voice';
import {
  getConversations, getConversationMessages, createConversation,
  addMessage, getFields, getAssessments,
} from '@/lib/db';
import { sendChatMessage, type ConversationContext } from '@/lib/ai';
import { getWeather } from '@/lib/weather';
import type { Conversation, ConversationMessage, Field, CropAssessment, WeatherData } from '@/types';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import {
  MessageSquare, Send, Plus, Sprout, ArrowLeft, Mic, Loader2,
  FlaskConical, Clock, X, Volume2, Square,
} from '@/components/ui/Icons';

export default function Assistant() {
  const { profile } = useAuth();
  const { t, lang } = useI18n();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const { listening, start: startListening, stop: stopListening, supported: sttSupported } = useSpeechToText(lang, setInput);
  const { speaking, speak, stop: stopSpeaking, supported: ttsSupported } = useTextToSpeech(lang);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [fields, setFields] = useState<Field[]>([]);
  const [assessments, setAssessments] = useState<CropAssessment[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const [convs, flds] = await Promise.all([
        getConversations(profile.user_id),
        getFields(profile.user_id),
      ]);
      setConversations(convs);
      setFields(flds);
      if (flds.length > 0 && flds[0].latitude && flds[0].longitude) {
        const w = await getWeather(flds[0].latitude, flds[0].longitude);
        setWeather(w.current);
      }
      setLoading(false);
    })();
  }, [profile]);

  useEffect(() => {
    if (activeConversation) {
      getConversationMessages(activeConversation.id).then(setMessages);
    }
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadContext(field: Field | null): Promise<ConversationContext> {
    if (!profile) return {};
    if (field) {
      const a = await getAssessments(profile.user_id, field.id);
      setAssessments(a);
      let currentWeather = weather;
      if (field.latitude && field.longitude) {
        const w = await getWeather(field.latitude, field.longitude);
        setWeather(w.current);
        currentWeather = w.current;
      }
      return { field, recentAssessments: a, weather: currentWeather, profileName: profile.full_name, cropsGrown: profile.crops_grown, language: lang };
    }
    const a = await getAssessments(profile.user_id);
    setAssessments(a);
    return { recentAssessments: a, weather, profileName: profile.full_name, cropsGrown: profile.crops_grown, language: lang };
  }

  async function startNewConversation() {
    if (!profile) return;
    const conv = await createConversation(profile.user_id, selectedField?.id ?? null, 'New conversation');
    if (conv) {
      setConversations([conv, ...conversations]);
      setActiveConversation(conv);
      setMessages([]);
      setShowSidebar(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !profile) return;
    setSending(true);

    let conv = activeConversation;
    if (!conv) {
      conv = await createConversation(profile.user_id, selectedField?.id ?? null, input.slice(0, 50));
      if (conv) {
        setConversations([conv, ...conversations]);
        setActiveConversation(conv);
      }
    }

    if (!conv) return;

    const userMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      conversation_id: conv.id,
      user_id: profile.user_id,
      role: 'user',
      content: input,
      metadata: {},
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');

    await addMessage(conv.id, profile.user_id, 'user', currentInput);

    const context = await loadContext(selectedField);
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const response = await sendChatMessage(currentInput, history, context);

    const assistantMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      conversation_id: conv.id,
      user_id: profile.user_id,
      role: 'assistant',
      content: response,
      metadata: {},
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, assistantMessage]);
    await addMessage(conv.id, profile.user_id, 'assistant', response);

    setSending(false);
  }

  if (loading) return <LoadingState label={t('common.loading')} />;

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar - conversations */}
      <div className={`${showSidebar ? 'absolute inset-0 z-30 lg:relative' : 'hidden lg:block'} w-72 bg-white border-r border-forest-100 flex flex-col`}>
        <div className="p-4 border-b border-forest-100">
          <button onClick={startNewConversation} className="btn-primary w-full">
            <Plus size={18} /> {t('assistant.newConversation')}
          </button>
        </div>
        {/* Field selector */}
        <div className="px-4 py-3 border-b border-forest-100">
          <label className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-1.5 block">{t('assistant.fieldContext')}</label>
          <select
            value={selectedField?.id ?? ''}
            onChange={e => {
              const f = fields.find(x => x.id === e.target.value);
              setSelectedField(f ?? null);
              if (f) loadContext(f);
            }}
            className="w-full text-sm px-3 py-2 rounded-lg bg-forest-50 border border-forest-100 text-forest-700 focus:outline-none focus:border-forest-300"
          >
            <option value="">{t('assistant.allFields')}</option>
            {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2">
          {conversations.length === 0 ? (
            <p className="text-xs text-forest-400 px-2 py-4 text-center">{t('assistant.emptyTitle')}</p>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => { setActiveConversation(conv); setShowSidebar(false); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 transition-all ${
                  activeConversation?.id === conv.id ? 'bg-forest-50 text-forest-800' : 'text-forest-600 hover:bg-forest-50/50'
                }`}
              >
                <p className="text-sm font-medium truncate">{conv.title ?? 'Conversation'}</p>
                <p className="text-2xs text-forest-400 mt-0.5">{new Date(conv.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-forest-50">
        {/* Header */}
        <div className="px-4 lg:px-6 py-3 bg-white border-b border-forest-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(!showSidebar)} className="lg:hidden p-1.5 rounded-lg text-forest-600 hover:bg-forest-50">
              {showSidebar ? <X size={18} /> : <MessageSquare size={18} />}
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-700 text-white">
              <Sprout size={18} />
            </div>
            <div>
              <h1 className="font-serif text-base font-medium text-forest-900">{t('assistant.title')}</h1>
              {selectedField && <p className="text-2xs text-forest-400">{t('assistant.subtitle', { name: selectedField.name })}</p>}
            </div>
          </div>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success-400" />
            <span className="text-2xs text-forest-400">{t('assistant.ready')}</span>
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 lg:px-6 py-6">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto">
              <div className="text-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-700 text-white mx-auto mb-5">
                  <Sprout size={28} />
                </div>
                <h2 className="font-serif text-xl font-medium text-forest-900 mb-2">{t('assistant.emptyTitle')}</h2>
                <p className="text-sm text-forest-500 max-w-md mx-auto mb-8">
                  {t('assistant.emptyDesc')}
                </p>
                <div className="grid sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                  {[
                    selectedField
                      ? `What's happening in my ${selectedField.crop_type ?? 'crop'} field?`
                      : "What should I check in my field today?",
                    selectedField && assessments.length > 0
                      ? "Compare my latest crop scan with the previous one."
                      : "Help me understand a crop symptom I'm seeing.",
                    weather
                      ? "What should I check after today's weather?"
                      : "What should I look for when checking my crop?",
                    "I'm not sure if I need to take action or just monitor.",
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(suggestion)}
                      className="text-left p-3 rounded-xl border border-forest-100 bg-white hover:border-forest-200 hover:bg-forest-50/30 transition-all"
                    >
                      <p className="text-sm text-forest-600">{suggestion}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-forest-700 text-white mr-2.5 mt-0.5">
                      <Sprout size={16} />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-forest-700 text-white rounded-tr-sm'
                      : 'bg-white text-forest-800 border border-forest-100 rounded-tl-sm'
                  }`}>
                    <div className="flex items-start gap-2">
                      <p className="flex-1">{msg.content}</p>
                      {msg.role === 'assistant' && ttsSupported && (
                        <button
                          onClick={() => (speaking ? stopSpeaking() : speak(msg.content))}
                          className="flex-shrink-0 mt-0.5 p-1 rounded-lg text-forest-300 hover:text-forest-600 hover:bg-forest-50 transition-all"
                          title={speaking ? 'Stop' : 'Listen'}
                        >
                          {speaking ? <Square size={14} /> : <Volume2 size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start animate-fade-in">
                  <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-forest-700 text-white mr-2.5 mt-0.5">
                    <Sprout size={16} />
                  </div>
                  <div className="bg-white border border-forest-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-forest-300 animate-pulse" />
                      <div className="w-1.5 h-1.5 rounded-full bg-forest-300 animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-forest-300 animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 lg:px-6 py-4 bg-white border-t border-forest-100">
          <div className="max-w-2xl mx-auto flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={t('assistant.placeholder')}
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-forest-50 border border-forest-100 text-sm text-forest-800 placeholder:text-forest-400 focus:outline-none focus:border-forest-300 resize-none"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={() => (listening ? stopListening() : startListening())}
              disabled={!sttSupported}
              className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-all ${
                listening
                  ? 'bg-error-500 text-white border-error-500 animate-pulse'
                  : 'bg-white border-forest-100 text-forest-400 hover:text-forest-600 hover:bg-forest-50'
              } ${!sttSupported ? 'opacity-40 cursor-not-allowed' : ''}`}
              title={listening ? 'Stop recording' : 'Speak your message'}
            >
              {listening ? <Square size={18} /> : <Mic size={18} />}
            </button>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest-700 text-white hover:bg-forest-800 active:scale-95 transition-all disabled:opacity-40"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <p className="text-2xs text-forest-400 text-center mt-2 max-w-2xl mx-auto">
            {t('assistant.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
}
