import React from "react";

export default function EmptyState({
    icon = "inbox",
    title,
    description,
    className = "",
}) {
    return (
        <div className={`py-8 md:py-12 text-center ${className}`.trim()}>
            <span className="material-symbols-outlined text-3xl md:text-4xl text-slate-300 dark:text-slate-700 block mb-2">{icon}</span>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm">{title}</p>
            {description && <p className="text-slate-400 dark:text-slate-600 text-xs md:text-sm mt-1">{description}</p>}
        </div>
    );
}
