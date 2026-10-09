import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { SupplyRequest, SupplyRequestDetails } from './types/supply';
import { setUnauthorizedCallback } from './api/api';
import { tokenStorage } from './api/tokenStorage';

export type Role = 'resident' | 'volunteer';
export type Session = { role: Role; name: string; userId: number; username: string };

export type RootStackParamList = {
  Welcome: undefined;
  ResidentTabs: { screen?: 'Home' | 'Report' | 'Status' } | undefined;
  Auth: { role: Role; destination?: 'Report'; reportMode?: 'emergency' | 'supplies' | 'community'; returnTo?: 'Sos' };
  Sos: undefined;
  VolunteerHome: undefined;
};

export type TabParamList = { Home: undefined; Report: { mode?: 'emergency' | 'supplies' | 'community'; entry?: number } | undefined; Status: undefined };
export type VolunteerTabParamList = { Hub: undefined; Deployment: undefined };

export const SOS_STEPS = ['Pending', 'Assigned', 'On the way', 'Completed'] as const;
export type SosStatus = (typeof SOS_STEPS)[number];

export type SosRequest = {
  id: string;
  createdAt: string;
  nature: string;
  peopleCount?: number;
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
  backendId?: number;
  kind?: 'rescue' | 'supply';
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
  supplies: SupplyRequest[];
  addSupplyRequest: (r: SupplyRequestDetails) => SupplyRequest;

  // Volunteer
  volunteerOnline: boolean;
  setVolunteerOnline: (v: boolean) => void;
  requests: Deployment[];
  setRequests: (requests: Deployment[]) => void;
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
  const [supplies, setSupplies] = useState<SupplyRequest[]>([]);

  const [volunteerOnline, setVolunteerOnline] = useState(true);
  const [requests, setRequests] = useState<Deployment[]>([]);
  const [active, setActive] = useState<ActiveDeployment | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [completedCount, setCompletedCount] = useState(0);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pendingTimers = timers.current;
    setUnauthorizedCallback(() => setSession(null));
    return () => pendingTimers.forEach(clearTimeout);
  }, []);

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

  function addSupplyRequest(details: SupplyRequestDetails): SupplyRequest {
    const request: SupplyRequest = {
      ...details,
      id: `SUP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user: session?.name ?? null,
      status: 'need_supplies',
      deliverer: null,
      created_at: new Date().toISOString(),
      delivered_at: null,
    };
    setSupplies((list) => [request, ...list]);
    return request;
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
        signOut: () => { void tokenStorage.clearTokens(); setSession(null); },
        safeAt,
        markSafe: () => setSafeAt(new Date().toISOString()),
        clearSafe: () => setSafeAt(null),
        sos,
        addSos,
        reports,
        addReport,
        supplies,
        addSupplyRequest,
        volunteerOnline,
        setVolunteerOnline,
        requests,
        setRequests,
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
