const fs = require("fs");
const path = require("path");
const { cert, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

const PROJECT_ID = "dineros-c0629";

function resolveServiceAccount() {
    const explicitPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!explicitPath) {
        return null;
    }

    const absolutePath = path.resolve(explicitPath);

    if (!fs.existsSync(absolutePath)) {
        throw new Error(
            `No se encontró el archivo de credenciales en: ${absolutePath}`,
        );
    }

    return require(absolutePath);
}

const serviceAccount = resolveServiceAccount();

initializeApp(serviceAccount
    ? {
        credential: cert(serviceAccount),
        projectId: PROJECT_ID,
    }
    : {
        projectId: PROJECT_ID,
    });

const db = getFirestore();
const auth = getAuth();

function normalizeTransaction(transaction) {
    const updated = { ...transaction };
    const storeName = String(updated.store || "").trim();
    const isHealthStore = /\b(gym|gimnasio|smart\s*fit)\b/i.test(storeName);

    if (updated.category === "Tecnologia") {
        updated.category = "Tecnología";
    }

    if (
        ["Otros", "Otros Ingresos", "Otro"].includes(updated.category) &&
        updated.store &&
        /pensi[oó]n/i.test(updated.store)
    ) {
        updated.category = "Pensiones";
        updated.icon = "account_balance";
        updated.iconColor = "amber";
    }

    if (isHealthStore) {
        updated.category = "Salud";
        updated.icon = "medical_services";
        updated.iconColor = "rose";
    }

    return updated;
}

function parseArgs(argv) {
    return argv.reduce((args, arg) => {
        if (arg === "--commit") {
            args.commit = true;
            return args;
        }

        if (arg === "--dry-run") {
            args.commit = false;
            return args;
        }

        if (arg.startsWith("--userId=")) {
            args.userId = arg.slice("--userId=".length);
            return args;
        }

        if (arg.startsWith("--email=")) {
            args.email = arg.slice("--email=".length);
            return args;
        }

        if (arg.startsWith("--debug-store=")) {
            args.debugStore = arg.slice("--debug-store=".length);
            return args;
        }

        return args;
    }, { commit: false, userId: null, email: null, debugStore: null });
}

async function resolveUserId({ userId, email }) {
    if (userId) {
        return userId;
    }

    if (!email) {
        return null;
    }

    const userRecord = await auth.getUserByEmail(email);
    return userRecord.uid;
}

function buildPatch(original, normalized) {
    const patch = {};

    if (normalized.category !== original.category) {
        patch.category = normalized.category;
    }

    if (normalized.icon !== original.icon) {
        patch.icon = normalized.icon;
    }

    if (normalized.iconColor !== original.iconColor) {
        patch.iconColor = normalized.iconColor;
    }

    return patch;
}

async function run() {
    const options = parseArgs(process.argv.slice(2));
    const targetUserId = await resolveUserId(options);

    let query = db.collection("transactions");

    if (targetUserId) {
        query = query.where("userId", "==", targetUserId);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
        console.log("No se encontraron transacciones para migrar.");
        return;
    }

    const updates = [];
    const debugMatches = [];

    snapshot.forEach((docSnap) => {
        const original = docSnap.data();
        const storeName = String(original.store || "").trim();
        const normalized = normalizeTransaction(original);
        const patch = buildPatch(original, normalized);

        if (
            options.debugStore &&
            storeName.toLowerCase().includes(options.debugStore.toLowerCase())
        ) {
            debugMatches.push({
                id: docSnap.id,
                store: storeName,
                category: original.category ?? null,
                icon: original.icon ?? null,
                iconColor: original.iconColor ?? null,
                wouldUpdate: Object.keys(patch).length > 0,
                patch,
            });
        }

        if (Object.keys(patch).length > 0) {
            updates.push({
                id: docSnap.id,
                userId: original.userId ?? null,
                store: original.store ?? "",
                before: {
                    category: original.category ?? null,
                    icon: original.icon ?? null,
                    iconColor: original.iconColor ?? null,
                },
                after: patch,
                ref: docSnap.ref,
            });
        }
    });

    if (updates.length === 0) {
        if (debugMatches.length > 0) {
            console.log(`Coincidencias debug para "${options.debugStore}": ${debugMatches.length}`);
            debugMatches.forEach((match) => {
                console.log(
                    [
                        `- ${match.id}`,
                        `store="${match.store}"`,
                        `category="${match.category}"`,
                        `icon="${match.icon}"`,
                        `iconColor="${match.iconColor}"`,
                        `wouldUpdate=${match.wouldUpdate}`,
                        `patch=${JSON.stringify(match.patch)}`,
                    ].join(" | "),
                );
            });
        }
        console.log("No hubo cambios necesarios. El histórico ya está normalizado.");
        return;
    }

    if (debugMatches.length > 0) {
        console.log(`Coincidencias debug para "${options.debugStore}": ${debugMatches.length}`);
        debugMatches.forEach((match) => {
            console.log(
                [
                    `- ${match.id}`,
                    `store="${match.store}"`,
                    `category="${match.category}"`,
                    `icon="${match.icon}"`,
                    `iconColor="${match.iconColor}"`,
                    `wouldUpdate=${match.wouldUpdate}`,
                    `patch=${JSON.stringify(match.patch)}`,
                ].join(" | "),
            );
        });
    }

    console.log(`Transacciones candidatas a actualizar: ${updates.length}`);
    updates.slice(0, 20).forEach((update) => {
        console.log(
            [
                `- ${update.id}`,
                `userId=${update.userId ?? "sin userId"}`,
                `store="${update.store}"`,
                `category: "${update.before.category}" -> "${update.after.category ?? update.before.category}"`,
                `icon: "${update.before.icon}" -> "${update.after.icon ?? update.before.icon}"`,
                `iconColor: "${update.before.iconColor}" -> "${update.after.iconColor ?? update.before.iconColor}"`,
            ].join(" | "),
        );
    });

    if (!options.commit) {
        console.log("");
        console.log("Dry run completado. No se escribieron cambios.");
        console.log("Ejecuta de nuevo con --commit para aplicar la migración.");
        return;
    }

    const chunkSize = 400;
    for (let i = 0; i < updates.length; i += chunkSize) {
        const batch = db.batch();
        const chunk = updates.slice(i, i + chunkSize);

        chunk.forEach((update) => {
            batch.update(update.ref, update.after);
        });

        await batch.commit();
    }

    console.log(`Migración completada. Transacciones actualizadas: ${updates.length}`);
}

run().catch((error) => {
    console.error("Error ejecutando la migración histórica de transacciones:");
    if (error.code === "app/invalid-credential") {
        console.error("");
        console.error("Faltan credenciales locales de Firebase Admin.");
        console.error("1. Descarga una service account JSON desde Firebase Console > Project settings > Service accounts.");
        console.error("2. Define GOOGLE_APPLICATION_CREDENTIALS con la ruta del JSON.");
        console.error("3. Vuelve a ejecutar el comando.");
    }
    console.error(error);
    process.exitCode = 1;
});
