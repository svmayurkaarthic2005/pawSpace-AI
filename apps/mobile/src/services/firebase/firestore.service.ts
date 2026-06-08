import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * Firebase Firestore Service
 * Generic CRUD operations for Firestore collections
 */

export class FirestoreService {
  /**
   * Get a document by ID
   */
  static async getDocument<T>(
    collectionPath: string,
    documentId: string
  ): Promise<T | null> {
    try {
      const doc = await firestore().collection(collectionPath).doc(documentId).get();
      
      if (!doc.exists) {
        return null;
      }

      return { id: doc.id, ...doc.data() } as T;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get document');
    }
  }

  /**
   * Get all documents from a collection
   */
  static async getCollection<T>(
    collectionPath: string,
    queryConstraints?: (ref: FirebaseFirestoreTypes.CollectionReference) => FirebaseFirestoreTypes.Query
  ): Promise<T[]> {
    try {
      const collectionRef = firestore().collection(collectionPath);
      const query = queryConstraints ? queryConstraints(collectionRef) : collectionRef;
      const snapshot = await query.get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get collection');
    }
  }

  /**
   * Create a new document
   */
  static async createDocument<T>(
    collectionPath: string,
    data: Omit<T, 'id'>
  ): Promise<string> {
    try {
      const docRef = await firestore().collection(collectionPath).add({
        ...data,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      return docRef.id;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create document');
    }
  }

  /**
   * Update an existing document
   */
  static async updateDocument<T>(
    collectionPath: string,
    documentId: string,
    data: Partial<T>
  ): Promise<void> {
    try {
      await firestore()
        .collection(collectionPath)
        .doc(documentId)
        .update({
          ...data,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update document');
    }
  }

  /**
   * Delete a document
   */
  static async deleteDocument(
    collectionPath: string,
    documentId: string
  ): Promise<void> {
    try {
      await firestore().collection(collectionPath).doc(documentId).delete();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete document');
    }
  }

  /**
   * Listen to document changes (real-time)
   */
  static subscribeToDocument<T>(
    collectionPath: string,
    documentId: string,
    callback: (data: T | null) => void
  ) {
    return firestore()
      .collection(collectionPath)
      .doc(documentId)
      .onSnapshot(
        (doc) => {
          if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() } as T);
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error('Document subscription error:', error);
        }
      );
  }

  /**
   * Listen to collection changes (real-time)
   */
  static subscribeToCollection<T>(
    collectionPath: string,
    callback: (data: T[]) => void,
    queryConstraints?: (ref: FirebaseFirestoreTypes.CollectionReference) => FirebaseFirestoreTypes.Query
  ) {
    const collectionRef = firestore().collection(collectionPath);
    const query = queryConstraints ? queryConstraints(collectionRef) : collectionRef;

    return query.onSnapshot(
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        callback(data);
      },
      (error) => {
        console.error('Collection subscription error:', error);
      }
    );
  }

  /**
   * Batch write operations
   */
  static async batchWrite(
    operations: Array<{
      type: 'create' | 'update' | 'delete';
      collectionPath: string;
      documentId?: string;
      data?: any;
    }>
  ): Promise<void> {
    try {
      const batch = firestore().batch();

      operations.forEach(({ type, collectionPath, documentId, data }) => {
        const collectionRef = firestore().collection(collectionPath);

        if (type === 'create') {
          const docRef = collectionRef.doc();
          batch.set(docRef, {
            ...data,
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
          });
        } else if (type === 'update' && documentId) {
          const docRef = collectionRef.doc(documentId);
          batch.update(docRef, {
            ...data,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          });
        } else if (type === 'delete' && documentId) {
          const docRef = collectionRef.doc(documentId);
          batch.delete(docRef);
        }
      });

      await batch.commit();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to execute batch write');
    }
  }
}

export default FirestoreService;
