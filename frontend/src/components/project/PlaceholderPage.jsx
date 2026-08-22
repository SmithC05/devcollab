/**
 * Reusable placeholder page for modules that are not yet implemented.
 * Used across all project routes until specific module UIs are defined.
 */
export default function PlaceholderPage({ title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-12 select-none">
      <div className="w-14 h-14 rounded-full bg-[#1c1c1e] border border-[#292929] flex items-center justify-center mb-5 text-2xl">
        🚧
      </div>
      <h1 className="text-lg font-semibold text-[#f5f5f5] mb-2">{title}</h1>
      <p className="text-sm text-[#737373] max-w-xs leading-relaxed">
        {subtitle || 'This module will be implemented in a future phase.'}
      </p>
    </div>
  );
}
