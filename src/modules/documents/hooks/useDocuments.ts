import { useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { useDataService } from '../../../services';
import { useAsyncData } from '../../../hooks/useAsyncData';
import { canAccess } from '../../../rbac';
import { documentsDomain, type Athlete, type Document } from '../../../domain';
import { todayISO } from '../../../utils/date';

export interface DocumentsView {
  documents: Document[];
  athletes: Athlete[];
}

export interface UploadDraft {
  ownerId: string;
  type: string;
  expiresAt?: string;
}

/**
 * Documents hook. Provides the scoped document list plus a mock upload
 * action. The new record is built by the document domain factory; the
 * hook only handles persistence and RBAC gating.
 */
export function useDocuments() {
  const service = useDataService();
  const { user } = useAuth();

  const state = useAsyncData<DocumentsView>(async () => {
    const [documents, athletes] = await Promise.all([
      service.documents.getAll(),
      service.athletes.getAll(),
    ]);
    return { documents, athletes };
  }, [user]);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const canUpload = canAccess(user, 'document', 'create');

  async function upload(draft: UploadDraft): Promise<boolean> {
    setUploading(true);
    setUploadError(null);
    try {
      const doc = documentsDomain.uploadDocumentMock({
        ownerType: 'athlete',
        ownerId: draft.ownerId,
        type: draft.type,
        uploadedAt: todayISO(),
        expiresAt: draft.expiresAt || undefined,
      });
      await service.documents.create(doc);
      state.reload();
      return true;
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setUploading(false);
    }
  }

  return { ...state, canUpload, upload, uploading, uploadError };
}
