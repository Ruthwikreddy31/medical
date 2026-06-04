import { Upload } from "lucide-react";

export default function ReportUploader({ error, loading, onUpload }) {
  return (
    <div className="rounded-lg border border-clinic-line bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Medical Report Upload</h2>
      <label className="grid min-h-40 cursor-pointer place-items-center rounded-md border border-dashed border-clinic-line bg-clinic-panel p-5 text-center text-clinic-muted">
        <Upload className="mb-2 text-clinic-green" size={28} />
        <span>{loading ? "Analyzing report..." : "Choose a report file for OCR analysis"}</span>
        <input className="sr-only" type="file" onChange={(event) => event.target.files?.[0] && onUpload(event.target.files[0])} />
      </label>
      {error && <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-clinic-red">{error}</p>}
    </div>
  );
}
