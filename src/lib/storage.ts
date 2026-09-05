const DB_KEY = 'ticketly_db';

interface DB {
  users: import('@/types').User[];
  events: import('@/types').Event[];
  tickets: import('@/types').Ticket[];
  sessions: { token: string; userId: string; expiresAt: string }[];
}

const defaultDB: DB = {
  users: [],
  events: [],
  tickets: [],
  sessions: [],
};

function loadDB(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return { ...defaultDB };
    return JSON.parse(raw);
  } catch {
    return { ...defaultDB };
  }
}

function saveDB(db: DB) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export const storage = {
  get<K extends keyof DB>(key: K): DB[K] {
    return loadDB()[key];
  },
  set<K extends keyof DB>(key: K, value: DB[K]) {
    const db = loadDB();
    db[key] = value;
    saveDB(db);
  },
  update<K extends keyof DB>(key: K, updater: (v: DB[K]) => DB[K]) {
    const db = loadDB();
    db[key] = updater(db[key]);
    saveDB(db);
  },
  reset() {
    localStorage.removeItem(DB_KEY);
  },
};

// Seed demo events for the homepage
export function seedDemoEvents() {
  const db = loadDB();
  if (db.events.length > 0) return;

  const demoEvents: import('@/types').Event[] = [
    {
      id: 'evt_1', title: 'Neon Nights Live', description: 'An electrifying night of electronic and synthwave music featuring top DJs.', category: 'concert',
      date: new Date(Date.now() + 7 * 86400000).toISOString(), location: 'Berlin', venue: 'Arena Berlin', totalTickets: 500, availableTickets: 342,
      basePrice: 55, organizerId: 'sys', organizerName: 'Ticketly', imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80', createdAt: new Date().toISOString(),
    },
    {
      id: 'evt_2', title: 'Swan Lake Ballet', description: 'The timeless Tchaikovsky masterpiece performed by the Royal Classical Company.', category: 'theater',
      date: new Date(Date.now() + 14 * 86400000).toISOString(), location: 'Vienna', venue: 'Staatoper Wien', totalTickets: 300, availableTickets: 89,
      basePrice: 85, organizerId: 'sys', organizerName: 'Ticketly', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80', createdAt: new Date().toISOString(),
    },
    {
      id: 'evt_3', title: 'Champions League Final', description: 'The biggest football match of the year. Two European giants battle for glory.', category: 'sport',
      date: new Date(Date.now() + 21 * 86400000).toISOString(), location: 'Madrid', venue: 'Santiago Bernabéu', totalTickets: 1000, availableTickets: 123,
      basePrice: 120, organizerId: 'sys', organizerName: 'Ticketly', imageUrl: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80', createdAt: new Date().toISOString(),
    },
    {
      id: 'evt_4', title: 'Jazz Under Stars', description: 'An intimate evening of smooth jazz under the open sky with renowned artists.', category: 'concert',
      date: new Date(Date.now() + 10 * 86400000).toISOString(), location: 'New Orleans', venue: 'City Park Amphitheater', totalTickets: 200, availableTickets: 167,
      basePrice: 40, organizerId: 'sys', organizerName: 'Ticketly', imageUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&q=80', createdAt: new Date().toISOString(),
    },
    {
      id: 'evt_5', title: 'Hamlet — Modern Retelling', description: 'Shakespeare\'s tragedy reimagined in a contemporary setting by the London Stage Company.', category: 'theater',
      date: new Date(Date.now() + 18 * 86400000).toISOString(), location: 'London', venue: 'Globe Theatre', totalTickets: 250, availableTickets: 210,
      basePrice: 60, organizerId: 'sys', organizerName: 'Ticketly', imageUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&q=80', createdAt: new Date().toISOString(),
    },
    {
      id: 'evt_6', title: 'Formula 1 Grand Prix', description: 'High-speed racing action as the world\'s best drivers compete for the championship.', category: 'sport',
      date: new Date(Date.now() + 30 * 86400000).toISOString(), location: 'Monaco', venue: 'Circuit de Monaco', totalTickets: 800, availableTickets: 45,
      basePrice: 200, organizerId: 'sys', organizerName: 'Ticketly', imageUrl: 'https://images.unsplash.com/photo-1504707748692-4198028b5e97?w=800&q=80', createdAt: new Date().toISOString(),
    },
  ];

  saveDB({ ...db, events: demoEvents });
}
