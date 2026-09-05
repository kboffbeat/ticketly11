import { storage } from '@/lib/storage';
import type { Event, EventCategory, DynamicPricingResult } from '@/types';

function uid() {
  return 'evt_' + Math.random().toString(36).slice(2, 11);
}

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const CATEGORY_IMAGES: Record<EventCategory, string> = {
  concert: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
  theater: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&q=80',
  sport: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80',
};

/**
 * Dynamic pricing policy:
 *  - >50% tickets left: 1.0x (base price)
 *  - 30–50% left: 1.15x surge
 *  - 10–30% left: 1.30x surge
 *  - <10% left: 1.50x surge (final rush)
 */
export function calculateDynamicPrice(event: Event): DynamicPricingResult {
  const { basePrice, availableTickets, totalTickets } = event;
  if (totalTickets === 0) {
    return { basePrice, surgeMultiplier: 1, finalPrice: basePrice, reason: 'No inventory' };
  }
  const ratio = availableTickets / totalTickets;
  let multiplier = 1;
  let reason = 'Standard pricing — plenty of seats available.';
  if (ratio < 0.1) {
    multiplier = 1.5;
    reason = 'Final rush — only a few seats left!';
  } else if (ratio < 0.3) {
    multiplier = 1.3;
    reason = 'Selling fast — limited availability.';
  } else if (ratio < 0.5) {
    multiplier = 1.15;
    reason = 'Moderate demand — prices rising.';
  }
  return {
    basePrice,
    surgeMultiplier: multiplier,
    finalPrice: Math.round(basePrice * multiplier * 100) / 100,
    reason,
  };
}

export const eventService = {
  async list(category?: EventCategory | 'all', search?: string): Promise<Event[]> {
    let events = storage.get('events');
    if (category && category !== 'all') {
      events = events.filter((e) => e.category === category);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q)
      );
    }
    events = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return delay(events);
  },

  async get(id: string): Promise<Event | null> {
    const events = storage.get('events');
    return delay(events.find((e) => e.id === id) || null);
  },

  async create(input: Omit<Event, 'id' | 'availableTickets' | 'createdAt' | 'imageUrl'>): Promise<Event> {
    const event: Event = {
      ...input,
      id: uid(),
      availableTickets: input.totalTickets,
      imageUrl: CATEGORY_IMAGES[input.category],
      createdAt: new Date().toISOString(),
    };
    storage.update('events', (list) => [event, ...list]);
    return delay(event);
  },

  async getByOrganizer(organizerId: string): Promise<Event[]> {
    return delay(storage.get('events').filter((e) => e.organizerId === organizerId));
  },
};
