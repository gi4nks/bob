import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- Data Constants ---

const DEVELOPERS = [
  // Frontend Team
  { id: 'd1', name: 'Marcus Jones', role: 'Senior Frontend', dailyRate: 900, avatarSeed: 'Marcus', skills: [['React', 5, 'Frontend'], ['TypeScript', 5, 'Frontend'], ['Tailwind', 5, 'Design']] },
  { id: 'd2', name: 'Sarah Miller', role: 'UI/UX Designer', dailyRate: 750, avatarSeed: 'Sarah', skills: [['Figma', 5, 'Design'], ['CSS', 4, 'Frontend']] },
  { id: 'd3', name: 'Alex Chen', role: 'Junior Frontend', dailyRate: 450, avatarSeed: 'Alex', skills: [['React', 3, 'Frontend'], ['JavaScript', 4, 'Frontend']] },
  
  // Backend Team
  { id: 'd4', name: 'Maria Korolev', role: 'Backend Lead', dailyRate: 1100, avatarSeed: 'Maria', skills: [['Node.js', 5, 'Backend'], ['PostgreSQL', 5, 'Database'], ['System Design', 5, 'Architecture']] },
  { id: 'd5', name: 'Tom Hardy', role: 'Backend Engineer', dailyRate: 800, avatarSeed: 'Tom', skills: [['Go', 4, 'Backend'], ['Docker', 3, 'DevOps']] },
  { id: 'd6', name: 'John Doe', role: 'Python Specialist', dailyRate: 850, avatarSeed: 'John', skills: [['Python', 5, 'Backend'], ['FastAPI', 4, 'Backend']] },

  // Specialized / Leadership
  { id: 'd7', name: 'Vittorio Russo', role: 'Solutions Architect', dailyRate: 1400, avatarSeed: 'Vittorio', skills: [['AWS', 5, 'Cloud'], ['Architecture', 5, 'Architecture'], ['Security', 4, 'Security']] },
  { id: 'd8', name: 'Chen Li', role: 'DevOps Engineer', dailyRate: 950, avatarSeed: 'Chen', skills: [['Kubernetes', 5, 'DevOps'], ['Terraform', 5, 'DevOps'], ['CI/CD', 4, 'DevOps']] },
  { id: 'd9', name: 'Kevin Brown', role: 'Eng. Manager', dailyRate: 1300, avatarSeed: 'Kevin', skills: [['Agile', 5, 'Management'], ['Scrum', 5, 'Management']] },
  
  // Mobile
  { id: 'd10', name: 'Ines Garcia', role: 'Mobile Lead', dailyRate: 950, avatarSeed: 'Ines', skills: [['React Native', 5, 'Mobile'], ['Swift', 4, 'Mobile']] },
  
  // QA
  { id: 'd11', name: 'Elena Petrov', role: 'QA Automation', dailyRate: 600, avatarSeed: 'Elena', skills: [['Cypress', 5, 'Testing'], ['Jest', 4, 'Testing']] },
];

const PROJECTS = [
  // 1. The Big Flagship (Active)
  { 
    id: 'p1', name: 'SkyNet Platform', client: 'Cyberdyne Systems', color: 'bg-blue-600', 
    status: 'Active', start: '2026-01-01', end: '2026-12-31', budget: 1500000,
  },
  // 2. The Urgent Fix (Active)
  { 
    id: 'p2', name: 'Iron Shield', client: 'Stark Industries', color: 'bg-red-600', 
    status: 'Active', start: '2026-01-15', end: '2026-05-30', budget: 600000,
  },
  // 3. Discovery (Active)
  { 
    id: 'p3', name: 'Project Phoenix', client: 'Rebirth Inc', color: 'bg-violet-600', 
    status: 'Discovery', start: '2026-03-01', end: '2026-09-30', budget: 300000,
  },
  // 4. Maintenance (Active)
  { 
    id: 'p4', name: 'Legacy Systems', client: 'Global Corp', color: 'bg-slate-500', 
    status: 'Active', start: '2026-01-01', end: '2026-12-31', budget: 200000,
  },
  // 5. On Hold (On Hold)
  { 
    id: 'p5', name: 'Voyager Upgrade', client: 'NASA', color: 'bg-orange-500', 
    status: 'On Hold', start: '2025-06-01', end: '2026-06-01', budget: 800000,
  },
  // 6. Completed (Completed)
  { 
    id: 'p6', name: 'Archive Migration', client: 'Library Inc', color: 'bg-emerald-600', 
    status: 'Completed', start: '2025-01-01', end: '2025-12-31', budget: 100000,
  },
  // 7. Draft (Draft)
  { 
    id: 'p7', name: 'Stealth AI', client: 'Unknown', color: 'bg-zinc-800', 
    status: 'Draft', start: '2026-07-01', end: '2027-06-30', budget: 2000000,
  }
];

