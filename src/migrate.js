import { db } from "./firebase";
import {
    collection,
    getDocs,
    writeBatch,
    doc,
    query,
    where,
} from "firebase/firestore";

/**
 * Migrates all existing documents that have no userId field,
 * assigning them to the given uid.
 * Runs silently — safe to call multiple times (idempotent).
 */
export async function migrateOrphanedDocs(uid) {
    const COLLECTIONS = ["transactions", "creditCards"];
    const batch = writeBatch(db);
    let count = 0;

    for (const col of COLLECTIONS) {
        // Fetch documents that have no userId set
        // Firestore doesn't support "field does not exist" natively,
        // so we pull all docs and filter client-side (open rules required)
        const snapshot = await getDocs(collection(db, col));

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            // Only migrate docs that truly have no userId
            if (!data.userId) {
                batch.update(doc(db, col, docSnap.id), { userId: uid });
                count++;
            }
        });
    }

    if (count > 0) {
        await batch.commit();
        console.log(`[Migration] Assigned ${count} orphaned documents to uid: ${uid}`);
    } else {
        console.log("[Migration] No orphaned documents found.");
    }

    return count;
}
