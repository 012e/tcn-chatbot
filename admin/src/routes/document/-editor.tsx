"use client";

/* eslint-disable unicorn/no-null */
/* eslint-disable quotes */
import { useCallback, memo } from "react";

import RichTextEditor, { BaseKit } from "reactjs-tiptap-editor";

import { Bold } from "reactjs-tiptap-editor/bold";
import { Clear } from "reactjs-tiptap-editor/clear";
import { Color } from "reactjs-tiptap-editor/color";
import { FontFamily } from "reactjs-tiptap-editor/fontfamily";
import { FontSize } from "reactjs-tiptap-editor/fontsize";
import { FormatPainter } from "reactjs-tiptap-editor/formatpainter";
import { History } from "reactjs-tiptap-editor/history";
import { HorizontalRule } from "reactjs-tiptap-editor/horizontalrule";
import { ImportWord } from "reactjs-tiptap-editor/importword";
import { Italic } from "reactjs-tiptap-editor/italic";
import { Link } from "reactjs-tiptap-editor/link";
import { MoreMark } from "reactjs-tiptap-editor/moremark";
import { Strike } from "reactjs-tiptap-editor/strike";
import { Table } from "reactjs-tiptap-editor/table";
import { TextAlign } from "reactjs-tiptap-editor/textalign";
import { TextUnderline } from "reactjs-tiptap-editor/textunderline";

import "reactjs-tiptap-editor/style.css";

const extensions = [
  BaseKit.configure({
    placeholder: {
      showOnlyCurrent: true,
    },
    characterCount: {
      limit: 50_000,
    },
  }),
  History,
  // SearchAndReplace,
  // TableOfContents,
  FormatPainter.configure({ spacer: true }),
  Clear,
  FontFamily,
  FontSize,
  Bold,
  Italic,
  TextUnderline,
  Strike,
  MoreMark,
  Color.configure({ spacer: true }),
  TextAlign.configure({ types: ["heading", "paragraph"], spacer: true }),
  Link,
  HorizontalRule,
  Table,
  ImportWord.configure({
    upload: (files: File[]) => {
      const f = files.map((file) => ({
        src: URL.createObjectURL(file),
        alt: file.name,
      }));
      return Promise.resolve(f);
    },
  }),
];

function debounce(func: any, wait: number) {
  let timeout: NodeJS.Timeout;
  return function (...args: any[]) {
    clearTimeout(timeout);
    // @ts-ignore
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function Editor({
  content,
  setContent,
  theme = "light",
}: {
  content: string | undefined;
  setContent: (value: string) => void;
  theme?: "light" | "dark";
}) {
  const onValueChange = useCallback(
    debounce((value: any) => {
      setContent(value);
    }, 1000),
    [],
  );

  return (
    <main
      style={{
        padding: "0 20px",
      }}
    >
      <div
        style={{
          maxWidth: 1024,
          margin: "88px auto 120px",
        }}
      >
        <RichTextEditor
          output="html"
          content={content as any}
          onChangeContent={onValueChange}
          extensions={extensions}
          dark={theme === "dark"}
        />
      </div>
    </main>
  );
}

export default memo(Editor);
