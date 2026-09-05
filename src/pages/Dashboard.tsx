import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService } from '@/services/analyticsService';
import { ticketService } from '@/services/ticketService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Analytics, Ticket } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  concert: 'bg-pink-100 text-pink-700',
  theater: 'bg-purple-100 text-purple-700',
  sport: 'bg-green-100 text-green-700',
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [tab, setTab] = useState<'overview' | 'tickets'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    Promise.all([
      analyticsService.get(user.role === 'organizer' ? user.id : undefined),
      ticketService.listForUser(user.id),
    ]).then(([a, t]) => {
      setAnalytics(a);
      setMyTickets(t);
      setLoading(false);
    });
  }, [user, navigate]);

  if (!user) return null;

  const isOrganizer = user.role === 'organizer';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
                  <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 10h8M8 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-base font-bold text-gray-900">Ticketly</span>
            </div>
            <span className="hidden sm:block text-gray-300">|</span>
            <span className="text-sm text-gray-600 hidden sm:block">{user.name}'s Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            {isOrganizer && (
              <Button size="sm" asChild><Link to="/create-event">+ New Event</Link></Button>
            )}
            <Button variant="ghost" size="sm" onClick={logout}>Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats Row */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-7 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${analytics.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Tickets Sold</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalTicketsSold}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Events</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalEvents}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">My Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{myTickets.length}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'tickets', label: 'My Tickets' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && analytics && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue by Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(['concert', 'theater', 'sport'] as const).map((cat) => (
                  <div key={cat} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${CATEGORY_COLORS[cat]}`}>
                        {cat}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${analytics.revenueByCategory[cat].toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{analytics.ticketsByCategory[cat]} tickets</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Events */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Events</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.topEvents.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No sales yet.</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.topEvents.map((ev) => (
                      <div key={ev.eventId} className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]">{ev.eventTitle}</p>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">${ev.revenue.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{ev.ticketsSold} sold</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Sales */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Recent Purchases</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.recentSales.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No purchases recorded.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-400 border-b border-gray-100">
                          <th className="pb-2 font-medium">Buyer</th>
                          <th className="pb-2 font-medium">Quantity</th>
                          <th className="pb-2 font-medium">Total</th>
                          <th className="pb-2 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {analytics.recentSales.map((sale) => (
                          <tr key={sale.id} className="text-gray-700">
                            <td className="py-2">{sale.userName}</td>
                            <td className="py-2">{sale.quantity}</td>
                            <td className="py-2 font-medium text-gray-900">${sale.totalPrice.toLocaleString()}</td>
                            <td className="py-2 text-gray-400">{new Date(sale.purchasedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'tickets' && (
          <div>
            {myTickets.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500 mb-3">You haven't purchased any tickets yet.</p>
                  <Button onClick={() => navigate('/')}>Browse Events</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myTickets.map((ticket) => (
                  <Card key={ticket.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">Order #{ticket.id.slice(-8).toUpperCase()}</p>
                          <p className="text-sm text-gray-500">
                            {ticket.quantity} ticket{ticket.quantity > 1 ? 's' : ''} ·{' '}
                            {new Date(ticket.purchasedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">${ticket.totalPrice.toLocaleString()}</p>
                          <Badge
                            className={`mt-1 ${
                              ticket.status === 'valid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {ticket.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
