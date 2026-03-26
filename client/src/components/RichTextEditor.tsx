import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mathematics from '@tiptap/extension-mathematics';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import { useEffect, useState, useRef } from 'react';
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Table as TableIcon,
  Undo, Redo, Sigma, Check, X, ExternalLink,
} from 'lucide-react';

interface RichTextEditorProps {
  content: Record<string, unknown> | null;
  onChange?: (content: Record<string, unknown>) => void;
  editable?: boolean;
  className?: string;
}

interface MathEditState {
  pos?: number;       // undefined = inserting new, number = editing existing
  latex: string;
}

function ToolbarButton({ onClick, active, disabled, title, children }: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
        active
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-border mx-1" />;
}

function MathPanel({ state, onConfirm, onCancel }: {
  state: MathEditState;
  onConfirm: (latex: string) => void;
  onCancel: () => void;
}) {
  const [latex, setLatex] = useState(state.latex);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    if (!latex.trim()) {
      setPreview('');
      setError('');
      return;
    }
    try {
      setPreview(katex.renderToString(latex, { throwOnError: true, displayMode: false }));
      setError('');
    } catch (e: any) {
      setPreview('');
      setError(e.message?.split('\n')[0] ?? 'Invalid LaTeX');
    }
  }, [latex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); if (latex.trim()) onConfirm(latex.trim()); }
    if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
  }

  return (
    <div className="border-b border-border bg-surface-raised px-3 py-2 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <a
          href="https://katex.org/docs/supported.html"
          target="_blank"
          rel="noopener noreferrer"
          title="KaTeX supported functions — LaTeX reference"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0"
        >
          LaTeX <ExternalLink size={11} />
        </a>
        <input
          ref={inputRef}
          value={latex}
          onChange={e => setLatex(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. \frac{a}{b} or x^2 + y^2"
          className="flex-1 text-sm bg-surface border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:border-primary/50"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => { if (latex.trim()) onConfirm(latex.trim()); }}
          disabled={!latex.trim()}
          title="Confirm"
          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check size={16} />
        </button>
        <button
          type="button"
          onClick={onCancel}
          title="Cancel"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {preview && (
        <div
          className="text-sm px-1"
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      )}
    </div>
  );
}

function Toolbar({ editor, onMathInsert }: {
  editor: ReturnType<typeof useEditor>;
  onMathInsert: () => void;
}) {
  if (!editor) return null;

  const iconSize = 16;

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-surface">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 size={iconSize} />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold"
      >
        <Bold size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic"
      >
        <Italic size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        title="Inline Code"
      >
        <Code size={iconSize} />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Ordered List"
      >
        <ListOrdered size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="Blockquote"
      >
        <Quote size={iconSize} />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Insert Table"
      >
        <TableIcon size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={onMathInsert}
        title="Insert Math (LaTeX)"
      >
        <Sigma size={iconSize} />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo size={iconSize} />
      </ToolbarButton>
    </div>
  );
}

export default function RichTextEditor({ content, onChange, editable = true, className }: RichTextEditorProps) {
  const [mathEdit, setMathEdit] = useState<MathEditState | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Mathematics.configure({
        inlineOptions: {
          onClick: (node: any, pos: number) => {
            setMathEdit({ pos, latex: node.attrs.latex });
          },
        },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: content ?? undefined,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON() as Record<string, unknown>);
    },
    editorProps: {
      attributes: {
        class: 'rich-text text-sm text-foreground focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
  });

  // Sync editable state when it changes (view ↔ edit toggle)
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
      if (!editable) setMathEdit(null);
    }
  }, [editor, editable]);

  // Reload content when cancelled (savedContent resets externally)
  useEffect(() => {
    if (!editor || editable) return;
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(content);
    if (current !== incoming) {
      editor.commands.setContent(content ?? '');
    }
  }, [editor, content, editable]);

  function handleMathConfirm(latex: string) {
    if (!editor) return;
    if (mathEdit?.pos !== undefined) {
      editor.commands.updateInlineMath({ latex, pos: mathEdit.pos });
    } else {
      editor.commands.insertInlineMath({ latex });
    }
    setMathEdit(null);
    editor.commands.focus();
  }

  function handleMathCancel() {
    setMathEdit(null);
    editor?.commands.focus();
  }

  if (!editable) {
    return (
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <EditorContent editor={editor} />
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-surface overflow-hidden shadow-warm-sm focus-within:border-primary/50 transition-colors flex flex-col${className ? ` ${className}` : ''}`}>
      <Toolbar editor={editor} onMathInsert={() => setMathEdit({ latex: '' })} />
      {mathEdit !== null && (
        <MathPanel
          state={mathEdit}
          onConfirm={handleMathConfirm}
          onCancel={handleMathCancel}
        />
      )}
      <div className="overflow-y-auto flex-1 min-h-0">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
