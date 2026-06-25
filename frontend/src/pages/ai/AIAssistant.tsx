import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sendAiChatMessage, fetchAiSummary, fetchAiReport } from '../../services/aiService';
import { triggerLiveActivity } from '../../utils/activityTrigger';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const SUGGESTED_QUESTIONS = [
  'How much revenue did we make today?',
  'How many pending orders do we have?',
  'Which menu item is selling the most?',
  'Which inventory items are running low?',
  'Give today\'s business summary.'
];

const AIAssistant: React.FC = () => {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load daily report on mount
  useEffect(() => {
    if (!token) return;
    const loadReport = async () => {
      try {
        setReportLoading(true);
        const data = await fetchAiReport(token);
        setReportContent(data.summary || 'No report generated yet.');
      } catch (err) {
        console.error('Failed to load AI report:', err);
      } finally {
        setReportLoading(false);
      }
    };
    loadReport();
  }, [token]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !token) return;
    
    setError(null);
    const userMsg: Message = {
      role: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text
      }));

      const aiResponseText = await sendAiChatMessage(text, historyPayload, token);

      const assistantMsg: Message = {
        role: 'assistant',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
      triggerLiveActivity('aiAssistantResponse');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'AI Assistant is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareReport = () => {
    if (!reportContent) return;
    if (navigator.share) {
      navigator.share({
        title: 'SmartServe-AI Daily Business Report',
        text: reportContent
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(reportContent);
      alert('Report copied to clipboard! Share it with your team.');
    }
  };

  const handleExportPdf = () => {
    if (!reportContent) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // Basic markdown to HTML conversion for print view
      let formattedHtml = reportContent;
      formattedHtml = formattedHtml.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
      formattedHtml = formattedHtml.replace(/^### (.*$)/gim, '<h4>$1</h4>');
      formattedHtml = formattedHtml.replace(/^## (.*$)/gim, '<h3>$1</h3>');
      formattedHtml = formattedHtml.replace(/^# (.*$)/gim, '<h2>$1</h2>');
      formattedHtml = formattedHtml.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formattedHtml = formattedHtml.replace(/^\*\s+(.*$)/gim, '<ul><li>$1</li></ul>');
      formattedHtml = formattedHtml.replace(/^-\s+(.*$)/gim, '<ul><li>$1</li></ul>');
      formattedHtml = formattedHtml.replace(/<\/ul>\s*<ul>/g, '');
      formattedHtml = formattedHtml.replace(/\n/g, '<br>');

      printWindow.document.write(`
        <html>
          <head>
            <title>SmartServe-AI Daily Business Report</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
              h1 { color: #0891b2; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 24px; font-weight: 800; }
              h2 { color: #0f172a; margin-top: 32px; font-size: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
              h3 { color: #334155; margin-top: 24px; font-size: 16px; }
              h4 { color: #475569; margin-top: 16px; }
              pre { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; overflow-x: auto; margin: 16px 0; }
              code { font-family: monospace; font-size: 13px; }
              ul { padding-left: 24px; margin: 8px 0; list-style-type: disc; }
              li { margin-bottom: 6px; }
              strong { color: #0f172a; font-weight: 700; }
              .header { text-align: right; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; }
            </style>
          </head>
          <body>
            <div class="header">SmartServe-AI • Generated on ${new Date().toLocaleDateString()}</div>
            <h1>Daily Business Summary Report</h1>
            <div>${formattedHtml}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Custom Markdown & Code Block renderer
  const renderMarkdown = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1').trim();
        return (
          <pre key={index} className="bg-slate-950 p-4 rounded-2xl border border-white/5 overflow-x-auto text-xs text-cyan-300 font-mono my-3 shadow-inner max-w-full">
            <code>{code}</code>
          </pre>
        );
      }

      const lines = part.split('\n');
      return (
        <div key={index} className="space-y-2">
          {lines.map((line, lIdx) => {
            if (line.startsWith('### ')) {
              return <h4 key={lIdx} className="text-sm font-bold text-cyan-300 mt-3">{line.replace('### ', '')}</h4>;
            }
            if (line.startsWith('## ')) {
              return <h3 key={lIdx} className="text-base font-bold text-white mt-4 border-b border-white/5 pb-1">{line.replace('## ', '')}</h3>;
            }
            if (line.startsWith('# ')) {
              return <h2 key={lIdx} className="text-lg font-extrabold text-white mt-5">{line.replace('# ', '')}</h2>;
            }

            if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
              const listContent = line.replace(/^\s*[\*\-]\s+/, '');
              return (
                <ul key={lIdx} className="list-disc pl-5 text-slate-300 text-xs">
                  <li className="my-1">{renderInline(listContent)}</li>
                </ul>
              );
            }

            const numMatch = line.match(/^\s*(\d+)\.\s+(.*)/);
            if (numMatch) {
              return (
                <ol key={lIdx} className="list-decimal pl-5 text-slate-300 text-xs">
                  <li className="my-1">{renderInline(numMatch[2])}</li>
                </ol>
              );
            }

            if (!line.trim()) return <div key={lIdx} className="h-2" />;

            return <p key={lIdx} className="text-xs text-slate-300 leading-relaxed">{renderInline(line)}</p>;
          })}
        </div>
      );
    });
  };

  const renderInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-cyan-200">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <section className="rounded-[2rem] border surface-border surface-panel p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">AI Assistant</p>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold text-white">AI Restaurant Assistant</h1>
          <p className="mt-2 text-sm text-slate-400">Ask questions and analyze restaurant insights using live business context.</p>
        </div>
      </section>

      {/* Main chat and details sections */}
      <div className="grid gap-8 lg:grid-cols-[1.5fr_0.5fr]">
        
        {/* Left: Chat Container */}
        <div className="flex flex-col rounded-[2rem] border surface-border surface-panel shadow-2xl backdrop-blur-xl h-[65vh] overflow-hidden">
          
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-slate-950/20">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Live Intelligence Stream</h3>
                <p className="text-4xs text-slate-500 font-bold uppercase tracking-wider">Gemini 2.5 Flash</p>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="text-xs font-semibold text-slate-400 hover:text-white transition duration-150 active:scale-95"
              >
                Clear Chat
              </button>
            )}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin bg-slate-950/10">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 shadow-xl">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Welcome, {user?.name || 'Manager'}</h3>
                  <p className="mt-1.5 text-xs text-slate-400 max-w-sm">I have loaded your restaurant's live menus, inventory levels, tables, reservations, and sales reports. How can I help you today?</p>
                </div>

                <div className="w-full max-w-md space-y-2">
                  <p className="text-3xs uppercase font-extrabold tracking-widest text-slate-500 text-left px-1">Suggested Questions</p>
                  <div className="grid gap-2">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSendMessage(q)}
                        className="w-full text-left rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition duration-200"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-4xs text-slate-500 font-semibold">{m.timestamp}</span>
                      <span className="text-4xs uppercase tracking-wider font-extrabold text-slate-400">
                        {m.role === 'user' ? 'You' : 'Assistant'}
                      </span>
                    </div>

                    <div
                      className={`relative max-w-[85%] rounded-3xl p-4 border text-xs shadow-lg ${
                        m.role === 'user'
                          ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-100 rounded-tr-none'
                          : 'bg-white/[0.02] border-white/5 text-slate-300 rounded-tl-none'
                      }`}
                    >
                      {m.role === 'assistant' ? renderMarkdown(m.text) : <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>}

                      {m.role === 'assistant' && (
                        <button
                          onClick={() => handleCopyText(m.text, idx)}
                          className="absolute right-3 bottom-3 text-slate-500 hover:text-slate-300 transition duration-150"
                          title="Copy response"
                        >
                          {copiedId === idx ? (
                            <span className="text-[10px] text-emerald-400 font-bold">Copied</span>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex flex-col items-start">
                    <span className="text-4xs uppercase tracking-wider font-extrabold text-slate-400 mb-1">Thinking...</span>
                    <div className="flex items-center gap-1.5 p-3.5 rounded-3xl bg-white/[0.02] border border-white/5 shadow-lg">
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                {error && (
                  <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-3 text-red-200 text-xs">
                    {error}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input Footer */}
          <div className="border-t border-white/5 p-4 bg-slate-950/30">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about inventory, sales trends, table status..."
                disabled={loading}
                className="flex-1 rounded-2xl border border-white/5 bg-slate-950/50 px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition duration-150"
              />
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="rounded-2xl bg-cyan-500 hover:bg-cyan-400 px-5 py-3 text-xs font-bold text-slate-950 shadow-lg active:scale-97 transition duration-150 disabled:opacity-40 disabled:scale-100"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Right: Quick Actions & Report View */}
        <div className="space-y-8">
          
          {/* Quick Actions Panel */}
          <div className="rounded-[2rem] border surface-border surface-panel p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Quick Actions</h3>
            <div className="grid gap-2">
              {[
                { label: 'Today\'s Revenue', q: 'How much revenue did we make today?' },
                { label: 'Today\'s Orders', q: 'How many orders do we have today and what are their statuses?' },
                { label: 'Inventory Status', q: 'What is the status of our inventory?' },
                { label: 'Top Selling Items', q: 'Which menu items are selling the most?' },
                { label: 'Low Stock Items', q: 'Which inventory items are running low?' },
                { label: 'Today\'s Reservations', q: 'Show today\'s reservations.' },
                { label: 'Employee Performance', q: 'Summarize employee performance today.' },
                { label: 'Customer Insights', q: 'Give me customer insights. Which customers should we reward?' },
                { label: 'Restaurant Health Score', q: 'What is our restaurant health score and how was it calculated?' }
              ].map((act) => (
                <button
                  key={act.label}
                  onClick={() => handleSendMessage(act.q)}
                  disabled={loading}
                  className="w-full text-left rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-cyan-500/10 hover:text-cyan-200 px-4 py-2.5 text-xs text-slate-300 font-medium transition duration-200"
                >
                  {act.label}
                </button>
              ))}
            </div>
          </div>

          {/* Daily summary / Daily report panel */}
          <div className="rounded-[2rem] border surface-border surface-panel p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Daily Report</h3>
              {reportContent && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportPdf}
                    className="text-slate-400 hover:text-white transition"
                    title="Export PDF"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-3a2 2 0 00-2-2H5a2 2 0 00-2 2v3a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleShareReport}
                    className="text-slate-400 hover:text-white transition"
                    title="Share / Copy"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {reportLoading ? (
              <div className="h-32 flex flex-col items-center justify-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                <span className="text-4xs font-bold text-slate-500 uppercase tracking-widest">Generating Summary</span>
              </div>
            ) : reportContent ? (
              <div className="max-h-[30vh] overflow-y-auto pr-1 text-slate-400 leading-relaxed space-y-2 border border-white/5 bg-slate-950/20 p-4 rounded-2xl scrollbar-thin text-3xs select-text">
                {renderMarkdown(reportContent)}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No summary generated yet.</p>
            )}
            
            <button
              onClick={() => handleSendMessage("Generate today's daily business summary report.")}
              disabled={loading}
              className="mt-4 w-full rounded-2xl bg-cyan-500/10 px-4 py-3 text-xs font-semibold text-cyan-200 ring-1 ring-cyan-400/20 hover:bg-cyan-500/15 transition active:scale-97"
            >
              Ask AI to Explain Report
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
