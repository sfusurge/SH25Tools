
import { db } from "$lib/components/firebase/firebase";
import { doc, updateDoc, increment, setDoc, type FieldValue, getDoc, getDocs, collection } from "firebase/firestore/lite";


export async function getSiteStats() {
    const colRef = collection(db, `site_stats`);
    const snap = await getDocs(colRef);

    return snap.docs.reduce((prev, cur,) => {
        prev[cur.id] = cur.data();
        return prev;
    }, {} as { [key: string]: any }) as { [key: string]: any };
}

export async function getGameStats() {
    const colRef = collection(db, `game_stats`);
    const snap = await getDocs(colRef);

    return snap.docs.reduce((prev, cur,) => {
        prev[cur.id] = cur.data();
        return prev;
    }, {} as { [key: string]: any }) as { [key: string]: any };
}

// type of any L
export async function publishMaze(maze: any, ownerId: string) {
    const docRef = doc(db, 'maze', `${ownerId}-${maze.id}`);
    const newMaze = { ...maze };
    newMaze.obstacleMap = JSON.stringify(newMaze.obstacleMap);
    await setDoc(docRef, newMaze, { merge: true });
}