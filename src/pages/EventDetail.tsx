import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService, calculateDynamicPrice } from '@/services/eventService';
import { ticketService } from '@/services/ticketService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import type { Event } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  concert: 'Concert', theater: 'Theater', sport: 'Sport',
};
const CATEGORY_COLORS: Record<string, string> = {
  concert: 'bg-pink-100 text-pink-700',
  theater: 'bg-purple-100 text-purple-700',
  sport: 'bg-green-100 text-green-700',
};

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!id) return;
    eventService.get(id).then((ev) => {
      setEvent(ev);
      setLoading(false);
    });
  }, [id]);

  async function handlePurchase() {
    if (!user || !event) return;
    setError('');
    setSuccess('');
    setPurchasing(true);
    try {
      const ticket = await ticketService.purchase(event.id, user, quantity);
      setSuccess(`Ticket purchased! Order ID: ${ticket.id}`);
      // Refresh event to show updated availability
      const updated = await eventService.get(event.id);
      if (updated) setEvent(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Purchase failed.');
    } finally {
      setPurchasing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-gray-500 mb-4">Event not found.</p>
            <Button variant="outline" onClick={() => navigate('/')}>Back to Events</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pricing = calculateDynamicPrice(event);
  const maxQty = Math.min(event.availableTickets, 10);
  const total = Math.round(pricing.finalPrice * quantity * 100) / 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <span className="text-sm text-gray-500">Event Details</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Image */}
          <div className="rounded-xl overflow-hidden bg-gray-200 h-64 md:h-80">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>

          {/* Right: Details */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[event.category]}`}>
                  {CATEGORY_LABELS[event.category]}
                </span>
                {event.availableTickets < 100 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                    Selling fast
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
              <p className="text-gray-500 mt-1">{event.venue} · {event.location}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="text-gray-400 text-xs mb-1">Date</p>
                <p className="font-medium text-gray-800">
                  {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="text-gray-400 text-xs mb-1">Organizer</p>
                <p className="font-medium text-gray-800">{event.organizerName}</p>
              </div>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed">{event.description}</p>

            {/* Dynamic Pricing Info */}
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-blue-900">Dynamic Pricing</span>
                {pricing.surgeMultiplier > 1 && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                    +{Math.round((pricing.surgeMultiplier - 1) * 100)}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-blue-700">{pricing.reason}</p>
              <p className="text-xs text-blue-500 mt-0.5">
                Base: ${event.basePrice} → <span className="font-semibold">${pricing.finalPrice}</span>/ticket
              </p>
            </div>

            {/* Inventory Bar */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-500">Availability</span>
                <span className={`font-medium ${event.availableTickets === 0 ? 'text-red-500' : 'text-gray-700'}`}>
                  {event.availableTickets} / {event.totalTickets} left
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${event.availableTickets === 0 ? 'bg-red-400' : 'bg-blue-600'}`}
                  style={{ width: `${Math.max(0, (event.availableTickets / event.totalTickets) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Section */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            {success ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-green-700 font-semibold mb-1">Purchase successful!</p>
                <p className="text-sm text-gray-500 mb-4">{success}</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => navigate('/')}>Browse More</Button>
                  <Button onClick={() => navigate('/dashboard')}>View Dashboard</Button>
                </div>
              </div>
            ) : event.availableTickets === 0 ? (
              <div className="text-center py-4">
                <p className="text-red-500 font-semibold">This event is sold out.</p>
                <Button variant="outline" className="mt-3" onClick={() => navigate('/')}>Browse Other Events</Button>
              </div>
            ) : !user ? (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-3">Sign in to purchase tickets.</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => navigate('/login')}>Sign In</Button>
                  <Button onClick={() => navigate('/register')}>Create Account</Button>
                </div>
              </div>
            ) : (
              <div>
                {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Quantity</label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1.5">Total</p>
                    <p className="text-2xl font-bold text-gray-900">${total}</p>
                  </div>
                  <Button
                    size="lg"
                    className="w-full sm:w-auto"
                    disabled={purchasing}
                    onClick={handlePurchase}
                  >
                    {purchasing ? 'Processing...' : `Buy ${quantity > 1 ? `${quantity} Tickets` : 'Ticket'}`}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
