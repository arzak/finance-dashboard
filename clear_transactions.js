// Script para eliminar todas las transacciones de Firestore
// Ejecutar con: node clear_transactions.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, query, where } from 'firebase/firestore';

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBQWgXGzXJvN9vKzJzJzJzJzJzJzJzJzJz",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// NOTA: Reemplaza con tu configuración real de firebase.js
// O importa directamente desde tu archivo firebase.js

async function clearAllTransactions() {
    console.log('Iniciando eliminación de transacciones...');
    
    // Aquí debes importar tu configuración de firebase existente
    const { db } = await import('./src/firebase.js');
    
    try {
        const transactionsRef = collection(db, 'transactions');
        const snapshot = await getDocs(transactionsRef);
        
        console.log(`Encontradas ${snapshot.size} transacciones`);
        
        let deleted = 0;
        for (const doc of snapshot.docs) {
            await deleteDoc(doc.ref);
            deleted++;
            console.log(`Eliminada ${deleted}/${snapshot.size}`);
        }
        
        console.log(`✅ Se eliminaron ${deleted} transacciones exitosamente`);
    } catch (error) {
        console.error('❌ Error eliminando transacciones:', error);
    }
}

clearAllTransactions();
