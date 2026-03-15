---
name: firebase-secrets-management
description: Guía y estándares para la gestión segura de API Keys y secretos usando Firebase Cloud Functions y Cloud Secret Manager.
---

# Gestión Segura de Secretos en Firebase

Este estándar define cómo deben manejarse las API Keys y otros datos sensibles en este proyecto, priorizando la seguridad y evitando la exposición de llaves en el frontend.

## 🚨 Reglas Críticas
1. **PROHIBIDO** guardar API Keys de servicios sensibles (IA, Bases de Datos, APIs de pago) en archivos `.env` o en el código del frontend (`src/`).
2. **OBLIGATORIO** usar `firebase functions:secrets` para cualquier llave que deba ser accedida por Cloud Functions.
3. **OBLIGATORIO** usar Cloud Functions como proxy para consumir servicios de terceros, eliminando la necesidad de llaves en el cliente.

## 🛠 Procedimiento de Configuración

### 1. Definir un Secreto en Firebase
Para guardar una nueva llave o actualizar una existente (ej: `GEMINI_API_KEY`):

```bash
# Comando interactivo
firebase functions:secrets:set NOMBRE_DEL_SECRETO

# Comando directo (para agentes/automatización)
echo "VALOR_DE_LA_LLAVE" | firebase functions:secrets:set NOMBRE_DEL_SECRETO --data-file - --force
```

### 2. Acceder al Secreto en Cloud Functions (`functions/index.js`)
Usa `defineSecret` de `firebase-functions/params`:

```javascript
const { defineSecret } = require("firebase-functions/params");
const { onCall } = require("firebase-functions/v2/https");

// Definir el acceso al secreto
const miSecreto = defineSecret("NOMBRE_DEL_SECRETO");

exports.miFuncionIA = onCall({
    secrets: [miSecreto] // Declarar el secreto para esta función
}, async (request) => {
    const api_key = miSecreto.value();
    // Usar la llave...
});
```

### 3. Despliegue
Cualquier cambio en los secretos requiere un despliegue de las funciones para que surta efecto:

```bash
firebase deploy --only functions
```

## 🧹 Limpieza del Frontend
Una vez que el secreto esté configurado en el backend:
1. Elimina las referencias a la API Key en el archivo `.env`.
2. Asegúrate de que los archivos `.env` locales estén en el `.gitignore`.
3. Reemplaza las llamadas directas a la API de terceros en el código local por llamadas a la Cloud Function correspondiente.

## 📄 Referencia de Secretos del Proyecto
Actualiza esta lista cuando agregues nuevos secretos:
- `GEMINI_API_KEY`: Usada por la función `extractAgreements` para servicios de Google AI.
