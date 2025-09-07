import { app } from '@/firebase-init';
import { getDatabase, push, ref, serverTimestamp } from 'firebase/database';

let database: any = null;
if (typeof window === 'undefined') {
  try {
    database = getDatabase(app);
  } catch (error) {
    console.warn('Firebase database init failed:', error);
  }
}

export interface FormSubmission {
  id?: string;
  projectId: string;
  keyId: string;
  data: Record<string, any>;
  metadata: {
    userAgent?: string;
    ip?: string;
    referer?: string;
    timestamp: any;
  };
}

export async function saveFormSubmission(submission: Omit<FormSubmission, 'id'>) {
  if (!database) {
    throw new Error('Firebase database not initialized');
  }

  try {
    const submissionsRef = ref(database, `form-submissions/${submission.projectId}`);
    const submissionData = {
      ...submission,
      metadata: {
        ...submission.metadata,
        timestamp: serverTimestamp(),
      },
    };

    const result = await push(submissionsRef, submissionData);
    return result.key;
  } catch (error) {
    console.error('Error saving form submission:', error);
    throw error;
  }
}

export async function getFormSubmissions(projectId: string, limit: number = 100) {
  if (!database) {
    throw new Error('Firebase database not initialized');
  }

  try {
    const { get, query, orderByChild, limitToLast } = await import('firebase/database');
    const submissionsRef = ref(database, `form-submissions/${projectId}`);
    const submissionsQuery = query(
      submissionsRef,
      orderByChild('metadata/timestamp'),
      limitToLast(limit),
    );

    const snapshot = await get(submissionsQuery);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching form submissions:', error);
    throw error;
  }
}
