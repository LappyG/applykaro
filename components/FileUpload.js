"use client";
import { useState, useRef, useCallback } from "react";

export default function FileUpload({
  label,
  icon,
  file,
  onFile,
  text,
  onTextChange,
  extracting,
  error,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [mode, setMode] = useState("upload");

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          {icon} {label}
        </label>
        <div className="flex gap-0.5 rounded-md p-0.5" style={{ background: "var(--badge-bg)" }}>
          {["upload", "paste"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-2.5 py-1 rounded text-[11px] font-semibold border-none cursor-pointer transition-colors"
              style={{
                background: mode === m ? "var(--accent-subtle)" : "transparent",
                color: mode === m ? "var(--accent)" : "var(--text-faint)",
                fontFamily: "inherit",
              }}
            >
              {m === "upload" ? "Upload" : "Paste"}
            </button>
          ))}
        </div>
      </div>

      {mode === "upload" ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
          style={{
            height: 150,
            borderRadius: 14,
            border: `2px dashed ${
              dragOver
                ? "var(--accent)"
                : error
                ? "#ef4444"
                : file
                ? "#22c55e"
                : "var(--upload-border)"
            }`,
            background: dragOver
              ? "var(--drag-active-bg)"
              : "var(--input-bg)",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files[0]) onFile(e.target.files[0]);
            }}
          />

          {extracting ? (
            <>
              <div
                className="w-7 h-7 rounded-full animate-spin"
                style={{
                  border: "3px solid var(--spinner-track-alt)",
                  borderTopColor: "var(--accent)",
                }}
              />
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>Reading file...</p>
            </>
          ) : file ? (
            <>
              <div className="text-2xl mb-1">📄</div>
              <p className="text-sm font-semibold text-green-400 m-0">
                {file.name}
              </p>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>
                {text
                  ? `${text.split(/\s+/).filter(Boolean).length} words extracted`
                  : "Processing..."}
              </p>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-ghost)" }}>Click to replace</p>
            </>
          ) : (
            <>
              <div className="text-2xl mb-1 opacity-30">⬆</div>
              <p className="text-sm font-medium m-0" style={{ color: "var(--text-muted)" }}>
                Drop file or{" "}
                <span className="font-bold" style={{ color: "var(--accent)" }}>browse</span>
              </p>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-ghost)" }}>PDF or TXT</p>
            </>
          )}
        </div>
      ) : (
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={`Paste ${label.toLowerCase()} text...`}
          className="w-full resize-y outline-none"
          style={{
            height: 150,
            padding: 14,
            borderRadius: 14,
            background: "var(--input-bg)",
            border: "1px solid var(--input-border)",
            color: "var(--text-primary)",
            fontSize: 13,
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
      )}

      {error && <p className="text-[11px] text-red-400 mt-1.5">{error}</p>}
    </div>
  );
}
