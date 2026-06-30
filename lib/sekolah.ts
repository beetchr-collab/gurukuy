import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
} from "firebase/firestore";

import { db } from "./firebase";

export interface School {
    id: string;
    nama: string;
    alamat?: string;
    email?: string;
    telepon?: string;
    logo?: string;
    ownerId: string;
    createdAt?: any;
}

export const getSchoolById = async (
    schoolId: string
): Promise<School | null> => {
    try {
        const snapshot = await getDoc(doc(db, "sekolah", schoolId));

        if (!snapshot.exists()) {
            return null;
        }

        return {
            id: snapshot.id,
            ...(snapshot.data() as Omit<School, "id">),
        };
    } catch (error) {
        console.error(error);
        return null;
    }
};