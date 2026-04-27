// src/components/ui/image-upload.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
  shape?: "square" | "circle";
  size?: number;
}

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
}

// ── Single Image Upload (Logo, Cover) ──
export function ImageUpload({ value, onChange, label, hint, shape = "square", size = 120 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("upload failed");
      const data = await res.json();
      onChange(data.url);
    } catch {
      alert("فشل رفع الصورة");
    }
    setUploading(false);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) upload(file);
  }, [upload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  };

  const borderRadius = shape === "circle" ? "50%" : 16;

  return (
    <div>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{label}</label>}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          width: size, height: size, borderRadius,
          border: dragOver ? "2px dashed #e57328" : value ? "2px solid rgba(0,0,0,0.08)" : "2px dashed rgba(0,0,0,0.15)",
          background: dragOver ? "rgba(229,115,40,0.05)" : value ? "transparent" : "#fafafa",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: uploading ? "wait" : "pointer",
          overflow: "hidden", position: "relative",
          transition: "all 0.2s ease",
        }}
      >
        {uploading ? (
          <Loader2 style={{ width: 24, height: 24, color: "#e57328", animation: "spin 1s linear infinite" }} />
        ) : value ? (
          <>
            <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              style={{
                position: "absolute", top: 4, right: 4,
                width: 24, height: 24, borderRadius: "50%",
                background: "rgba(0,0,0,0.6)", border: "none",
                color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: 8 }}>
            <Upload style={{ width: 20, height: 20, color: "#9ca3af", margin: "0 auto 4px" }} />
            <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>اسحب أو اضغط</p>
          </div>
        )}
      </div>
      {hint && <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{hint}</p>}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
    </div>
  );
}

// ── Multi Image Upload (Product Gallery) ──
export function MultiImageUpload({ value, onChange, max = 5, label }: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    if (value.length >= max) {
      alert(`الحد الأقصى ${max} صور`);
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("upload failed");
      const data = await res.json();
      onChange([...value, data.url]);
    } catch {
      alert("فشل رفع الصورة");
    }
    setUploading(false);
  }, [value, onChange, max]);

  const removeImage = (index: number) => {
    const newVal = [...value];
    newVal.splice(index, 1);
    onChange(newVal);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  };

  return (
    <div>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{label}</label>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {/* Existing images */}
        {value.map((url, i) => (
          <div key={i} style={{
            width: 90, height: 90, borderRadius: 12,
            overflow: "hidden", position: "relative",
            border: "1px solid rgba(0,0,0,0.08)",
          }}>
            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              onClick={() => removeImage(i)}
              style={{
                position: "absolute", top: 3, right: 3,
                width: 22, height: 22, borderRadius: "50%",
                background: "rgba(0,0,0,0.6)", border: "none",
                color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X style={{ width: 12, height: 12 }} />
            </button>
          </div>
        ))}

        {/* Add button */}
        {value.length < max && (
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            style={{
              width: 90, height: 90, borderRadius: 12,
              border: "2px dashed rgba(0,0,0,0.15)",
              background: "#fafafa", cursor: uploading ? "wait" : "pointer",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}
          >
            {uploading ? (
              <Loader2 style={{ width: 20, height: 20, color: "#e57328", animation: "spin 1s linear infinite" }} />
            ) : (
              <>
                <ImageIcon style={{ width: 18, height: 18, color: "#9ca3af" }} />
                <span style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{value.length}/{max}</span>
              </>
            )}
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
    </div>
  );
}
