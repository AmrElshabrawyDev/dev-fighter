"use client";

import { indentWithTab } from "@codemirror/commands";
import { html } from "@codemirror/lang-html";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { basicSetup } from "codemirror";
import { useEffect, useRef } from "react";

/** Brand colours (Catppuccin) for the editor chrome */
const theme = EditorView.theme(
  {
    "&": { height: "100%", color: "#cdd6f4", backgroundColor: "#181825", fontSize: "14px" },
    ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.7" },
    ".cm-content": { caretColor: "#89b4fa", padding: "12px 0" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#89b4fa", borderLeftWidth: "2px" },
    "&.cm-focused": { outline: "none" },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, ::selection": {
      backgroundColor: "#89b4fa40",
    },
    ".cm-gutters": { backgroundColor: "#181825", color: "#585b70", border: "none" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: "#a6adc8" },
    ".cm-activeLine": { backgroundColor: "#ffffff08" },
    ".cm-matchingBracket, &.cm-focused .cm-matchingBracket": { backgroundColor: "#94e2d530", outline: "none" },
    ".cm-tooltip": { backgroundColor: "#1b1b29", border: "1px solid #45475a", color: "#cdd6f4" },
    ".cm-tooltip-autocomplete > ul > li[aria-selected]": { backgroundColor: "#89b4fa", color: "#11111b" },
    ".cm-foldPlaceholder": { backgroundColor: "#232336", border: "none", color: "#a6adc8" },
  },
  { dark: true },
);

const highlight = HighlightStyle.define([
  { tag: [t.tagName, t.angleBracket], color: "#f38ba8" },
  { tag: t.attributeName, color: "#f9e2af" },
  { tag: [t.attributeValue, t.string], color: "#a6e3a1" },
  { tag: [t.propertyName, t.definition(t.propertyName)], color: "#94e2d5" },
  { tag: [t.number, t.unit, t.color, t.atom, t.keyword], color: "#fab387" },
  { tag: [t.className, t.labelName, t.constant(t.className)], color: "#cba6f7" },
  { tag: [t.comment], color: "#7f849c", fontStyle: "italic" },
  { tag: [t.punctuation, t.separator, t.bracket], color: "#9399b2" },
  { tag: [t.operator, t.derefOperator], color: "#89dceb" },
  { tag: t.variableName, color: "#89b4fa" },
]);

type Props = {
  value: string;
  onChange: (code: string) => void;
  label: string;
};

export function CodeEditor({ value, onChange, label }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const emitted = useRef(value); // the last code the editor reported

  useEffect(() => {
    onChangeRef.current = onChange;
    valueRef.current = value;
  });

  useEffect(() => {
    const editor = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: valueRef.current,
        extensions: [
          basicSetup,
          keymap.of([indentWithTab]), // Esc then Tab still moves focus out
          html(),
          EditorView.lineWrapping, // long one-line solutions wrap instead of scrolling sideways
          theme,
          syntaxHighlighting(highlight),
          EditorView.contentAttributes.of({ "aria-label": label }),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            emitted.current = update.state.doc.toString();
            onChangeRef.current(emitted.current);
          }),
        ],
      }),
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
  }, [label]);

  // a change from outside (a restored draft, "start over") replaces the document;
  // values the editor itself reported are skipped, so typing is never overwritten
  useEffect(() => {
    const editor = view.current;
    if (editor && value !== emitted.current && editor.state.doc.toString() !== value) {
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
    }
  }, [value]);

  return <div ref={host} dir="ltr" className="h-full min-h-0 overflow-hidden" />;
}
