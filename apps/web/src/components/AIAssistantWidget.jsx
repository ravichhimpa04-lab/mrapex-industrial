import React, { useState } from 'react';
import { Bot, X, Send, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001';

const makeSlug = (text = '') =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function AIAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setReply('');
    setProducts([]);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/product-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'AI response failed');
      }

      setReply(result.reply || '');
      setProducts(result.products || []);
    } catch (error) {
      setReply('Sorry, AI assistant is not available right now. Please try again or use Request Quote.');
      setProducts([]);
    } finally {
      setLoading(false);
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

                    <a
                      href={`/products/${
                        product.slug ||
                        makeSlug(
                          `${product.product_name || ''} ${
                            product.part_number || ''
                          }`
                        )
                      }`}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      View Details
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
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