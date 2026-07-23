export const MOCK_SESSION_ID = 'mock-session-001'

export const MOCK_SESSION = {
  id: MOCK_SESSION_ID,
  company_name: 'Stripe',
  job_title: 'Senior Product Manager',
  status: 'ready',
  created_at: '2025-07-19T10:00:00Z',
  gap_analysis: {
    critical: [
      {
        finding: 'No direct fintech or payment systems experience',
        evidence:
          'Resume shows only SaaS analytics products. Stripe will probe for payments domain knowledge.',
        likely_question:
          'Tell me about a time you worked with financial data or payment flows.',
      },
      {
        finding: 'Missing developer-facing product experience',
        evidence:
          'Your background is B2C consumer apps. Stripe PMs lead developer-facing teams with API-first thinking.',
        likely_question:
          'How do you prioritize features for a developer audience versus an end consumer?',
      },
    ],
    weak: [
      {
        finding: 'Metrics on growth impact are vague',
        example_before:
          'Grew the platform by improving the onboarding flow.',
        example_after:
          'Redesigned a 4-step onboarding flow, reducing drop-off by 34% and increasing 7-day activation from 41% → 67% (Q3 2023). Tied directly to $1.2M ARR uplift.',
      },
      {
        finding: 'Cross-functional leadership is understated',
        example_before: 'Worked with engineering to ship features on time.',
        example_after:
          'Led a squad of 8 engineers and 2 designers through a 6-week sprint to ship a real-time collaboration feature, unblocking $2M in stalled enterprise deals.',
      },
    ],
    strengths: [
      {
        finding: 'Strong track record of 0-to-1 product launches',
        likely_question:
          'Walk me through a product you built from scratch — what was the biggest risk you had to manage?',
      },
      {
        finding: 'Exceptional cross-functional collaboration signals',
        likely_question:
          'How do you align engineering, design, and business stakeholders when priorities conflict?',
      },
      {
        finding: 'Deep user research practice stands out',
        likely_question:
          'Tell me about a time user research completely changed your product direction.',
      },
    ],
  },
  questions: [
    {
      text: 'Tell me about a time you worked with financial data or payment flows.',
      category: 'critical' as const,
      tip: 'Bridge from your analytics experience: talk about data integrity, trust, and downstream business impact — very similar to payment accuracy concerns. You have more here than you think.',
    },
    {
      text: 'How do you prioritize features for a developer audience versus an end consumer?',
      category: 'critical' as const,
      tip: 'Frame this as two trust models: developers need reliability, docs, and consistency; consumers need delight and simplicity. Show you understand the difference and have thought deeply about both.',
    },
    {
      text: 'Walk me through a product you built from scratch. What was the biggest risk?',
      category: 'strength' as const,
      tip: "This is your moment to shine. Pick your strongest 0-to-1 story and don't undersell the risk — interviewers love founders who lean into uncertainty honestly.",
    },
    {
      text: "Redesign Stripe's onboarding for a 10M-user fintech product. What's your process?",
      category: 'weak' as const,
      tip: 'Lead with research before solutions. Structure it as: Understand → Define success metrics → Explore solutions → Validate. In fintech, always acknowledge the trust/friction tradeoff.',
    },
    {
      text: 'How do you align engineering, design, and business stakeholders when priorities conflict?',
      category: 'strength' as const,
      tip: "Ground your answer in a real, messy situation — not a clean process. Show empathy for each stakeholder's constraints. Stripe values radical candor.",
    },
    {
      text: 'Stripe is considering expanding into a new market. How would you evaluate the opportunity?',
      category: 'weak' as const,
      tip: 'Use a framework: TAM/SAM/SOM, competitive moat, regulatory considerations, and how Stripe\'s existing distribution gives an unfair advantage. Always mention compliance in fintech.',
    },
    {
      text: 'Tell me about a time user research completely changed your product direction.',
      category: 'strength' as const,
      tip: 'Stories of being wrong and changing course are gold at Stripe. They signal intellectual honesty — one of their core values. The more specific the data point that changed your mind, the better.',
    },
  ],
}

