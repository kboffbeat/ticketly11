import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventService } from '@/services/eventService';
import { storage, seedDemoEvents } from '@/lib/storage';
import { calculateDynamicPrice } from '@/services/eventService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Event, EventCategory } from '@/types';

const CATEGORY_LABELS: Record<EventCategory, string> = {
  concert: 'Concert', theater: 'Theater', sport: 'Sport',
};
const CATEGORY_COLORS: Record<EventCategory, string> = {
  concert: 'bg-pink-100 text-pink-700',
  theater: 'bg-purple-100 text-purple-700',
  sport: 'bg-green-100 text-green-700',
};

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<EventCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    seedDemoEvents();
    load();
  }, [category, search]);

  async function load() {
    setLoading(true);
    try {
      const data = await eventService.list(category === 'all' ? undefined : category, search);
      setEvents(data);
    } finally {
      setLoading(false);
    }
  }

  const categories: (EventCategory | 'all')[] = ['all', 'concert', 'theater', 'sport'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 10h8M8 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">Ticketly</span>
          </div>
          <nav className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:block">Hi, {user.name}</span>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild><Link to="/login">Sign In</Link></Button>
                <Button size="sm" asChild><Link to="/register">Get Started</Link></Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Find & Buy Tickets</h1>
          <p className="text-gray-500 text-lg mb-8">Concerts, theater, sports — all in one place.</p>
          <div className="flex gap-2 max-w-md mx-auto">
            <Input
              placeholder="Search events, venues, cities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex gap-2 justify-center mt-5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  category === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' ? 'All Events' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Event Grid */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="h-40 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 10v4M10 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No events found</h3>
            <p className="text-gray-500 text-sm">Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const pricing = calculateDynamicPrice(event);
              return (
                <article key={event.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-40 bg-gray-100">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[event.category]}`}>
                        {CATEGORY_LABELS[event.category]}
                      </span>
                    </div>
                    {pricing.surgeMultiplier > 1 && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          +{Math.round((pricing.surgeMultiplier - 1) * 100)}% surge
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{event.title}</h3>
                    <p className="text-sm text-gray-500 mb-1">📍 {event.location} · {event.venue}</p>
                    <p className="text-sm text-gray-400 mb-3">
                      {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-blue-600">${pricing.finalPrice}</span>
                        {pricing.surgeMultiplier > 1 && (
                          <span className="text-sm text-gray-400 line-through ml-1">${event.basePrice}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium ${event.availableTickets < 50 ? 'text-red-500' : 'text-gray-400'}`}>
                          {event.availableTickets} left
                        </p>
                        <div className="w-20 h-1 bg-gray-100 rounded-full mt-1">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all"
                            style={{ width: `${Math.max(1, (event.availableTickets / event.totalTickets) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-3"
                      size="sm"
                      disabled={event.availableTickets === 0}
                      onClick={() => user ? navigate(`/event/${event.id}`) : navigate('/login')}
                    >
                      {event.availableTickets === 0 ? 'Sold Out' : 'Get Tickets'}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
