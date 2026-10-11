"use client";

import { useEffect, useRef, useState } from "react";
import { sanitizeQuestionHtml } from "@/lib/sanitize-question-html";
import MathFormulaEditor from "./MathFormulaEditor";

type MathAnswerEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export default function MathAnswerEditor({
  label,
  value,
  onChange,
}: MathAnswerEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [mathEditorOpen, setMathEditorOpen] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    const cleanValue = sanitizeQuestionHtml(value);
    if (editor && editor.innerHTML !== cleanValue) {
      editor.innerHTML = cleanValue;
    }
  }, [value]);

  const saveSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  };

  const insertFormula = (mathML: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    const selection = window.getSelection();
    let range = savedRangeRef.current;
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    range.deleteContents();
    const fragment = range.createContextualFragment(
      `<span class="math-formula">${mathML}</span>`,
    );
    const lastInsertedNode = fragment.lastChild;
    range.insertNode(fragment);
    if (lastInsertedNode) {
      range.setStartAfter(lastInsertedNode);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
      savedRangeRef.current = range.cloneRange();
    }

    onChange(sanitizeQuestionHtml(editor.innerHTML));
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
        <label className="form-label fw-semibold mb-0">{label}</label>
        <button
          className="btn btn-sm btn-outline-primary"
          onMouseDown={(event) => {
            saveSelection();
            event.preventDefault();
          }}
          onClick={() => setMathEditorOpen(true)}
          type="button"
        >
          <i className="fas fa-square-root-variable me-1" />
          Rumus
        </button>
      </div>
      <div
        aria-label={label}
        className="form-control"
        contentEditable
        onInput={(event) =>
          onChange(sanitizeQuestionHtml(event.currentTarget.innerHTML))
        }
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        ref={editorRef}
        role="textbox"
        style={{ minHeight: 42, whiteSpace: "pre-wrap" }}
        suppressContentEditableWarning
      />
      {mathEditorOpen && (
        <MathFormulaEditor
          onClose={() => setMathEditorOpen(false)}
          onInsert={insertFormula}
        />
      )}
    </div>
  );
}
