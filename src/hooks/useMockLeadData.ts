import { useState, useMemo } from 'react';
import {
  QueueLead,
  QueueCounts,
  TodayProgress,
  Priority,
  QueueType,
  formatTimeSince,
} from '../types/queue';

// San Antonio addresses for realistic mock data
const MOCK_ADDRESSES = [
  '1234 Alamo Heights Dr, San Antonio, TX 78209',
  '5678 Stone Oak Pkwy, San Antonio, TX 78258',
  '910 King William St, San Antonio, TX 78204',
  '2345 Huebner Rd, San Antonio, TX 78248',
  '6789 Fredericksburg Rd, San Antonio, TX 78201',
  '3456 Broadway St, San Antonio, TX 78209',
  '7890 Babcock Rd, San Antonio, TX 78240',
  '1111 Culebra Rd, San Antonio, TX 78228',
  '2222 Nacogdoches Rd, San Antonio, TX 78217',
  '3333 West Ave, San Antonio, TX 78213',
  '4444 Perrin Beitel Rd, San Antonio, TX 78218',
  '5555 Bandera Rd, San Antonio, TX 78238',
  '6666 Blanco Rd, San Antonio, TX 78216',
  '7777 San Pedro Ave, San Antonio, TX 78212',
  '8888 Austin Hwy, San Antonio, TX 78209',
  '9999 Vance Jackson Rd, San Antonio, TX 78230',
  '1010 Commerce St, San Antonio, TX 78205',
  '2020 McCullough Ave, San Antonio, TX 78212',
  '3030 Wurzbach Rd, San Antonio, TX 78240',
  '4040 Pat Booker Rd, San Antonio, TX 78148',
];

const TEMPLATE_NAMES = [
  'Initial Outreach',
  'Quick Follow-Up',
  'Price Discussion',
  'Appointment Request',
  'Cash Offer Intro',
];

const MESSAGE_PREVIEWS = [
  "Hi! I noticed your property at {address}. I'm interested in making a cash offer...",
  "Following up on my previous message. I'd love to discuss your property...",
  "I wanted to reach out about potentially purchasing your property...",
  "Would you be open to discussing a quick sale of your property?",
  "I help homeowners sell quickly. Would you consider a cash offer?",
];

const NEIGHBORHOOD_GRADES = ['A', 'B', 'B', 'C', 'C', 'C', 'D'];

const AI_SUMMARIES = [
  'Strong investment opportunity. Property is priced 15% below market with minimal repairs needed. Neighborhood shows consistent appreciation over 5 years. Seller appears motivated based on listing history.',
  'Moderate deal potential. ARV estimates suggest 20% equity after rehab. Property needs cosmetic updates but no major structural issues. Area has good rental demand.',
  'High-priority lead. Seller has reduced price twice in 30 days indicating motivation. Comparable sales support ARV of $185k. Estimated rehab $15-20k for full renovation.',
  'Good flip candidate. Property vacant for 6+ months. Tax records show out-of-state owner. Neighborhood grade B with strong school ratings driving demand.',
  'Caution advised. Property priced at market value with limited upside. May work as rental but margins tight for flip. Consider negotiating 10-15% below asking.',
  'Excellent entry point for buy-and-hold strategy. Below-market rent potential of $1,400/mo. Cap rate estimated at 8.2% based on current asking price.',
  'Mixed signals. Good location and lot size but property needs significant rehab ($40k+). Run numbers carefully before making offer. Could be great deal at right price.',
  'Hot lead - act fast. New listing in high-demand area. Similar properties selling within 2 weeks. Strong rental comps and appreciation history.',
];

/**
 * Generates a single mock lead with realistic data
 */
