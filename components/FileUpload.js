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
        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
          {icon} {label}
        </label>
        <div className="flex gap-0.5 bg-white/[0.04] rounded-md p-0.5">
          {["upload", "paste"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-2.5 py-1 rounded text-[11px] font-semibold border-none cursor-pointer transition-colors"
              style={{
                background: mode === m ? "rgba(168,85,247,0.2)" : "transparent",
                color: mode === m ? "#c084fc" : "rgba(255,255,255,0.3)",
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
                ? "#a855f7"
                : error
                ? "#ef4444"
                : file
                ? "#22c55e"
                : "rgba(255,255,255,0.1)"
            }`,
            background: dragOver
              ? "rgba(168,85,247,0.06)"
              : "rgba(255,255,255,0.02)",
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
                  border: "3px solid rgba(168,85,247,0.2)",
                  borderTopColor: "#a855f7",
                }}
              />
              <p className="text-xs text-white/40 mt-2">Reading file...</p>
            </>
          ) : file ? (
            <>
              <div className="text-2xl mb-1">📄</div>
              <p className="text-sm font-semibold text-green-400 m-0">
                {file.name}
              </p>
              <p className="text-[11px] text-white/30 mt-1">
                {text
                  ? `${text.split(/\s+/).filter(Boolean).length} words extracted`
                  : "Processing..."}
              </p>
              <p className="text-[10px] text-white/15 mt-1">Click to replace</p>
            </>
          ) : (
            <>
              <div className="text-2xl mb-1 opacity-30">⬆</div>
              <p className="text-sm font-medium text-white/45 m-0">
                Drop file or{" "}
                <span className="text-purple-400 font-bold">browse</span>
              </p>
              <p className="text-[11px] text-white/18 mt-1">PDF or TXT</p>
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
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#e2e2e8",
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