export const MOCK_ATTEMPT = {
  question_index: 0,
  transcript:
    "In my previous role at DataCo, we built an analytics pipeline that processed financial transaction data for enterprise banks. The core challenge was accuracy at scale — a single data error would cascade into incorrect board-level reports. I led a team to implement real-time reconciliation checks, and we reduced discrepancy incidents by about 89%. What that taught me about payment-adjacent systems is that trust isn't just a feature — it's the product. And I think that maps directly to how I'd think about building at Stripe.",
  scores: {
    clarity: 78,
    relevance: 71,
    structure: 64,
    confidence: 82,
  },
  improved_answer:
    "In my previous role at DataCo, I led the redesign of our financial analytics pipeline, which processed $50B in transaction data monthly for enterprise banking clients. The core challenge was accuracy at scale — a single data error cascaded into incorrect CFO reports and board presentations. I partnered with 3 data engineers to implement real-time reconciliation checks with automated alerting, reducing data discrepancy incidents by 89% and cutting our SLA breach rate from 12% to under 2%. What I took away is that in financial systems, trust isn't a feature — it's the product. That philosophy translates directly to how I'd approach Stripe: every product decision either builds or erodes the trust developers and businesses place in your infrastructure.",
  created_at: '2025-07-19T10:05:00Z',
  summary:
    "Strong start — you made a credible connection to financial data. Your structure was a little loose in the middle; the improved answer shows how quantifying your impact and ending with a direct connection to Stripe's mission makes it land much harder.",
}

export const MOCK_CHEAT_SHEET = {
  company_name: 'Stripe',
  job_title: 'Senior Product Manager',
  questions_theyll_ask: [
    {
      question:
        "Tell me about a time you shipped a feature that didn't perform as expected.",
      how_to_answer:
        'Use the STAR method. Lean hard into what you learned and what you\'d do differently. Stripe values intellectual honesty over polished outcomes — showing you can fail gracefully is a feature, not a bug.',
    },
    {
      question: 'How do you define success for a developer-facing feature?',
      how_to_answer:
        'Mention adoption rate, time-to-first-integration, support ticket reduction, and developer NPS. Show you understand DX as a product surface, not just a nice-to-have.',
    },
    {
      question: 'What would you do in your first 90 days as a PM at Stripe?',
      how_to_answer:
        'Days 1–30: deep listening — customer calls, internal docs, shadowing support. Days 31–60: landscape mapping, find quick wins that build credibility. Days 61–90: propose your first roadmap slice with clear success metrics.',
    },
  ],
  star_stories: [
    {
      title: 'The Onboarding Overhaul',
      summary:
        'Situation: 40% drop-off at step 2 of sign-up. Task: Improve activation without hurting security. Action: Ran 12 user interviews, A/B tested 3 flows, launched progressive disclosure redesign. Result: 34% drop-off reduction, 7-day activation from 41% → 67%, $1.2M ARR uplift.',
    },
    {
      title: 'The Stakeholder Standoff',
      summary:
        'Situation: Engineering, Design, and Sales all wanted different Q3 priorities with no shared metric. Task: Build consensus fast. Action: Created a shared north star metric (weekly active integrations), facilitated a 2-day workshop, sequenced the roadmap. Result: Shipped 3/4 priorities on time, $2M ARR unblocked.',
    },
    {
      title: 'The User Research Pivot',
      summary:
        'Situation: We were building a dashboard feature based on PM intuition. Task: Validate or kill it. Action: 8 customer discovery calls revealed the real need was an API webhook, not a UI. Result: Shipped webhook in 3 weeks vs. 3 months for the dashboard — became the top-requested feature in NPS surveys.',
    },
  ],
  perfect_introduction:
    "I'm a product manager with 6 years building data-intensive B2B products. Most recently at DataCo, I led product for our enterprise analytics suite — a platform processing financial data for banks. I'm drawn to Stripe because I believe the next decade of fintech infrastructure will be won on developer experience, and I've spent my career at the intersection of technical complexity and user clarity. I'm here because I want to help build the economic infrastructure of the internet.",
  keywords: [
    'developer experience',
    'API-first',
    'data integrity',
    '0-to-1',
    'cross-functional alignment',
  ],
  questions_to_ask: [
    'What does the product review process look like here — how does a PM take an idea from hypothesis to roadmap?',
    "What's the biggest unsolved problem the team is wrestling with right now?",
    'How does Stripe think about the tension between product simplicity and the deep customization enterprise clients need?',
  ],
}

export const MOCK_SESSIONS = [
  {
    id: MOCK_SESSION_ID,
    company_name: 'Stripe',
    job_title: 'Senior Product Manager',
    status: 'ready',
    created_at: '2025-07-19T10:00:00Z',
  },
  {
    id: 'mock-session-002',
    company_name: 'Linear',
    job_title: 'Product Designer',
    status: 'practicing',
    created_at: '2025-07-15T14:00:00Z',
  },
]

export const MOCK_USER = {
  id: 'mock-user-001',
  email: 'alex@example.com',
  user_metadata: { full_name: 'Alex Rivera' },
}
