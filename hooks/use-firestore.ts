"use client"

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  DocumentData,
  CollectionReference,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

type FirestoreQuery = {
  collectionName: string;
  constraints?: QueryConstraint[];
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  limitCount?: number;
}

export function useFirestore() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getDocuments = async ({ 
    collectionName, 
    constraints = [], 
    orderByField, 
    orderDirection = 'asc',
    limitCount 
  }: FirestoreQuery) => {
    setLoading(true);
    setError(null);
    
    try {
      const collectionRef = collection(db, collectionName);
      
      let queryConstraints = [...constraints];
      
      if (orderByField) {
        queryConstraints.push(orderBy(orderByField, orderDirection));
      }
      
      if (limitCount) {
        queryConstraints.push(limit(limitCount));
      }
      
      const q = query(collectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setLoading(false);
      return documents;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setLoading(false);
      throw err;
    }
  };

  const addDocument = async (collectionName: string, data: DocumentData) => {
    setLoading(true);
    setError(null);
    
    try {
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, data);
      setLoading(false);
      return { id: docRef.id, ...data };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setLoading(false);
      throw err;
    }
  };

  const updateDocument = async (collectionName: string, id: string, data: Partial<DocumentData>) => {
    setLoading(true);
    setError(null);
    
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, data);
      setLoading(false);
      return { id, ...data };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setLoading(false);
      throw err;
    }
  };

  const deleteDocument = async (collectionName: string, id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      setLoading(false);
      return { id };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setLoading(false);
      throw err;
    }
  };

  return {
    loading,
    error,
    getDocuments,
    addDocument,
    updateDocument,
    deleteDocument
  };
} 