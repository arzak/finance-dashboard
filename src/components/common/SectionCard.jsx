import React from "react";

export default function SectionCard({
    className = "",
    children,
}) {
    return (
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm ${className}`.trim()}>
            {children}
        </div>
    );
}
