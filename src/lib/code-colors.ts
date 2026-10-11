import { tags as t, type Tag } from "@lezer/highlight";

/**
 * Syntax colours (brand Catppuccin), shared by the live editor and the
 * server-rendered code samples so both look the same.
 */
export const codeColors: { tag: Tag | Tag[]; color: string; italic?: boolean }[] = [
  { tag: [t.tagName, t.angleBracket], color: "#f38ba8" },
  { tag: t.attributeName, color: "#f9e2af" },
  { tag: [t.attributeValue, t.string], color: "#a6e3a1" },
  { tag: [t.propertyName, t.definition(t.propertyName)], color: "#94e2d5" },
  { tag: [t.number, t.unit, t.color, t.atom, t.keyword], color: "#fab387" },
  { tag: [t.className, t.labelName, t.constant(t.className)], color: "#cba6f7" },
  { tag: t.comment, color: "#7f849c", italic: true },
  { tag: [t.punctuation, t.separator, t.bracket], color: "#9399b2" },
  { tag: [t.operator, t.derefOperator], color: "#89dceb" },
  { tag: t.variableName, color: "#89b4fa" },
];
