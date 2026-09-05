import { storage } from '@/lib/storage';
import type { Analytics, EventCategory } from '@/types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const EMPTY_CATEGORY: Record<EventCategory, number> = { concert: 0, theater: 0, sport: 0 };

export const analyticsService = {
  async get(organizerId?: string): Promise<Analytics> {
    const allTickets = storage.get('tickets').filter((t) => t.status === 'valid');
    const allEvents = storage.get('events');

    const scopedEvents = organizerId
      ? allEvents.filter((e) => e.organizerId === organizerId)
      : allEvents;
    const scopedEventIds = new Set(scopedEvents.map((e) => e.id));
    const tickets = allTickets.filter((t) => scopedEventIds.has(t.eventId));

    const totalRevenue = tickets.reduce((sum, t) => sum + t.totalPrice, 0);
    const totalTicketsSold = tickets.reduce((sum, t) => sum + t.quantity, 0);

    const ticketsByCategory: Record<EventCategory, number> = { ...EMPTY_CATEGORY };
    const revenueByCategory: Record<EventCategory, number> = { ...EMPTY_CATEGORY };
    for (const t of tickets) {
      const ev = scopedEvents.find((e) => e.id === t.eventId);
      if (!ev) continue;
      ticketsByCategory[ev.category] += t.quantity;
      revenueByCategory[ev.category] += t.totalPrice;
    }

    const eventStats = new Map<string, { ticketsSold: number; revenue: number }>();
    for (const t of tickets) {
      const cur = eventStats.get(t.eventId) || { ticketsSold: 0, revenue: 0 };
      cur.ticketsSold += t.quantity;
      cur.revenue += t.totalPrice;
      eventStats.set(t.eventId, cur);
    }
    const topEvents = Array.from(eventStats.entries())
      .map(([eventId, stats]) => {
        const ev = scopedEvents.find((e) => e.id === eventId);
        return {
          eventId,
          eventTitle: ev?.title || 'Unknown',
          ticketsSold: stats.ticketsSold,
          revenue: Math.round(stats.revenue * 100) / 100,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return delay({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalTicketsSold,
      totalEvents: scopedEvents.length,
      ticketsByCategory,
      revenueByCategory,
      recentSales: [...tickets].sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()).slice(0, 8),
      topEvents,
    });
  },
};
