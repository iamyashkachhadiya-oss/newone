/**
 * FabricaAI Analytics Tracker
 * ============================
 * Lightweight client-side event tracker.
 * Events are stored in localStorage (survives refreshes) and
 * periodically flushed to /api/analytics.
 */

export interface TrackEvent {
  id: string
  ts: number           // Unix ms
  type: 'page_view' | 'button_click' | 'tab_switch' | 'ai_query' | 'design_applied' | 'export' | 'login' | 'signup' | 'error'
  label: string        // Human readable label
  value?: string       // Extra data
  userId?: string
  sessionId: string
  page: string
}

const SESSION_KEY  = 'fabricai_session'
const EVENTS_KEY   = 'fabricai_events'
const MAX_STORED   = 500

let _sessionId: string | null = null

function getSessionId(): string {
  if (_sessionId) return _sessionId
  if (typeof window === 'undefined') return 'ssr'
  const existing = sessionStorage.getItem(SESSION_KEY)
  if (existing) { _sessionId = existing; return existing }
  const newId = `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  sessionStorage.setItem(SESSION_KEY, newId)
  _sessionId = newId
  return newId
}

function getStoredEvents(): TrackEvent[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]') }
  catch { return [] }
}

function storeEvent(evt: TrackEvent) {
  if (typeof window === 'undefined') return
  const events = getStoredEvents()
  events.unshift(evt)
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(0, MAX_STORED)))
}

/** Track any event. Fire-and-forget. */
export function track(
  type: TrackEvent['type'],
  label: string,
  value?: string,
  userId?: string
) {
  if (typeof window === 'undefined') return
  
  const evt: TrackEvent = {
    id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ts: Date.now(),
    type,
    label,
    value,
    userId,
    sessionId: getSessionId(),
    page: window.location.pathname,
  }
  
  storeEvent(evt)
  
  // Fire to API (non-blocking, best-effort)
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evt),
    keepalive: true,
  }).catch(() => { /* silent */ })
}

/** Convenience shorthands */
export const trackClick   = (label: string, value?: string, uid?: string) => track('button_click', label, value, uid)
export const trackTab     = (tab: string,   uid?: string)                 => track('tab_switch',   tab,   undefined, uid)
export const trackAI      = (query: string, uid?: string)                 => track('ai_query',     query, undefined, uid)
export const trackDesign  = (name: string,  uid?: string)                 => track('design_applied', name, undefined, uid)
export const trackExport  = (format: string, uid?: string)                => track('export',       format, undefined, uid)
export const trackPage    = (uid?: string)                                => track('page_view', window.location.pathname, undefined, uid)
export const trackLogin   = (uid?: string)                                => track('login', 'User signed in', undefined, uid)
export const trackSignup  = (uid?: string)                                => track('signup', 'New account created', undefined, uid)

/** Get all stored events (for admin dashboard) */
export function getAllEvents(): TrackEvent[] {
  return getStoredEvents()
}

/** Clear all stored events */
export function clearEvents() {
  if (typeof window !== 'undefined') localStorage.removeItem(EVENTS_KEY)
}