const generateMockLead = (index: number): QueueLead => {
  const address = MOCK_ADDRESSES[index % MOCK_ADDRESSES.length];
  const createdHoursAgo = Math.random() * 72; // 0-72 hours ago
  const createdAt = new Date(Date.now() - createdHoursAgo * 3600000).toISOString();

  // Determine status and priority based on various factors
  const statuses: Array<QueueLead['status']> = [
    'New', 'New', 'New', 'New', // 40% New
    'Contacted', 'Contacted', // 20% Contacted
    'Responding', // 10% Responding
    'Negotiating', // 10% Negotiating
    'UnderContract', // 10% Under Contract
    'Archived', // 10% Archived
  ];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  // Score between 1-10, weighted toward middle
  const score = Math.min(10, Math.max(1, Math.floor(Math.random() * 4 + 5 + (Math.random() - 0.5) * 6)));

  // MAO and spread based on score
  const listingPrice = Math.floor(Math.random() * 200000 + 80000);
  const mao = Math.floor(listingPrice * (0.5 + score / 20)); // Higher score = closer to listing
  const spreadPercent = Math.round(((listingPrice - mao) / listingPrice) * 100);

  // Neighborhood grade
  const neighborhoodGrade = NEIGHBORHOOD_GRADES[Math.floor(Math.random() * NEIGHBORHOOD_GRADES.length)];

  // Priority based on score, time, and status
  let priority: Priority = 'normal';
  if (status === 'New' && score >= 8 && createdHoursAgo < 12) {
    priority = 'urgent';
  } else if (status === 'New' && score >= 6) {
    priority = 'high';
  } else if (status === 'Responding' || status === 'Negotiating') {
    priority = 'high';
  } else if (score >= 5) {
    priority = 'medium';
  }

  // Follow-up tracking
  const hasFollowUp = status === 'Contacted' || status === 'Responding';
  const followUpDate = hasFollowUp
    ? new Date(Date.now() + (Math.random() - 0.3) * 86400000).toISOString()
    : undefined;
  const followUpDue = followUpDate ? new Date(followUpDate) <= new Date() : false;

  // AI evaluation summary - most leads have this from the evaluation pipeline
  const aiSummary = Math.random() > 0.2
    ? AI_SUMMARIES[Math.floor(Math.random() * AI_SUMMARIES.length)]
    : undefined;

  // AI suggestion for new/contacted leads (legacy, being replaced by aiSummary)
  const aiSuggestion =
    status === 'New' || status === 'Contacted'
      ? {
          templateName: TEMPLATE_NAMES[Math.floor(Math.random() * TEMPLATE_NAMES.length)],
          messagePreview: MESSAGE_PREVIEWS[Math.floor(Math.random() * MESSAGE_PREVIEWS.length)],
          confidence: Math.floor(Math.random() * 30 + 70),
        }
      : undefined;

  return {
    id: `lead-${index + 1}`,
    address,
    city: 'San Antonio',
    state: 'TX',
    zipCode: address.match(/\d{5}/)?.[0] || '78209',
    zillowLink: `https://www.zillow.com/homes/${encodeURIComponent(address)}`,
    listingPrice,
    sellerPhone: `(210) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    sellerEmail: '',
    createdAt,
    updatedAt: createdAt,
    archived: status === 'Archived',
    tags: [],
    squareFootage: Math.floor(Math.random() * 1500 + 1000),
    bedrooms: Math.floor(Math.random() * 3 + 2),
    bathrooms: Math.floor(Math.random() * 2 + 1),
    units: 1,
    notes: '',
    leadScore: score,
    mao,
    spreadPercent,
    neighborhoodGrade,
    status,
    lastContactDate: status !== 'New' ? new Date(Date.now() - Math.random() * 172800000).toISOString() : null,
    respondedDate: status === 'Responding' || status === 'Negotiating' ? new Date(Date.now() - Math.random() * 86400000).toISOString() : undefined,
    followUpDate,
    followUpDue,
    aiSummary,
    aiSuggestion,
    priority,
    timeSinceCreated: formatTimeSince(createdAt),
  };
};

/**
 * Generates an array of mock leads
 */
export const generateMockLeads = (count: number): QueueLead[] => {
  return Array.from({ length: count }, (_, i) => generateMockLead(i));
};

/**
 * Filters leads by queue type
 */
export const filterLeadsByQueue = (leads: QueueLead[], queue: QueueType): QueueLead[] => {
  switch (queue) {
    case 'action_now':
      // New leads with score >= 5 that haven't been contacted
      return leads.filter(
        (l) => l.status === 'New' && (l.leadScore ?? 0) >= 5 && !l.archived
      );
    case 'follow_up':
      // Leads that have follow-ups due today or are overdue
      return leads.filter((l) => l.followUpDue && !l.archived);
    case 'negotiating':
      // Leads in negotiation or responding status
      return leads.filter(
        (l) => (l.status === 'Negotiating' || l.status === 'Responding') && !l.archived
      );
    case 'all':
    default:
      return leads.filter((l) => !l.archived);
  }
};

/**
 * Sort leads by priority and then by score
 */
export const sortLeadsByPriority = (leads: QueueLead[]): QueueLead[] => {
  const priorityOrder: Record<Priority, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    normal: 3,
  };

  return [...leads].sort((a, b) => {
    // First by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by score (descending)
    return (b.leadScore ?? 0) - (a.leadScore ?? 0);
  });
};

/**
 * Hook to provide mock lead data for the Review Page
 * This will be replaced with real API calls in a later task
 */
export const useMockLeadData = () => {
  const [leads, setLeads] = useState<QueueLead[]>(() => generateMockLeads(20));

  const queueCounts: QueueCounts = useMemo(
    () => ({
      action_now: filterLeadsByQueue(leads, 'action_now').length,
      follow_up: filterLeadsByQueue(leads, 'follow_up').length,
      negotiating: filterLeadsByQueue(leads, 'negotiating').length,
      all: filterLeadsByQueue(leads, 'all').length,
    }),
    [leads]
  );

  const todayProgress: TodayProgress = useMemo(() => {
    const contactedToday = leads.filter(
      (l) =>
        l.lastContactDate &&
        new Date(l.lastContactDate).toDateString() === new Date().toDateString()
    ).length;
    const followUpsTotal = filterLeadsByQueue(leads, 'follow_up').length;
    const followUpsDone = leads.filter(
      (l) =>
        l.followUpDate &&
        new Date(l.followUpDate).toDateString() === new Date().toDateString() &&
        l.lastContactDate &&
        new Date(l.lastContactDate) > new Date(l.followUpDate)
    ).length;

    return {
      contacted: { current: contactedToday, total: queueCounts.action_now + contactedToday },
      followUps: { current: followUpsDone, total: followUpsTotal + followUpsDone },
    };
  }, [leads, queueCounts.action_now]);

  // Actions to update local state (mock implementations)
  const markAsDone = (leadId: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, status: 'Contacted' as const, lastContactDate: new Date().toISOString() }
          : l
      )
    );
  };

  const markAsSkip = (leadId: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              followUpDate: new Date(Date.now() + 86400000).toISOString(),
              followUpDue: false,
            }
          : l
      )
    );
  };

  const archiveLead = (leadId: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId ? { ...l, archived: true, status: 'Archived' as const } : l
      )
    );
  };

  return {
    leads,
    queueCounts,
    todayProgress,
    markAsDone,
    markAsSkip,
    archiveLead,
  };
};

export default useMockLeadData;
