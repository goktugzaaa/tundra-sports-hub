import { useMemo, useState } from 'react';
import { PageHeader, AsyncBoundary, TableSkeleton, StatusBadge, Modal } from '../../../ui';
import { formatDate, todayISO } from '../../../utils/date';
import { documentRules, documentsDomain, type Document } from '../../../domain';
import { useDocuments } from '../hooks/useDocuments';

function expiryTag(doc: Document, today: string): string {
  if (documentRules.isDocumentExpired(doc, today)) return 'expired';
  if (documentRules.isDocumentExpiringSoon(doc, today)) return 'expiring';
  return 'current';
}

/**
 * Documents module — file register with status tags, a mock preview
 * modal and a mock upload flow (RBAC-gated).
 */
export function DocumentListView() {
  const { data, loading, error, reload, canUpload, upload, uploading, uploadError } =
    useDocuments();
  const today = todayISO();

  const [preview, setPreview] = useState<Document | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [ownerId, setOwnerId] = useState('');
  const [type, setType] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const athleteName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of data?.athletes ?? []) map[a.id] = a.name;
    return map;
  }, [data]);

  const expiredCount = useMemo(
    () => documentsDomain.getExpiredDocuments(data?.documents ?? [], today).length,
    [data, today],
  );

  async function submitUpload() {
    if (!ownerId || !type.trim()) return;
    const okDone = await upload({ ownerId, type: type.trim(), expiresAt });
    if (okDone) {
      setShowUpload(false);
      setOwnerId('');
      setType('');
      setExpiresAt('');
    }
  }

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="Contracts, records and agreements linked to your entities."
        actions={
          <button
            className="btn btn-primary"
            disabled={!canUpload}
            onClick={() => setShowUpload(true)}
          >
            + Upload (mock)
          </button>
        }
      />

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        skeleton={<TableSkeleton rows={6} cols={5} />}
        isEmpty={!!data && data.documents.length === 0}
        emptyText="No documents visible to your role."
      >
        {data && (
          <>
            {expiredCount > 0 && (
              <div className="alert-banner alert-red">
                ⚠ {expiredCount} document{expiredCount === 1 ? '' : 's'} expired.
              </div>
            )}

            <div className="card">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Linked To</th>
                    <th>Uploaded</th>
                    <th>Expiry</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.documents.map((d) => (
                    <tr key={d.id}>
                      <td>{d.type}</td>
                      <td>
                        <StatusBadge kind="owner" value={d.ownerType} />{' '}
                        {d.ownerType === 'athlete'
                          ? (athleteName[d.ownerId] ?? d.ownerId)
                          : d.ownerId}
                      </td>
                      <td>{formatDate(d.uploadedAt)}</td>
                      <td>
                        {d.expiresAt ? (
                          <StatusBadge kind="document" value={expiryTag(d, today)} />
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <button className="btn" onClick={() => setPreview(d)}>
                          Preview
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AsyncBoundary>

      {preview && (
        <Modal title={preview.type} onClose={() => setPreview(null)}>
          <div className="detail-row">
            <span className="k">Linked to</span>
            <span>
              {preview.ownerType} · {preview.ownerId}
            </span>
          </div>
          <div className="detail-row">
            <span className="k">Uploaded</span>
            <span>{formatDate(preview.uploadedAt)}</span>
          </div>
          <div className="detail-row">
            <span className="k">Expires</span>
            <span>{preview.expiresAt ? formatDate(preview.expiresAt) : '—'}</span>
          </div>
          <div className="detail-row">
            <span className="k">File</span>
            <span className="mono">{preview.url}</span>
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            Mock file reference — no real file is stored. A backend adapter
            would resolve this URL to a live document.
          </p>
        </Modal>
      )}

      {showUpload && (
        <Modal title="Upload Document (mock)" onClose={() => setShowUpload(false)}>
          <div className="field">
            <label>Athlete</label>
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
              <option value="">Select an athlete…</option>
              {data?.athletes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Document type</label>
            <input
              value={type}
              placeholder="e.g. Medical Report"
              onChange={(e) => setType(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Expiry date (optional)</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          {uploadError && <div className="inline-error">{uploadError}</div>}
          <button
            className="btn btn-primary"
            disabled={uploading || !ownerId || !type.trim()}
            onClick={submitUpload}
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </Modal>
      )}
    </div>
  );
}
