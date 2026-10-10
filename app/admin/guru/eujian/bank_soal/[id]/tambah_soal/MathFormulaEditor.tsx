"use client";

import { useRef, useState } from "react";

const greekLetters: Record<string, string> = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  theta: "θ",
  lambda: "λ",
  mu: "μ",
  pi: "π",
  rho: "ρ",
  sigma: "σ",
  phi: "φ",
  omega: "ω",
  Delta: "Δ",
  Pi: "Π",
  Sigma: "Σ",
  Omega: "Ω",
};

const mathSymbols: Record<string, string> = {
  times: "×",
  cdot: "⋅",
  div: "÷",
  pm: "±",
  mp: "∓",
  le: "≤",
  leq: "≤",
  ge: "≥",
  geq: "≥",
  neq: "≠",
  approx: "≈",
  infty: "∞",
  sum: "∑",
  prod: "∏",
  int: "∫",
  partial: "∂",
  nabla: "∇",
  to: "→",
  rightarrow: "→",
  in: "∈",
  notin: "∉",
  forall: "∀",
  exists: "∃",
};

const escapeXml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[character];
  });

const latexToMathML = (latex: string) => {
  let index = 0;
  const readGroup = (): string => {
    while (/\s/.test(latex[index] || "") && index < latex.length) index += 1;
    if (latex[index] !== "{") return readAtom();
    index += 1;
    const contents = readSequence(true);
    if (latex[index] === "}") index += 1;
    return contents;
  };
  const readAtom = (): string => {
    const character = latex[index];
    if (!character) return "<mrow><mi>□</mi></mrow>";
    if (character === "{") return readGroup();
    if (character === "\\") {
      index += 1;
      const commandStart = index;
      while (/[a-zA-Z]/.test(latex[index] || "")) index += 1;
      const command = latex.slice(commandStart, index) || latex[index++] || "";
      if (command === "frac") {
        return `<mfrac>${readGroup()}${readGroup()}</mfrac>`;
      }
      if (command === "sqrt") {
        if (latex[index] === "[") {
          index += 1;
          const degreeStart = index;
          while (index < latex.length && latex[index] !== "]") index += 1;
          const degree = latex.slice(degreeStart, index);
          if (latex[index] === "]") index += 1;
          const trimmedDegree = degree.trim();
          const degreeMarkup = /^[0-9]+$/.test(trimmedDegree)
            ? `<mn>${escapeXml(trimmedDegree)}</mn>`
            : `<mi>${escapeXml(trimmedDegree || "n")}</mi>`;
          return `<mroot>${readGroup()}${degreeMarkup}</mroot>`;
        }
        return `<msqrt>${readGroup()}</msqrt>`;
      }
      if (["text", "mathrm", "mathbf"].includes(command)) {
        if (latex[index] === "{") {
          index += 1;
          const start = index;
          while (index < latex.length && latex[index] !== "}") index += 1;
          const contents = latex.slice(start, index);
          if (latex[index] === "}") index += 1;
          return `<mtext>${escapeXml(contents)}</mtext>`;
        }
        return `<mtext>${escapeXml(command)}</mtext>`;
      }
      if (command === "left" || command === "right") return readAtom();
      if (command === ",") return '<mspace width="0.2em"/>';
      if (command === ";") return '<mspace width="0.4em"/>';
      if (command === " ") return '<mspace width="0.25em"/>';
      if (command in greekLetters) {
        return `<mi>${escapeXml(greekLetters[command])}</mi>`;
      }
      if (command in mathSymbols) {
        return `<mo>${escapeXml(mathSymbols[command])}</mo>`;
      }
      return `<mi>${escapeXml(command)}</mi>`;
    }
    index += 1;
    if (/\s/.test(character)) return '<mspace width="0.25em"/>';
    if (/[0-9]/.test(character)) return `<mn>${escapeXml(character)}</mn>`;
    if (/[a-zA-Z]/.test(character)) return `<mi>${escapeXml(character)}</mi>`;
    return `<mo>${escapeXml(character)}</mo>`;
  };
  const readSequence = (stopAtBrace = false): string => {
    const parts: string[] = [];
    while (index < latex.length && !(stopAtBrace && latex[index] === "}")) {
      let base = readAtom();
      let superscript = "";
      let subscript = "";
      while (latex[index] === "^" || latex[index] === "_") {
        const operation = latex[index++];
        const value = readGroup();
        if (operation === "^") superscript = value;
        else subscript = value;
      }
      if (superscript && subscript) {
        base = `<msubsup>${base}${subscript}${superscript}</msubsup>`;
      } else if (superscript) {
        base = `<msup>${base}${superscript}</msup>`;
      } else if (subscript) {
        base = `<msub>${base}${subscript}</msub>`;
      }
      parts.push(base);
    }
    return `<mrow>${parts.join("") || "<mi>□</mi>"}</mrow>`;
  };

  return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">${readSequence()}</math>`;
};

