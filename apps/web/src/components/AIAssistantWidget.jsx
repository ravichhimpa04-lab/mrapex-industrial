import React, { useEffect, useRef, useState } from 'react';
import { X, Send, Loader2, ExternalLink, Sparkles, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ENQUIRY_API_URL =
  'https://script.google.com/macros/s/AKfycbxe0bxrj8lMIkRhUJC2AEB_brBmNPVTYctVM1AJmMY1r7Us2lchynQFDkAcLFeOG7ji/exec';

const APEXI_OPEN = '/images/apexi-open.png';
const APEXI_BLINK = '/images/apexi-blink.png';
const APEXI_HIDE = '/images/apexi-hide.png';
const APEXI_AVATAR = '/images/apexi-avatar.png';

const quickSuggestions = ['Hydraulic Pump', 'Travel Motor', 'Swing Motor', 'Seal Kit', 'Control Valve'];
const loadingMessages = ['Searching product database...', 'Checking compatible parts...', 'Finding best match...'];
const bubbleMessages = ['Ask Me', 'Need Help?', 'Need Parts?', 'Need Quote?'];

const makeSlug = (text = '') =>
  text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function AIAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [bubbleIndex, setBubbleIndex] = useState(0);
  const [apexiFrame, setApexiFrame] = useState(APEXI_OPEN);

  const [selectedQuoteProduct, setSelectedQuoteProduct] = useState(null);
  const [quoteSending, setQuoteSending] = useState(false);
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteForm, setQuoteForm] = useState({ name: '', mobile: '', quantity: '', message: '' });

  const inputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const bubbleTimer = setInterval(() => {
      setBubbleIndex((prev) => (prev + 1) % bubbleMessages.length);
    }, 3200);
    return () => clearInterval(bubbleTimer);
  }, []);

  useEffect(() => {
    const runCycle = () => {
      setApexiFrame(APEXI_OPEN);
      setTimeout(() => setApexiFrame(APEXI_BLINK), 4200);
      setTimeout(() => setApexiFrame(APEXI_OPEN), 4450);
      setTimeout(() => setApexiFrame(APEXI_HIDE), 5200);
      setTimeout(() => setApexiFrame(APEXI_OPEN), 6300);
    };

    runCycle();
    const timer = setInterval(runCycle, 6500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!loading) {
      setLoadingIndex(0);
      return;
    }

    const timer = setInterval(() => {
      setLoadingIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1400);

    return () => clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading, selectedQuoteProduct, quoteMessage]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const askAI = async (customMessage) => {
    const currentQuestion = (customMessage || message).trim();
    if (!currentQuestion || loading) return;

    setLoading(true);
    setMessage('');
    setSelectedQuoteProduct(null);
    setQuoteMessage('');

    setChatHistory((prev) => [
      ...prev,
      { id: `${Date.now()}-user`, type: 'user', text: currentQuestion },
    ]);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/product-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentQuestion }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'AI response failed');
      }

      setChatHistory((prev) => [
        ...prev,
        {
          id: `${Date.now()}-ai`,
          type: 'ai',
          text: result.reply || '',
          products: result.products || [],
        },
      ]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          type: 'ai',
          text: 'Sorry, AI assistant is not available right now. Please try again or use Request Quote.',
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openQuoteForm = (product) => {
    setSelectedQuoteProduct(product);
    setQuoteMessage('');
    setQuoteForm({
      name: '',
      mobile: '',
      quantity: '',
      message: `I need quotation for ${product.product_name || ''}${
        product.part_number ? `. Part Number: ${product.part_number}` : ''
      }${product.make ? `. Make: ${product.make}` : ''}`,
    });
  };

  const submitQuote = async (e) => {
    e.preventDefault();
    if (!selectedQuoteProduct) return;

    setQuoteSending(true);
    setQuoteMessage('');

    const payload = {
      name: quoteForm.name,
      mobile: quoteForm.mobile,
      email: '',
      company: '',
      company_address: '',
      quantity: quoteForm.quantity,
      message: quoteForm.message,
      productName: selectedQuoteProduct.product_name || '',
      partNo: selectedQuoteProduct.part_number || '',
      category: selectedQuoteProduct.category || '',
      subCategory: selectedQuoteProduct.sub_category || '',
      make: selectedQuoteProduct.make || '',
      description: selectedQuoteProduct.description || '',
    };

    try {
      await fetch(ENQUIRY_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      setQuoteMessage('Quotation request submitted successfully.');
      setSelectedQuoteProduct(null);
    } catch {
      setQuoteMessage('Request submit nahi hui. Please dobara try karein.');
    } finally {
      setQuoteSending(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-28 right-3 sm:right-4 z-50 w-[calc(100vw-1.5rem)] max-w-sm max-h-[78vh] rounded-2xl border bg-white shadow-2xl overflow-hidden">
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white overflow-hidden border border-white/60 shadow-sm">
                <img src={APEXI_AVATAR} alt="Apexi" className="w-full h-full object-cover" />
              </div>

              <div>
                <div className="flex items-center gap-1">
                  <h3 className="font-bold text-sm">Apexi</h3>
                  <Sparkles className="w-3.5 h-3.5 opacity-90" />
                </div>
                <p className="text-xs opacity-90">Industrial Parts Assistant</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-full hover:bg-white/20"
              aria-label="Close AI assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3 max-h-[58vh] overflow-y-auto">
            {chatHistory.length === 0 && (
              <>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-white border overflow-hidden flex-shrink-0">
                    <img src={APEXI_AVATAR} alt="Apexi" className="w-full h-full object-cover" />
                  </div>

                  <div className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                    Hi 👋 I&apos;m Apexi. Tell me what industrial part you need.
                    Example: Volvo hydraulic pump, solenoid valve, seal kit, coupling.
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pl-10">
                  {quickSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => askAI(suggestion)}
                      className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </>
            )}

            {chatHistory.map((entry) =>
              entry.type === 'user' ? (
                <div
                  key={entry.id}
                  className="ml-auto max-w-[85%] rounded-xl bg-primary text-primary-foreground p-3 text-sm shadow-sm"
                >
                  {entry.text}
                </div>
              ) : (
                <div key={entry.id} className="space-y-2">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-white border overflow-hidden flex-shrink-0">
                      <img src={APEXI_AVATAR} alt="Apexi" className="w-full h-full object-cover" />
                    </div>

                    <div className="rounded-xl border p-3 text-sm text-foreground whitespace-pre-line flex-1 bg-white">
                      {entry.text}
                    </div>
                  </div>

                  {entry.products?.length > 0 && (
                    <div className="space-y-2 pl-10">
                      {entry.products.slice(0, 4).map((product) => (
                        <div
                          key={`${entry.id}-${product.id}`}
                          className="border rounded-xl p-3 text-sm bg-white shadow-sm"
                        >
                          <div className="mb-2">
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                              Possible Match
                            </span>
                          </div>

                          <div className="flex gap-3">
                            {product.image_url && (
                              <div className="w-16 h-16 bg-white border rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={product.image_url}
                                  alt={product.product_name || 'Product'}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-contain p-1"
                                />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground leading-snug">
                                {product.product_name}
                              </p>

                              {product.part_number && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Part No: {product.part_number}
                                </p>
                              )}

                              {product.make && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  Make: {product.make}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 mt-3">
                            <a
                              href={`/products/${
                                product.slug ||
                                makeSlug(`${product.product_name || ''} ${product.part_number || ''}`)
                              }`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                            >
                              View Details
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            <button
                              type="button"
                              onClick={() => openQuoteForm(product)}
                              className="text-xs font-semibold text-primary hover:underline"
                            >
                              Request Quote
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}

            {loading && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-white border overflow-hidden flex-shrink-0 animate-pulse">
                  <img src={APEXI_AVATAR} alt="Apexi" className="w-full h-full object-cover" />
                </div>

                <div className="rounded-xl border p-3 text-sm text-muted-foreground flex-1 bg-white">
                  <p>{loadingMessages[loadingIndex]}</p>
                  <div className="flex gap-1 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]"></span>
                  </div>
                </div>
              </div>
            )}

            {selectedQuoteProduct && (
              <form onSubmit={submitQuote} className="border rounded-xl p-3 space-y-2 bg-muted/30">
                <p className="text-sm font-semibold">
                  Request Quote: {selectedQuoteProduct.product_name}
                </p>

                <input
                  required
                  placeholder="Your Name"
                  value={quoteForm.name}
                  onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                />

                <input
                  required
                  placeholder="Mobile / WhatsApp Number"
                  value={quoteForm.mobile}
                  onChange={(e) => setQuoteForm({ ...quoteForm, mobile: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                />

                <input
                  placeholder="Quantity"
                  value={quoteForm.quantity}
                  onChange={(e) => setQuoteForm({ ...quoteForm, quantity: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                />

                <textarea
                  placeholder="Message"
                  value={quoteForm.message}
                  onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white min-h-[80px]"
                />

                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="flex-1" disabled={quoteSending}>
                    {quoteSending ? 'Submitting...' : 'Submit'}
                  </Button>

                  <Button type="button" size="sm" variant="outline" onClick={() => setSelectedQuoteProduct(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {quoteMessage && (
              <div className="rounded-xl border p-3 text-sm text-foreground bg-white">
                {quoteMessage}
              </div>
            )}

            <div ref={chatEndRef}></div>

            <div className="flex gap-2 sticky bottom-0 bg-white pt-2">
              <input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') askAI();
                }}
                placeholder="Type your requirement..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />

              <Button type="button" size="icon" disabled={!message.trim() || loading} onClick={() => askAI()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group fixed right-2 bottom-36 sm:right-4 sm:bottom-36 z-50 flex items-end"
          aria-label="Open Apexi assistant"
        >
          <div className="relative w-24 h-32 sm:w-28 sm:h-36 overflow-visible">
            <img
              src={apexiFrame}
              alt="Apexi Assistant"
              className="absolute right-[-18px] bottom-0 h-32 sm:h-36 max-w-none drop-shadow-xl transition-all duration-300"
            />

            <div className="absolute right-[34px] bottom-3 bg-white border border-primary/30 text-primary shadow-xl rounded-2xl px-3 py-2 flex items-center gap-2 font-bold text-xs sm:text-sm whitespace-nowrap animate-[apexiBubble_2.5s_ease-in-out_infinite] group-hover:scale-105 transition-transform">
              <MessageCircle className="w-4 h-4" />
              {bubbleMessages[bubbleIndex]}
            </div>
          </div>
        </button>
      )}

      <style>{`
        @keyframes apexiBubble {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
      `}</style>
    </>
  );
}

export default AIAssistantWidget;