import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export type Role = 'resident' | 'volunteer';
export type Session = { role: Role; name: string };

export type RootStackParamList = {
  Welcome: undefined;
  ResidentTabs: { screen?: 'Home' | 'Report' | 'Status' } | undefined;
  Auth: { role: Role; destination?: 'Report' };
  Sos: undefined;
  VolunteerHome: undefined;
};

export type TabParamList = { Home: undefined; Report: undefined; Status: undefined };
export type VolunteerTabParamList = { Hub: undefined; Deployment: undefined };

export const SOS_STEPS = ['Pending', 'Assigned', 'On the way', 'Completed'] as const;
export type SosStatus = (typeof SOS_STEPS)[number];

export type SosRequest = {
  id: string;
  createdAt: string;
  nature: string;
  details: string[];
  vulnerable: string[];
  priority: 'Medium' | 'High' | 'Critical';
  location: string;
  status: SosStatus;
};

export type CommunityReport = {
  id: string;
  createdAt: string;
  category: string;
  description: string;
  photo: string;
  location: string;
  status: 'Submitted' | 'Under review';
};

/* ---------- Volunteer types ---------- */
export type Deployment = {
  id: string;
  title: string;
  location: string;
  distance: string;
  priority: 'Medium' | 'High' | 'Critical';
  people: string;
  access: string;
  action: string; // "Rescuing", "Delivering"...
  briefing: string;
  tags: string[];
  outcome: string;
};

/** stage 0..2 = in progress, 3 = complete */
export type ActiveDeployment = { deployment: Deployment; stage: number };
export const LAST_STAGE = 3;
export const stepLabels = (d: Deployment) => ['Accepted', 'Arrived', d.action, 'Complete'];

export type Broadcast = { id: string; message: string; from: string; time: string; urgent?: boolean };

const SEED_REQUESTS: Deployment[] = [
  {
    id: 'D-001',
    title: 'Evacuate 12 Residents',
    location: 'Purok 3, Sto. Niño',
    distance: '1.2 km',
    priority: 'Critical',
    people: '12 residents · 3 elderly, 2 children',
    access: 'Boat required (flooded roads)',
    action: 'Rescuing',
    briefing:
      'Twelve residents including 3 elderly and 2 children are stranded in Purok 3 due to flash flooding. Water level is about 1.2 m. Use rescue boat RB-02. Coordinator: Sgt. Reyes.',
    tags: ['Team: DeviAnts', 'Vehicle: RB-02'],
    outcome: '12 residents successfully evacuated',
  },
  {
    id: 'D-002',
    title: 'Deliver Relief Packs',
    location: 'Evacuation Center A',
    distance: '0.6 km',
    priority: 'High',
    people: '40 family packs',
    access: 'Road passable',
    action: 'Delivering',
    briefing:
      'Deliver 40 relief packs from the barangay hall to Evacuation Center A. Hand them to the center coordinator and get a signed receipt.',
    tags: ['Team: DeviAnts', 'Cargo: 40 packs'],
    outcome: '40 relief packs delivered',
  },
];

const SEED_BROADCASTS: Broadcast[] = [
  { id: 'B-1', message: 'Medical team needed at Evacuation Center A.', from: 'Command', time: '13:00', urgent: true },
  { id: 'B-2', message: 'Road to Purok 3 is passable by boat only.', from: 'Dispatch', time: '12:40' },
  { id: 'B-3', message: 'Relief packs arrive at Evacuation Center A by 2 PM.', from: 'Logistics', time: '12:10' },
];

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

type Ctx = {
  session: Session | null;
  signIn: (s: Session) => void;
  signOut: () => void;
  safeAt: string | null;
  markSafe: () => void;
  clearSafe: () => void;
  sos: SosRequest[];
  addSos: (r: Omit<SosRequest, 'id' | 'createdAt' | 'status'>) => SosRequest;
  reports: CommunityReport[];
  addReport: (r: Omit<CommunityReport, 'id' | 'createdAt' | 'status'>) => void;

  // Volunteer
  volunteerOnline: boolean;
  setVolunteerOnline: (v: boolean) => void;
  requests: Deployment[];
  active: ActiveDeployment | null;
  acceptRequest: (id: string) => void;
  advanceDeployment: () => void;
  finishDeployment: () => void;
  reportIssue: (label: string) => void;
  broadcasts: Broadcast[];
  completedCount: number;
};

const SessionContext = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [safeAt, setSafeAt] = useState<string | null>(null);
  const [sos, setSos] = useState<SosRequest[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);

  const [volunteerOnline, setVolunteerOnline] = useState(true);
  const [requests, setRequests] = useState<Deployment[]>(SEED_REQUESTS);
  const [active, setActive] = useState<ActiveDeployment | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(SEED_BROADCASTS);
  const [completedCount, setCompletedCount] = useState(0);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function setStatus(id: string, status: SosStatus) {
    setSos((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  function addSos(r: Omit<SosRequest, 'id' | 'createdAt' | 'status'>) {
    const req: SosRequest = {
      ...r,
      id: `SOS-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      status: 'Pending',
    };
    setSos((list) => [req, ...list]);

    // Simulates a responder progressing through the request.
    timers.current.push(
      setTimeout(() => setStatus(req.id, 'Assigned'), 7000),
      setTimeout(() => setStatus(req.id, 'On the way'), 16000),
      setTimeout(() => setStatus(req.id, 'Completed'), 40000),
    );
    return req;
  }

  function addReport(r: Omit<CommunityReport, 'id' | 'createdAt' | 'status'>) {
    const item: CommunityReport = {
      ...r,
      id: `RPT-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      status: 'Submitted',
    };
    setReports((list) => [item, ...list]);
    timers.current.push(
      setTimeout(
        () =>
          setReports((list) =>
            list.map((x) => (x.id === item.id ? { ...x, status: 'Under review' } : x)),
          ),
        9000,
      ),
    );
  }

  /* ---------- Volunteer actions ---------- */
  function acceptRequest(id: string) {
    if (active) return;
    const d = requests.find((r) => r.id === id);
    if (!d) return;
    setRequests((list) => list.filter((r) => r.id !== id));
    setActive({ deployment: d, stage: 0 });
  }

  function advanceDeployment() {
    setActive((a) => (a && a.stage < LAST_STAGE ? { ...a, stage: a.stage + 1 } : a));
  }

  function finishDeployment() {
    setActive(null);
    setCompletedCount((n) => n + 1);
  }

  function reportIssue(label: string) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setBroadcasts((list) => [
      {
        id: `B-${Date.now()}`,
        message: `Issue reported${active ? ` on ${active.deployment.id}` : ''}: ${label}.`,
        from: 'You',
        time,
      },
      ...list,
    ]);
  }

  return (
    <SessionContext.Provider
      value={{
        session,
        signIn: setSession,
        signOut: () => setSession(null),
        safeAt,
        markSafe: () => setSafeAt(new Date().toISOString()),
        clearSafe: () => setSafeAt(null),
        sos,
        addSos,
        reports,
        addReport,
        volunteerOnline,
        setVolunteerOnline,
        requests,
        active,
        acceptRequest,
        advanceDeployment,
        finishDeployment,
        reportIssue,
        broadcasts,
        completedCount,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be inside SessionProvider');
  return ctx;
}