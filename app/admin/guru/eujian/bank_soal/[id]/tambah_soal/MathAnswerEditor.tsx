"use client";

import { useEffect, useRef, useState } from "react";
import { sanitizeQuestionHtml } from "@/lib/sanitize-question-html";
import MathFormulaEditor from "./MathFormulaEditor";

type MathAnswerEditorProps = {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

export default function MathAnswerEditor({
  placeholder,
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
    <div
      className="d-flex align-items-center gap-2 flex-grow-1"
      style={{ minWidth: 0 }}
    >
      <div
        aria-label={placeholder}
        aria-placeholder={placeholder}
        className="form-control math-answer-editor flex-grow-1"
        contentEditable
        data-placeholder={placeholder}
        onInput={(event) =>
          onChange(sanitizeQuestionHtml(event.currentTarget.innerHTML))
        }
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        ref={editorRef}
        role="textbox"
        style={{ minHeight: 42, minWidth: 0, whiteSpace: "pre-wrap" }}
        suppressContentEditableWarning
      />
      <button
        className="btn btn-sm btn-outline-primary flex-shrink-0"
        onMouseDown={(event) => {
          saveSelection();
          event.preventDefault();
        }}
        onClick={() => setMathEditorOpen(true)}
        title="Sisipkan rumus"
        type="button"
      >
        <i className="fas fa-square-root-variable me-1" />
        Rumus
      </button>
      {mathEditorOpen && (
        <MathFormulaEditor
          onClose={() => setMathEditorOpen(false)}
          onInsert={insertFormula}
        />
      )}
    </div>
  );
}
