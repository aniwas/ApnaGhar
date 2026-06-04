import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, CornerDownLeft, Loader2, ArrowRight } from 'lucide-react';
import { Property } from '../types';

interface AISmartBrokerProps {
  onSelectProperty: (property: Property) => void;
  properties: Property[];
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  sender: 'ai' | 'user';
  text: string;
  recommendations?: { id: string; reason: string }[];
  isThinking?: boolean;
}

export default function AISmartBroker({ onSelectProperty, properties, isOpen, onClose }: AISmartBrokerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Namaste! I am your ApnaGhar AI Smart Broker. 🏡✨\n\nI can analyze our entire live property inventory and match you with the absolute best options suited to your budget, location, and lifestyle. What are you looking for today?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const quickQuestions = [
    { label: '4 BHK Worli Penthouses', query: 'Show me ultra luxury properties at Worli Seaface with premium views, budget over 10 Cr.' },
    { label: 'Noida Rental Apartments', query: 'I need a 2 or 3 BHK semi-furnished apartment for rent in Noida around 45k.' },
    { label: 'Gurgaon Offices', query: 'Looking for a premium plug-and-play commercial corporate suite in Gurgaon DLF.' },
    { label: 'Bangalore Plots', query: 'Are there any residential plots for construction in Bangalore?' }
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isRequesting) return;

    const userMsg = textToSend.trim();
    setInputText('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);

    // Add thinking text bubble
    setMessages(prev => [
      ...prev,
      { sender: 'ai', text: 'Analyzing database properties and matching criteria...', isThinking: true }
    ]);

    setIsRequesting(true);

    try {
      // Formulate simple recommendation parameters based on keywords parsed or let Gemini do zero-shot directly
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customInput: userMsg,
          userBudget: 200000000, // Large ceiling
          preferredCity: '',
          preferredCategory: ''
        })
      });

      if (!response.ok) {
        throw new Error('API server returned error or is uninitialized');
      }

      const data = await response.json();
      
      // Remove thinking bubble and add response
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isThinking);
        return [
          ...filtered,
          {
            sender: 'ai',
            text: data.explanation || 'Based on your requirement, here are our best matches:',
            recommendations: data.recommendations || []
          }
        ];
      });

    } catch (err: any) {
      console.warn('Gemini proxy error:', err);
      // Fallback: Perform intuitive local regex matchmaking so the user is never left with an empty error!
      const normalizedQuery = userMsg.toLowerCase();
      let matchedProps = properties.filter(p => 
        normalizedQuery.includes(p.location.city.toLowerCase()) ||
        normalizedQuery.includes(p.location.area.toLowerCase()) || 
        normalizedQuery.includes(p.category.toLowerCase()) ||
        normalizedQuery.includes(p.type.toLowerCase()) ||
        normalizedQuery.includes(p.title.toLowerCase())
      );

      if (matchedProps.length === 0) {
        // Broaden to category-based matching
        if (normalizedQuery.includes('office') || normalizedQuery.includes('shop') || normalizedQuery.includes('commercial')) {
          matchedProps = properties.filter(p => p.category === 'COMMERCIAL');
        } else if (normalizedQuery.includes('plot') || normalizedQuery.includes('land')) {
          matchedProps = properties.filter(p => p.category === 'LAND');
        } else {
          matchedProps = properties.filter(p => p.category === 'RESIDENTIAL');
        }
      }

      const backupRecommendations = matchedProps.slice(0, 2).map(p => ({
        id: p.id,
        reason: `Matched listing "${p.title}" located in ${p.location.city} with price model matching your keywords.`
      }));

      setMessages(prev => {
        const filtered = prev.filter(m => !m.isThinking);
        return [
          ...filtered,
          {
            sender: 'ai',
            text: `(Offline AI Matchmaker Mode) I have searched our listings and filtered the top matching result for you right away:\n\n*Note: To test the live generative Gemini matchmaker with full reasoning, make sure to add your GEMINI_API_KEY inside the "Secrets" panel in the Settings!*`,
            recommendations: backupRecommendations
          }
        ];
      });
    } finally {
      setIsRequesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-115 z-50 backdrop-blur-2xl bg-slate-950/95 border-l border-white/10 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
      
      {/* Drawer Header */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-905/60">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-2 rounded-xl text-white shadow-md border border-white/10">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-sans">AI Smart Broker</h2>
            <span className="text-[10px] font-mono text-blue-400 tracking-wider">ONLINE CHAT GROUNDED IN DB</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 px-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-semibold cursor-pointer"
        >
          Close
        </button>
      </div>

      {/* Chats Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            
            {msg.sender === 'ai' && (
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Bot className="h-4.5 w-4.5" />
              </div>
            )}

            <div className={`max-w-[85%] flex flex-col gap-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-semibold shadow-md rounded-tr-none' : 'bg-slate-900 border border-white/10 text-slate-200 rounded-tl-none'}`}
              >
                {msg.isThinking ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="h-4.5 w-4.5 animate-spin text-blue-400" />
                    <span>{msg.text}</span>
                  </div>
                ) : (
                  msg.text
                )}
              </div>

              {/* Match recommendations */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="w-full space-y-2 mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block font-mono">Matched Properties:</span>
                  {msg.recommendations.map((rec) => {
                    const matchedProp = properties.find(p => p.id === rec.id);
                    if (!matchedProp) return null;

                    return (
                      <div 
                        key={rec.id}
                        onClick={() => {
                          onSelectProperty(matchedProp);
                        }}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-blue-500/40 cursor-pointer transition-all flex gap-3 group"
                      >
                        <img 
                          src={matchedProp.images[0]} 
                          alt={matchedProp.title}
                          className="w-14 h-14 rounded-lg object-cover bg-slate-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                            {matchedProp.title}
                          </h4>
                          <span className="text-[10px] font-mono text-blue-400 block font-semibold">
                            ₹{(matchedProp.price >= 10000000 ? `${(matchedProp.price/10000000).toFixed(1)} Cr` : `${(matchedProp.price/100000).toFixed(1)} Lakh`)} • {matchedProp.location.city}
                          </span>
                          <p className="text-[10px] text-white/60 line-clamp-2 mt-1">
                            {rec.reason}
                          </p>
                          <span className="text-[9px] text-blue-400 flex items-center gap-1 font-semibold mt-1">
                            Click to expand details <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatBottomRef} />
      </div>

      {/* Quick query templates */}
      {messages.length === 1 && (
        <div className="px-4 py-2 border-t border-white/5 bg-slate-950/40">
          <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider block mb-1.5 font-mono">Quick Inquiries:</span>
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((q, qidx) => (
              <button
                key={qidx}
                onClick={() => handleSendMessage(q.query)}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-blue-500/20 text-slate-350 rounded-lg py-1 px-2.5 transition-all text-left truncate max-w-full cursor-pointer"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input controls */}
      <div className="p-4 border-t border-white/10 bg-slate-900/60 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask AI Broker..."
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
          className="flex-1 bg-slate-950 border border-white/10 hover:border-white/15 focus:border-blue-500/50 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans"
        />
        <button
          onClick={() => handleSendMessage(inputText)}
          className="p-2 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white border border-white/10 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      </div>

    </div>
  );
}