const insertTemplates = [
  { label: "a/b", title: "Pecahan", value: "\\frac{}{}", cursorBack: 3 },
  { label: "√", title: "Akar kuadrat", value: "\\sqrt{}", cursorBack: 1 },
  { label: "ⁿ√", title: "Akar pangkat n", value: "\\sqrt[]{}", cursorBack: 1 },
  { label: "xⁿ", title: "Pangkat", value: "^{}", cursorBack: 1 },
  { label: "xₙ", title: "Subskrip", value: "_{}", cursorBack: 1 },
  { label: "∑", title: "Sigma", value: "\\sum_{}^{} ", cursorBack: 4 },
  { label: "∫", title: "Integral", value: "\\int_{}^{} ", cursorBack: 4 },
  { label: "π", title: "Pi", value: "\\pi " , cursorBack: 0 },
  { label: "θ", title: "Theta", value: "\\theta ", cursorBack: 0 },
  { label: "≤", title: "Kurang dari atau sama dengan", value: "\\le ", cursorBack: 0 },
  { label: "≥", title: "Lebih dari atau sama dengan", value: "\\ge ", cursorBack: 0 },
  { label: "×", title: "Perkalian", value: "\\times ", cursorBack: 0 },
  { label: "÷", title: "Pembagian", value: "\\div ", cursorBack: 0 },
];

type MathFormulaEditorProps = {
  onClose: () => void;
  onInsert: (mathML: string) => void;
};

export default function MathFormulaEditor({
  onClose,
  onInsert,
}: MathFormulaEditorProps) {
  const [latex, setLatex] = useState("");
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const insertTemplate = (template: (typeof insertTemplates)[number]) => {
    const start = inputRef.current?.selectionStart ?? selection.start;
    const end = inputRef.current?.selectionEnd ?? selection.end;
    const next =
      latex.slice(0, start) + template.value + latex.slice(end);
    setLatex(next);
    const cursor = start + template.value.length - template.cursorBack;
    setSelection({ start: cursor, end: cursor });
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(cursor, cursor);
    });
  };

  const mathML = latexToMathML(latex);

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{ background: "rgba(0,0,0,0.55)", zIndex: 1080 }}
    >
      <section
        aria-labelledby="math-editor-title"
        aria-modal="true"
        className="card shadow-lg w-100"
        role="dialog"
        style={{ maxWidth: 760, maxHeight: "90vh", overflowY: "auto" }}
      >
        <header className="card-header d-flex justify-content-between align-items-center">
          <div>
            <h2 className="h5 mb-1" id="math-editor-title">
              Editor Rumus Matematika
            </h2>
            <div className="small text-muted">
              Ketik LaTeX atau gunakan tombol rumus, lalu sisipkan ke soal.
            </div>
          </div>
          <button
            aria-label="Tutup editor matematika"
            className="btn-close"
            onClick={onClose}
            type="button"
          />
        </header>
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2 mb-3" aria-label="Toolbar matematika">
            {insertTemplates.map((template) => (
              <button
                className="btn btn-sm btn-outline-secondary"
                key={template.title}
                onClick={() => insertTemplate(template)}
                title={template.title}
                type="button"
              >
                {template.label}
              </button>
            ))}
          </div>
          <label className="form-label fw-semibold" htmlFor="math-latex-input">
            Rumus (LaTeX)
          </label>
          <textarea
            className="form-control font-monospace"
            id="math-latex-input"
            ref={inputRef}
            onChange={(event) => {
              setLatex(event.target.value);
              setSelection({
                start: event.currentTarget.selectionStart,
                end: event.currentTarget.selectionEnd,
              });
            }}
            onSelect={(event) =>
              setSelection({
                start: event.currentTarget.selectionStart,
                end: event.currentTarget.selectionEnd,
              })
            }
            placeholder="Contoh: x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"
            rows={4}
            value={latex}
          />
          <div className="form-text mb-3">
            Gunakan kurung kurawal untuk mengelompokkan rumus. Mendukung
            pecahan, akar, pangkat, indeks, simbol, dan huruf Yunani.
          </div>
          <div className="border rounded bg-light p-3">
            <div className="small text-muted mb-2">Pratinjau</div>
            <div
              className="fs-4 overflow-auto"
              dangerouslySetInnerHTML={{ __html: mathML }}
            />
          </div>
        </div>
        <footer className="card-footer d-flex justify-content-end gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={onClose}
            type="button"
          >
            Batal
          </button>
          <button
            className="btn btn-primary"
            disabled={!latex.trim()}
            onClick={() => {
              onInsert(mathML);
              onClose();
            }}
            type="button"
          >
            <i className="fas fa-square-root-variable me-2" />
            Sisipkan Rumus
          </button>
        </footer>
      </section>
    </div>
  );
}
