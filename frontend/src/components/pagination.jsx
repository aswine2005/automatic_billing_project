export const Pagination = ({ page, pageCount, onPrev, onNext }) => {
  return (
    <div className="flex items-center justify-between text-xs text-slate-300 mt-3">
      <span className="text-[11px] text-slate-400">
        Page {page} of {pageCount}
      </span>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-md border border-slate-800 bg-slate-950/60 disabled:opacity-50"
        >
          Prev
        </button>
        <button
          onClick={onNext}
          disabled={page >= pageCount}
          className="px-3 py-1.5 rounded-md border border-slate-800 bg-slate-950/60 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

