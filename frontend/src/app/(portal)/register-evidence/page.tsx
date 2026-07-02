"use client";

import { useState } from "react";
import { FiFile, FiHash, FiShield, FiUpload } from "react-icons/fi";

const steps = ["Metadata", "Upload", "Review"];

export default function RegisterEvidencePage() {
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    caseId: "CASE-2026-041",
    classification: "Restricted",
    notes: "",
  });
  const [submission, setSubmission] = useState<string | null>(null);

  const next = () => setStep((current) => Math.min(current + 1, steps.length - 1));
  const back = () => setStep((current) => Math.max(current - 1, 0));

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
        <div className="flex flex-wrap gap-3">
          {steps.map((label, index) => (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-full border px-4 py-2 text-sm ${
                index === step
                  ? "border-cyan-300/30 bg-cyan-400/10 text-white"
                  : index < step
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                    : "border-white/10 bg-white/5 text-slate-400"
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs">
                {index + 1}
              </span>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6">
          {step === 0 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-white">Evidence metadata</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Capture the case reference and classification before upload.
                </p>
              </div>
              <label className="block">
                <span className="text-sm text-slate-300">Evidence title</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-300/30"
                  placeholder="Laptop seizure package"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm text-slate-300">Case ID</span>
                  <input
                    value={form.caseId}
                    onChange={(event) => setForm({ ...form, caseId: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/30"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-300">Classification</span>
                  <select
                    value={form.classification}
                    onChange={(event) => setForm({ ...form, classification: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/30"
                  >
                    <option>Restricted</option>
                    <option>Confidential</option>
                    <option>Public</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-sm text-slate-300">Notes</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  className="mt-2 min-h-32 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/30"
                  placeholder="Describe the chain-of-custody context"
                />
              </label>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-white">Upload files</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Attach the evidence bundle, then record the generated fingerprint.
                </p>
              </div>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-cyan-300/30 bg-cyan-400/5 px-6 py-12 text-center transition hover:bg-cyan-400/10">
                <FiUpload className="text-3xl text-cyan-300" />
                <span className="mt-4 text-base font-semibold text-white">
                  Drop files here or click to browse
                </span>
                <span className="mt-2 text-sm text-slate-400">
                  Images, PDFs, videos, and archive bundles
                </span>
                <input
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={(event) =>
                    setFiles(Array.from(event.target.files ?? []).map((file) => file.name))
                  }
                />
              </label>
              <div className="grid gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <FiFile className="text-cyan-300" />
                  <span>{files.length ? `${files.length} file(s) ready` : "No files selected yet"}</span>
                </div>
                {files.map((file) => (
                  <div key={file} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                    {file}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-white">Review and submit</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Verify the intake payload before the record is written on-chain.
                </p>
              </div>
              <div className="grid gap-4 rounded-[1.25rem] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Title</span>
                  <span className="text-white">{form.title || "Untitled evidence"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Case</span>
                  <span className="text-white">{form.caseId}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Classification</span>
                  <span className="text-white">{form.classification}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">File count</span>
                  <span className="text-white">{files.length}</span>
                </div>
              </div>
              <div className="rounded-[1.25rem] border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-100">
                <div className="flex items-center gap-3">
                  <FiHash />
                  <span className="font-semibold">Fingerprint preview</span>
                </div>
                <p className="mt-2 break-all text-sm text-emerald-50/90">
                  0x7c2b9f6d2a4e8b1c9f0d3e5a1b8f4c2d7e9a6f0b1c4d8e2f6a9b3c7d1e5f2a4b
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-40"
            >
              Back
            </button>
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setSubmission("Evidence registered on the local prototype ledger.")
                }
                className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Submit evidence
              </button>
            )}
          </div>
          {submission ? (
            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {submission}
            </div>
          ) : null}
        </section>

        <aside className="space-y-4 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Intake status</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
              <FiShield className="text-cyan-300" /> Draft record ready
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Hash policy</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Files are fingerprinted client-side before custody metadata is committed.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Current step</p>
            <p className="mt-2 text-2xl font-semibold text-white">{steps[step]}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}