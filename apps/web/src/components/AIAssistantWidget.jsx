import React, { useState } from 'react';
import { Bot, X, Send, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ENQUIRY_API_URL =
  'https://script.google.com/macros/s/AKfycbxe0bxrj8lMIkRhUJC2AEB_brBmNPVTYctVM1AJmMY1r7Us2lchynQFDkAcLFeOG7ji/exec';

const makeSlug = (text = '') =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function AIAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');
  const [reply, setReply] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedQuoteProduct, setSelectedQuoteProduct] = useState(null);
  const [quoteSending, setQuoteSending] = useState(false);
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteForm, setQuoteForm] = useState({
    name: '',
    mobile: '',
    quantity: '',
    message: '',
  });

  const askAI = async () => {
    if (!message.trim()) return;

    const currentQuestion = message.trim();

    setLoading(true);
    setReply('');
    setLastQuestion(currentQuestion);
    setProducts([]);
    setSelectedQuoteProduct(null);
    setQuoteMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/ai/product-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentQuestion }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'AI response failed');
      }

      setReply(result.reply || '');
      setProducts(result.products || []);
      setMessage('');
    } catch (error) {
      setReply(
        'Sorry, AI assistant is not available right now. Please try again or use Request Quote.'
      );
      setProducts([]);
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
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      setQuoteMessage('Quotation request submitted successfully.');
      setSelectedQuoteProduct(null);
    } catch (error) {
      setQuoteMessage('Request submit nahi hui. Please dobara try karein.');
    } finally {
      setQuoteSending(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm max-h-[75vh] rounded-2xl border bg-white shadow-2xl overflow-hidden">
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">MR Apex AI Assistant</h3>
              <p className="text-xs opacity-90">
                Ask about products, part numbers or machinery spares
              </p>
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

          <div className="p-4 space-y-3 max-h-[55vh] overflow-y-auto">
            <div className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              Hello! Tell me what industrial part you need. Example: Volvo
              hydraulic pump, solenoid valve, seal kit, coupling.
            </div>

            {lastQuestion && (
              <div className="ml-auto max-w-[85%] rounded-xl bg-primary text-primary-foreground p-3 text-sm">
                {lastQuestion}
              </div>
            )}

            {reply && (
              <div className="rounded-xl border p-3 text-sm text-foreground whitespace-pre-line">
                {reply}
              </div>
            )}

            {products.length > 0 && (
              <div className="space-y-2">
                {products.slice(0, 4).map((product) => (
                  <div
                    key={product.id}
                    className="border rounded-xl p-3 text-sm bg-white"
                  >
                    <p className="font-semibold text-foreground">
                      {product.product_name}
                    </p>

                    {product.part_number && (
                      <p className="text-xs text-muted-foreground">
                        Part No: {product.part_number}
                      </p>
                    )}

                    {product.make && (
                      <p className="text-xs text-muted-foreground">
                        Make: {product.make}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 mt-2">
                      <a
                        href={`/products/${
                          product.slug ||
                          makeSlug(
                            `${product.product_name || ''} ${
                              product.part_number || ''
                            }`
                          )
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

            {selectedQuoteProduct && (
              <form
                onSubmit={submitQuote}
                className="border rounded-xl p-3 space-y-2 bg-muted/30"
              >
                <p className="text-sm font-semibold">
                  Request Quote: {selectedQuoteProduct.product_name}
                </p>

                <input
                  required
                  placeholder="Your Name"
                  value={quoteForm.name}
                  onChange={(e) =>
                    setQuoteForm({ ...quoteForm, name: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                />

                <input
                  required
                  placeholder="Mobile / WhatsApp Number"
                  value={quoteForm.mobile}
                  onChange={(e) =>
                    setQuoteForm({ ...quoteForm, mobile: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                />

                <input
                  placeholder="Quantity"
                  value={quoteForm.quantity}
                  onChange={(e) =>
                    setQuoteForm({ ...quoteForm, quantity: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                />

                <textarea
                  placeholder="Message"
                  value={quoteForm.message}
                  onChange={(e) =>
                    setQuoteForm({ ...quoteForm, message: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white min-h-[80px]"
                />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    className="flex-1"
                    disabled={quoteSending}
                  >
                    {quoteSending ? 'Submitting...' : 'Submit'}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedQuoteProduct(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {quoteMessage && (
              <div className="rounded-xl border p-3 text-sm text-foreground">
                {quoteMessage}
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') askAI();
                }}
                placeholder="Type your requirement..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />

              <Button
                type="button"
                size="icon"
                disabled={!message.trim() || loading}
                onClick={askAI}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-4 z-50 bg-primary text-primary-foreground shadow-xl rounded-full px-4 py-3 flex items-center gap-2 font-semibold hover:bg-primary/90 transition-all"
        aria-label="Open AI assistant"
      >
        <Bot className="w-5 h-5" />
        Ask AI
      </button>
    </>
  );
}

export default AIAssistantWidget;