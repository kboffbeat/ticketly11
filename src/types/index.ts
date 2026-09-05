export type EventCategory = 'concert' | 'theater' | 'sport';

export type UserRole = 'user' | 'organizer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  location: string;
  venue: string;
  totalTickets: number;
  availableTickets: number;
  basePrice: number;
  organizerId: string;
  organizerName: string;
  imageUrl: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  quantity: number;
  totalPrice: number;
  purchasedAt: string;
  status: 'valid' | 'cancelled' | 'refunded';
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export interface Analytics {
  totalRevenue: number;
  totalTicketsSold: number;
  totalEvents: number;
  ticketsByCategory: Record<EventCategory, number>;
  revenueByCategory: Record<EventCategory, number>;
  recentSales: Ticket[];
  topEvents: { eventId: string; eventTitle: string; ticketsSold: number; revenue: number }[];
}

export interface DynamicPricingResult {
  basePrice: number;
  surgeMultiplier: number;
  finalPrice: number;
  reason: string;
}
