import React from 'react';
import { Clock, User, MessageSquare, Tag, CheckCircle, HelpCircle, Activity, ShieldAlert, BadgeInfo } from 'lucide-react';
import { Property, AuditLogEntry } from '../types';

interface PropertyHistoryLogProps {
  property: Property;
}

export default function PropertyHistoryLog({ property }: PropertyHistoryLogProps) {
  // Construct a combined chronological history of the listing
  const historyEvents = React.useMemo(() => {
    const events: Array<{
      id: string;
      type: 'creation' | 'status_change' | 'price_change' | 'generic';
      title: string;
      description?: string;
      timestamp: string;
      user: string;
      meta?: any;
    }> = [];

    // 1. App creation event
    events.push({
      id: `event-create-${property.id}`,
      type: 'creation',
      title: 'Listing Published',
      description: `Initial submission of property listing in "${property.location?.city || 'Unknown'}" by ${(property.ownerType || 'Owner').toLowerCase()} ${property.ownerName || 'Host'}.`,
      timestamp: property.createdAt || new Date().toISOString(),
      user: property.ownerName || 'Host',
      meta: { ownerType: property.ownerType || 'OWNER' }
    });

    // 2. Scan formal auditHistory logs
    if (property.auditHistory && property.auditHistory.length > 0) {
      property.auditHistory.forEach((log) => {
        events.push({
          id: log.id || `event-audit-${log.timestamp}-${Math.random()}`,
          type: 'status_change',
          title: `Status: ${log.fromStatus} → ${log.toStatus}`,
          description: log.notes ? `Reason / Note: "${log.notes}"` : undefined,
          timestamp: log.timestamp,
          user: log.changedBy || 'System administrator'
        });
      });
    }

    // 3. Last modified metadata indicator (if updatedAt is different from production creation and doesn't match an audit)
    const hasAuditLogAtUpdated = property.auditHistory?.some(
      log => (log.timestamp || '').split('T')[0] === (property.updatedAt || '').split('T')[0]
    );

    if (property.updatedAt && property.createdAt && property.updatedAt !== property.createdAt && !hasAuditLogAtUpdated) {
      events.push({
        id: `event-update-meta-${property.updatedAt}`,
        type: 'generic',
        title: 'Listing Details Updated',
        description: 'Listing details, amenities, or pricing were modernized by the owner/manager.',
        timestamp: property.updatedAt,
        user: property.ownerName
      });
    }

    // Sort chronologically (latest first)
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [property]);

  const formatDateTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'creation':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'status_change':
        return <Activity className="h-4 w-4 text-orange-400 animate-pulse" />;
      case 'price_change':
        return <Tag className="h-4 w-4 text-blue-400" />;
      default:
        return <Clock className="h-4 w-4 text-indigo-400" />;
    }
  };

  return (
    <div id="property-history-log" className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-extrabold font-sans text-white leading-tight">Property History Log</h3>
            <p className="text-[10px] text-white/50">Immutable timeline of modifications and audits</p>
          </div>
        </div>
        <span className="text-[9px] font-mono font-bold bg-white/5 border border-white/10 px-2 py-1 rounded text-white/60">
          TOTAL ENTRIES: {historyEvents.length}
        </span>
      </div>

      <div className="relative pl-4 space-y-6 before:absolute before:top-1.5 before:bottom-1.5 before:left-[9px] before:w-[2px] before:bg-white/10">
        {historyEvents.map((evt) => (
          <div key={evt.id} className="relative group/evt">
            {/* Timeline dot icon */}
            <div className="absolute -left-[14px] top-0.5 bg-slate-950 rounded-full p-1 border border-white/20 group-hover/evt:border-white/50 transition-all shadow-md">
              {getEventIcon(evt.type)}
            </div>

            <div className="space-y-1 pl-3">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <span className="text-xs font-black text-white/90 group-hover/evt:text-white transition-colors">
                  {evt.title}
                </span>
                <span className="text-[9px] font-mono font-bold text-white/40 group-hover/evt:text-white/65">
                  {formatDateTime(evt.timestamp)}
                </span>
              </div>

              {evt.description && (
                <p className="text-[11px] text-slate-400 leading-normal pl-0.5 max-w-2xl bg-black/10 p-2 rounded-lg border border-white/5 mt-1 font-sans">
                  {evt.description}
                </p>
              )}

              <div className="flex items-center gap-1.5 text-[9px] text-white/40 pt-1 pb-1 font-mono">
                <User className="h-3 w-3 text-indigo-400" />
                <span>Changed by: <strong>{evt.user}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/15 px-3 py-2 rounded-xl text-[10px] text-white/50 flex items-start gap-1.5 select-none leading-normal">
        <BadgeInfo className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
        <span>This feed displays verifiable state alterations made to this listing. Admin approvals, status transitions, and owner detail modulations are logged.</span>
      </div>
    </div>
  );
}
