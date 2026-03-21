import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthContext";

// Google logo SVG inline (no external dep needed)
function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="size-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

// Password strength validator
function validatePasswordStrength(password) {
    const requirements = [
        { test: (p) => p.length >= 8, label: "Mínimo 8 caracteres" },
        { test: (p) => /[A-Z]/.test(p), label: "Una mayúscula" },
        { test: (p) => /[a-z]/.test(p), label: "Una minúscula" },
        { test: (p) => /[0-9]/.test(p), label: "Un número" },
        { test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p), label: "Un carácter especial" },
    ];

    const passed = requirements.filter(req => req.test(password));
    const strength = (passed.length / requirements.length) * 100;

    return {
        strength,
        passed: passed.length,
        total: requirements.length,
        requirements,
        isValid: strength === 100
    };
}

export default function AuthScreen() {
    const { login, register, loginWithGoogle } = useAuth();
    const [mode, setMode] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutTime, setLockoutTime] = useState(0);
    const [showPassword, setShowPassword] = useState(false);

    const passwordStrength = mode === "register" ? validatePasswordStrength(password) : null;

    // Rate limiting: decrement lockout timer
    useEffect(() => {
        if (lockoutTime > 0) {
            const timer = setTimeout(() => setLockoutTime(lockoutTime - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [lockoutTime]);

    const ERROR_MESSAGES = {
        "auth/user-not-found": "No existe una cuenta con ese correo.",
        "auth/wrong-password": "Contraseña incorrecta.",
        "auth/invalid-credential": "Correo o contraseña incorrectos.",
        "auth/email-already-in-use": "Ese correo ya está registrado.",
        "auth/weak-password": "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.",
        "auth/invalid-email": "El formato del correo no es válido.",
        "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
        "auth/popup-closed-by-user": "Ventana de Google cerrada. Intenta de nuevo.",
        "auth/popup-blocked": "El navegador bloqueó el popup. Permite los popups para este sitio.",
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check rate limiting
        if (lockoutTime > 0) {
            setError(`Demasiados intentos fallidos. Espera ${lockoutTime}s para intentar de nuevo.`);
            return;
        }

        setError("");

        // Validate password strength for registration
        if (mode === "register" && passwordStrength && !passwordStrength.isValid) {
            setError("La contraseña no cumple con los requisitos de seguridad.");
            return;
        }

        setLoading(true);
        try {
            if (mode === "register") {
                if (!name.trim()) {
                    setError("El nombre es requerido.");
                    setLoading(false);
                    return;
                }
                await register(email, password, name.trim());
            } else {
                await login(email, password);
            }
            // Reset failed attempts on successful login
            setFailedAttempts(0);
        } catch (err) {
            const errorCode = err.code;
            setError(ERROR_MESSAGES[errorCode] || "Error inesperado. Intenta de nuevo.");

            // Increment failed attempts for login errors
            if (mode === "login" && errorCode && errorCode.includes("auth/")) {
                const newAttempts = failedAttempts + 1;
                setFailedAttempts(newAttempts);

                // Lockout after 5 failed attempts
                if (newAttempts >= 5) {
                    setLockoutTime(30); // 30 seconds lockout
                    setFailedAttempts(0);
                }
            }
        }
        setLoading(false);
    };

    const handleGoogle = async () => {
        setError("");
        setGoogleLoading(true);
        try {
            await loginWithGoogle();
            setFailedAttempts(0);
        } catch (err) {
            setError(ERROR_MESSAGES[err.code] || "Error al iniciar con Google.");
        }
        setGoogleLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4"
            style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative w-full max-w-md"
            >
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                        <span className="material-symbols-outlined text-white text-xl">credit_card</span>
                    </div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Finance Pro</span>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-100 dark:border-slate-800">
                        {["login", "register"].map((m) => (
                            <button
                                key={m}
                                onClick={() => { setMode(m); setError(""); }}
                                className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === m
                                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-950/30"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    }`}
                            >
                                {m === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
                            </button>
                        ))}
                    </div>

                    <div className="p-8">
                        {/* Google Button */}
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={handleGoogle}
                            disabled={googleLoading || loading}
                            className="w-full flex items-center justify-center gap-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-3 rounded-xl transition-all text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                        >
                            {googleLoading ? (
                                <svg className="animate-spin size-5" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : (
                                <GoogleIcon />
                            )}
                            {googleLoading ? "Conectando..." : "Continuar con Google"}
                        </motion.button>

                        {/* Divider */}
                        <div className="relative flex items-center gap-3 mb-6">
                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                            <span className="text-xs text-slate-400 font-medium">o con correo</span>
                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={mode}
                                initial={{ opacity: 0, x: mode === "login" ? -12 : 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {mode === "register" && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Nombre completo
                                            </label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Ej. Alex Morgan"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                                                required
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Correo electrónico
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="tu@correo.com"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Contraseña
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder={mode === "register" ? "Mínimo 8 caracteres" : "••••••••"}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-12 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    {showPassword ? "visibility_off" : "visibility"}
                                                </span>
                                            </button>
                                        </div>

                                        {/* Password strength indicator (register mode) */}
                                        {mode === "register" && password && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="mt-3 space-y-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-300 ${passwordStrength.strength < 50
                                                                    ? "bg-rose-500"
                                                                    : passwordStrength.strength < 80
                                                                        ? "bg-amber-500"
                                                                        : "bg-emerald-500"
                                                                }`}
                                                            style={{ width: `${passwordStrength.strength}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-semibold ${passwordStrength.strength < 50
                                                            ? "text-rose-500"
                                                            : passwordStrength.strength < 80
                                                                ? "text-amber-500"
                                                                : "text-emerald-500"
                                                        }`}>
                                                        {Math.round(passwordStrength.strength)}%
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-1">
                                                    {passwordStrength.requirements.map((req, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`flex items-center gap-1.5 text-xs ${req.test(password)
                                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                                    : "text-slate-400"
                                                                }`}
                                                        >
                                                            <span className="material-symbols-outlined text-xs">
                                                                {req.test(password) ? "check_circle" : "radio_button_unchecked"}
                                                            </span>
                                                            {req.label}
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Rate limiting warning */}
                                        {lockoutTime > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mt-2 flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-xs"
                                            >
                                                <span className="material-symbols-outlined text-sm flex-shrink-0">lock_clock</span>
                                                Seguridad: Intenta de nuevo en {lockoutTime}s
                                            </motion.div>
                                        )}
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-2 text-rose-600 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3 text-sm"
                                        >
                                            <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
                                            {error}
                                        </motion.div>
                                    )}

                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={loading || googleLoading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 text-sm mt-2"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Procesando...
                                            </>
                                        ) : (
                                            mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"
                                        )}
                                    </motion.button>
                                </form>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    Tus datos son privados y solo tú puedes verlos.
                </p>
            </motion.div>
        </div>
    );
}
