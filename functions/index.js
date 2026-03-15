/**
 * Cloud Functions para dineros-c0629
 * 
 * Uso de Secret Manager para APIs de terceros
 * @see https://firebase.google.com/docs/functions/config-env#secret-parameters
 */

const { defineSecret } = require("firebase-functions/params");
const { onCall } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");

// Inicializar Firebase Admin
initializeApp();

// ==========================================
// 🔐 DEFINICIÓN DE SECRETOS
// ==========================================
// Usa estos secretos para APIs de terceros (IA, pagos, etc.)
// Ejemplo: const geminiKey = defineSecret("GEMINI_API_KEY");

// ==========================================
// 📡 FUNCIONES DE EJEMPLO
// ==========================================

/**
 * Función de ejemplo que usa un secreto
 * 
 * Para usarla:
 * 1. Guarda el secreto: firebase functions:secrets:set GEMINI_API_KEY
 * 2. Despliega: firebase deploy --only functions
 * 3. Llama desde el frontend con getFunctions().httpsCallable()
 */
exports.ejemploConSecreto = onCall({
    // secrets: [geminiKey] // Descomenta cuando tengas secretos reales
}, async (request) => {
    // Verificar autenticación
    if (!request.auth) {
        throw new Error("No autorizado. Debes iniciar sesión.");
    }

    // Ejemplo de cómo acceder a un secreto:
    // const apiKey = geminiKey.value();
    
    return {
        message: "Función ejecada correctamente",
        userId: request.auth.uid,
        // secretUsado: apiKey // Nunca retornes secretos en la respuesta
    };
});

/**
 * Función protegida que solo usuarios autenticados pueden llamar
 */
exports.funcionProtegida = onCall({
    // Requiere autenticación
}, async (request) => {
    // Verificar autenticación
    if (!request.auth) {
        throw new Error("No autorizado");
    }

    // Aquí iría tu lógica segura
    return {
        success: true,
        data: "Datos protegidos",
        timestamp: new Date().toISOString()
    };
});
