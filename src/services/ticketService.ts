import { storage } from '@/lib/storage';
import type { Ticket, User } from '@/types';
import { calculateDynamicPrice } from './eventService';

function uid() {
  return 'tkt_' + Math.random().toString(36).slice(2, 11);
}

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const ticketService = {
  /**
   * Atomic-feeling purchase: validates inventory, computes dynamic price,
   * decrements availability, and records a ticket. If anything fails,
   * throws so the caller can surface a clear error.
   */
  async purchase(eventId: string, user: User, quantity: number): Promise<Ticket> {
    if (quantity < 1) throw new Error('Quantity must be at least 1.');

    const events = storage.get('events');
    const event = events.find((e) => e.id === eventId);
    if (!event) throw new Error('Event not found.');
    if (event.availableTickets < quantity) {
      throw new Error(`Only ${event.availableTickets} ticket(s) remaining.`);
    }

    const pricing = calculateDynamicPrice(event);
    const totalPrice = Math.round(pricing.finalPrice * quantity * 100) / 100;

    // Decrement inventory
    storage.update('events', (list) =>
      list.map((e) =>
        e.id === eventId ? { ...e, availableTickets: e.availableTickets - quantity } : e
      )
    );

    const ticket: Ticket = {
      id: uid(),
      eventId,
      userId: user.id,
      userName: user.name,
      quantity,
      totalPrice,
      purchasedAt: new Date().toISOString(),
      status: 'valid',
    };
    storage.update('tickets', (list) => [ticket, ...list]);
    return delay(ticket, 350);
  },

  async listForUser(userId: string): Promise<Ticket[]> {
    return delay(storage.get('tickets').filter((t) => t.userId === userId));
  },

  async list(): Promise<Ticket[]> {
    return delay(storage.get('tickets'));
  },
};
