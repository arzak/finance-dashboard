/**
 * Función para eliminar TODAS las transacciones de Firestore
 * 
 * USO:
 * 1. Abre tu aplicación en el navegador
 * 2. Abre la consola del desarrollador (F12)
 * 3. Copia y pega este código completo
 * 4. Presiona Enter
 * 5. Confirma cuando te pregunte
 */

async function borrarTodasLasTransacciones() {
    const { db } = await import('./src/firebase.js');
    const { collection, getDocs, deleteDoc, query, where } = await import('firebase/firestore');
    
    const confirmacion = confirm('⚠️ ¿Estás SEGURO que quieres eliminar TODAS las transacciones? Esta acción no se puede deshacer.');
    if (!confirmacion) {
        console.log('Operación cancelada');
        return;
    }
    
    console.log('🔄 Iniciando eliminación de transacciones...');
    
    try {
        // Obtener todas las transacciones del usuario actual
        const transactionsRef = collection(db, 'transactions');
        const snapshot = await getDocs(transactionsRef);
        
        console.log(`📊 Se encontraron ${snapshot.size} transacciones`);
        
        let eliminadas = 0;
        for (const doc of snapshot.docs) {
            await deleteDoc(doc.ref);
            eliminadas++;
        }
        
        console.log(`✅ ¡Completado! Se eliminaron ${eliminadas} transacciones.`);
        alert(`✅ Se eliminaron ${eliminadas} transacciones exitosamente.\nRecarga la página para ver los cambios.`);
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error: ' + error.message);
    }
}

// Ejecutar la función
borrarTodasLasTransacciones();