// --- Helpers ---

const getDate = (str: string) => new Date(str);

async function main() {
  console.log('🌱 Starting COMPREHENSIVE SEED...');

  // 1. Clean DB
  console.log('🧹 Cleaning database...');
  await prisma.skill.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.outcome.deleteMany();
  await prisma.requiredSkill.deleteMany();
  await prisma.phase.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.developer.deleteMany();
  await prisma.project.deleteMany();

  // 2. Insert Developers
  console.log('👥 Creating Developers...');
  for (const d of DEVELOPERS) {
    await prisma.developer.create({
      data: {
        id: d.id, name: d.name, role: d.role, dailyRate: d.dailyRate,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.avatarSeed}`,
        skills: { create: d.skills.map(s => ({ name: s[0] as string, level: s[1] as number, category: s[2] as string })) }
      }
    });
  }

  // 3. Insert Projects & Rich Roadmap
  console.log('🏗️ Creating Projects & Rich Roadmap...');
  for (const p of PROJECTS) {
    const project = await prisma.project.create({
      data: {
        id: p.id, name: p.name, client: p.client, color: p.color, status: p.status, budget: p.budget,
        startDate: getDate(p.start), endDate: getDate(p.end),
      }
    });
    
    // Create Phases
    const phasesData = generatePhasesForProject(p);
    for (const ph of phasesData) {
      const phase = await prisma.phase.create({
        data: {
          projectId: project.id,
          name: ph.name,
          startDate: ph.startDate,
          endDate: ph.endDate,
          color: ph.color,
        }
      });

      // Inject Outcomes
      const objectives = getObjectivesForPhase(p.name, ph.name);
      let orderCounter = 0;
      
      for (const obj of objectives) {
        const krs = generateKeyResultsForObjective(obj);
        for (const kr of krs) {
          // Assignee Logic per project
          let candidates: string[] = [];
          if (p.id === 'p1') candidates = ['d1', 'd4', 'd3', 'd5', 'd2', 'd9', 'd11'];
          else if (p.id === 'p2') candidates = ['d7', 'd8', 'd5', 'd9', 'd11'];
          else if (p.id === 'p3') candidates = ['d10', 'd2'];
          else if (p.id === 'p4') candidates = ['d6'];
          
          // For inactive projects (Completed, On Hold), we might still have historical assignees or none
          if (p.status === 'Completed') candidates = ['d6', 'd3']; 

          const assigneeId = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
          
          // Determine status based on project status
          let isDone = false;
          if (p.status === 'Completed') isDone = true;
          else if (p.status === 'Draft') isDone = false;
          else isDone = Math.random() > 0.6; // Active projects have mix

          await prisma.outcome.create({
            data: {
              phaseId: phase.id,
              name: kr.name,
              description: `[${obj}] - ${kr.desc}`,
              isDone: isDone,
              assigneeId: assigneeId,
              order: orderCounter++
            }
          });
        }
      }
    }
  }

  // 4. Create Allocations (Strict >= 50% Rule)
  console.log('📅 Assigning Allocations (>= 50% Load)...');
  
  const allocations = [
    // P1: SkyNet (Active)
    { dev: 'd1', proj: 'p1', load: 100, start: '2026-01-01', end: '2026-06-30' }, // Marcus: 100%
    { dev: 'd3', proj: 'p1', load: 100, start: '2026-01-01', end: '2026-06-30' }, // Alex: 100%
    { dev: 'd4', proj: 'p1', load: 100, start: '2026-01-01', end: '2026-12-31' }, // Maria: 100%
    
    // Split Allocations (50/50)
    { dev: 'd2', proj: 'p1', load: 50, start: '2026-02-01', end: '2026-05-30' }, // Sarah: SkyNet 50%
    { dev: 'd2', proj: 'p3', load: 50, start: '2026-03-01', end: '2026-06-30' }, // Sarah: Phoenix 50%

    { dev: 'd5', proj: 'p1', load: 50, start: '2026-01-01', end: '2026-06-30' }, // Tom: SkyNet 50%
    { dev: 'd5', proj: 'p2', load: 50, start: '2026-01-15', end: '2026-04-30' }, // Tom: Iron Shield 50%

    { dev: 'd9', proj: 'p1', load: 50, start: '2026-01-01', end: '2026-12-31' }, // Kevin: SkyNet 50%
    { dev: 'd9', proj: 'p2', load: 50, start: '2026-01-15', end: '2026-04-30' }, // Kevin: Iron Shield 50%

    { dev: 'd11', proj: 'p1', load: 50, start: '2026-01-01', end: '2026-12-31' }, // Elena: SkyNet 50%
    { dev: 'd11', proj: 'p2', load: 50, start: '2026-01-15', end: '2026-04-30' }, // Elena: Iron Shield 50%

    // P2: Iron Shield (Active)
    { dev: 'd7', proj: 'p2', load: 100, start: '2026-01-15', end: '2026-04-30' }, // Vittorio: 100%
    { dev: 'd8', proj: 'p2', load: 100, start: '2026-01-15', end: '2026-04-30' }, // Chen: 100%

    // P3: Phoenix (Discovery)
    { dev: 'd10', proj: 'p3', load: 100, start: '2026-03-01', end: '2026-06-30' }, // Ines: 100%

    // P4: Maintenance (Active)
    { dev: 'd6', proj: 'p4', load: 100, start: '2026-01-01', end: '2026-12-31' }, // John: 100%
  ];

  for (const a of allocations) {
    await prisma.allocation.create({
      data: {
        developerId: a.dev, projectId: a.proj, load: a.load, status: 'Confirmed',
        startDate: getDate(a.start), endDate: getDate(a.end)
      }
    });
  }

  // 5. Create Leaves
  console.log('🌴 Creating Leaves...');
  await prisma.leave.createMany({
    data: [
      { developerId: 'd1', startDate: getDate('2026-02-16'), endDate: getDate('2026-02-20'), type: 'Vacation' },
      { developerId: 'd4', startDate: getDate('2026-03-10'), endDate: getDate('2026-03-12'), type: 'Sick Leave' },
      { developerId: 'd7', startDate: getDate('2026-04-01'), endDate: getDate('2026-04-10'), type: 'Parental' },
    ]
  });

  console.log('✅ COMPREHENSIVE SEED COMPLETED!');
}

// --- Data Generators ---

function generatePhasesForProject(p: any) {
  if (p.name.includes('SkyNet')) {
    return [
      { name: 'Phase 1: Architecture', startDate: getDate('2026-01-01'), endDate: getDate('2026-02-28'), color: 'bg-blue-500' },
      { name: 'Phase 2: MVP Core', startDate: getDate('2026-03-01'), endDate: getDate('2026-05-31'), color: 'bg-indigo-500' },
      { name: 'Phase 3: Integration', startDate: getDate('2026-06-01'), endDate: getDate('2026-08-31'), color: 'bg-violet-500' },
      { name: 'Phase 4: Optimization', startDate: getDate('2026-09-01'), endDate: getDate('2026-10-31'), color: 'bg-purple-500' },
      { name: 'Phase 5: Release', startDate: getDate('2026-11-01'), endDate: getDate('2026-12-31'), color: 'bg-fuchsia-500' },
    ];
  }
  if (p.name.includes('Iron Shield')) {
    return [
      { name: 'Threat Assessment', startDate: getDate('2026-01-15'), endDate: getDate('2026-02-15'), color: 'bg-red-500' },
      { name: 'Security Hardening', startDate: getDate('2026-02-16'), endDate: getDate('2026-03-31'), color: 'bg-orange-500' },
      { name: 'Pen Testing', startDate: getDate('2026-04-01'), endDate: getDate('2026-04-30'), color: 'bg-amber-500' },
      { name: 'Final Audit', startDate: getDate('2026-05-01'), endDate: getDate('2026-05-15'), color: 'bg-green-500' },
    ];
  }
  if (p.name.includes('Phoenix')) {
    return [
      { name: 'Market Research', startDate: getDate('2026-03-01'), endDate: getDate('2026-03-31'), color: 'bg-pink-500' },
      { name: 'Concept Design', startDate: getDate('2026-04-01'), endDate: getDate('2026-05-31'), color: 'bg-rose-500' },
      { name: 'Tech PoC', startDate: getDate('2026-06-01'), endDate: getDate('2026-06-30'), color: 'bg-red-400' }
    ];
  }
  if (p.name.includes('Voyager')) {
    return [
      { name: 'Phase 1: Planning', startDate: getDate('2025-06-01'), endDate: getDate('2025-08-31'), color: 'bg-orange-400' },
      { name: 'Phase 2: Execution (Paused)', startDate: getDate('2025-09-01'), endDate: getDate('2025-12-31'), color: 'bg-orange-300' }
    ];
  }
  if (p.name.includes('Archive')) {
     return [
      { name: 'Extraction', startDate: getDate('2025-01-01'), endDate: getDate('2025-03-31'), color: 'bg-emerald-500' },
      { name: 'Transformation', startDate: getDate('2025-04-01'), endDate: getDate('2025-06-30'), color: 'bg-emerald-400' },
      { name: 'Loading', startDate: getDate('2025-07-01'), endDate: getDate('2025-09-30'), color: 'bg-emerald-300' },
      { name: 'Validation', startDate: getDate('2025-10-01'), endDate: getDate('2025-12-31'), color: 'bg-emerald-600' }
    ];
  }
  if (p.name.includes('Stealth')) {
     return [
      { name: 'Concept', startDate: getDate('2026-07-01'), endDate: getDate('2026-09-30'), color: 'bg-zinc-600' },
      { name: 'Funding', startDate: getDate('2026-10-01'), endDate: getDate('2026-12-31'), color: 'bg-zinc-500' }
    ];
  }
  // Default (Maintenance)
  return [
    { name: 'Q1 Ops', startDate: getDate('2026-01-01'), endDate: getDate('2026-03-31'), color: 'bg-slate-400' },
    { name: 'Q2 Ops', startDate: getDate('2026-04-01'), endDate: getDate('2026-06-30'), color: 'bg-slate-400' },
    { name: 'Q3 Ops', startDate: getDate('2026-07-01'), endDate: getDate('2026-09-30'), color: 'bg-slate-400' },
    { name: 'Q4 Ops', startDate: getDate('2026-10-01'), endDate: getDate('2026-12-31'), color: 'bg-slate-400' }
  ];
}

function getObjectivesForPhase(projName: string, phaseName: string) {
  const p = projName;
  const ph = phaseName;
  
  if (p.includes('SkyNet')) {
    if (ph.includes('Architecture')) return ['High Availability Design', 'Microservices Strategy', 'Data Governance'];
    if (ph.includes('MVP')) return ['Authentication Service', 'User Profile UI', 'Notification Engine'];
    if (ph.includes('Integration')) return ['Stripe Integration', 'Salesforce Sync', 'Legacy DB Adapter'];
    return ['Performance Tuning', 'Security Audit', 'UAT Support'];
  }
  if (p.includes('Iron')) {
    if (ph.includes('Assessment')) return ['External Penetration Test', 'Static Code Analysis'];
    if (ph.includes('Hardening')) return ['WAF Configuration', 'IAM Policy Review', 'Secrets Management Rotation'];
    return ['Compliance Report', 'Executive Summary'];
  }
  if (p.includes('Phoenix')) {
     if (ph.includes('Research')) return ['Competitor Analysis', 'User Interviews'];
     if (ph.includes('Design')) return ['Wireframing', 'High Fidelity Mocks', 'Design System'];
     return ['React Native PoC', 'GraphQL Schema Draft'];
  }
  if (p.includes('Archive')) {
    return ['Data Export', 'Schema Mapping', 'Integrity Check'];
  }
  if (p.includes('Voyager')) {
    return ['Requirements Gathering', 'Resource Planning'];
  }
  return ['System Health Check', 'Library Upgrades', 'Incident Response'];
}

function generateKeyResultsForObjective(objName: string) {
  const items = [
    { name: `Define ${objName} Spec`, desc: 'Technical documentation and sign-off.' },
    { name: `Dev: ${objName} Core`, desc: 'Primary implementation of functionality.' },
    { name: `QA: ${objName} Test`, desc: 'Verification and bug fixing.' }
  ];
  if (Math.random() > 0.3) items.push({ name: `Deploy ${objName}`, desc: 'Release to target environment.' });
  if (Math.random() > 0.7) items.push({ name: `Review ${objName}`, desc: 'Post-implementation review.' });
  return items;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });