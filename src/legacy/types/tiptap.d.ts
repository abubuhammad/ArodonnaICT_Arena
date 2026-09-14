declare module '@tiptap/react' {
  import { Editor } from '@tiptap/core';
  import { ReactNode } from 'react';

  export interface EditorContentProps {
    editor: Editor | null;
    className?: string;
  }

  export const EditorContent: React.FC<EditorContentProps>;

  export interface UseEditorProps {
    extensions: any[];
    content?: string;
    onUpdate?: (props: { editor: Editor }) => void;
  }

  export function useEditor(props: UseEditorProps): Editor | null;
}

declare module '@tiptap/starter-kit' {
  import { Extension } from '@tiptap/core';
  const StarterKit: Extension;
  export default StarterKit;
}

declare module '@tiptap/extension-link' {
  import { Extension } from '@tiptap/core';
  const Link: Extension;
  export default Link;
}

declare module '@tiptap/extension-image' {
  import { Extension } from '@tiptap/core';
  const Image: Extension;
  export default Image;
}

declare module '@tiptap/extension-placeholder' {
  import { Extension } from '@tiptap/core';
  const Placeholder: Extension;
  export default Placeholder;
}

declare module '@tiptap/extension-text-align' {
  import { Extension } from '@tiptap/core';
  const TextAlign: Extension;
  export default TextAlign;
}

declare module '@tiptap/extension-underline' {
  import { Extension } from '@tiptap/core';
  const Underline: Extension;
  export default Underline;
}

declare module '@tiptap/extension-text-style' {
  import { Extension } from '@tiptap/core';
  const TextStyle: Extension;
  export default TextStyle;
}

declare module '@tiptap/extension-color' {
  import { Extension } from '@tiptap/core';
  const Color: Extension;
  export default Color;
}

declare module '@tiptap/extension-code-block' {
  import { Extension } from '@tiptap/core';
  const CodeBlock: Extension;
  export default CodeBlock;
}

declare module '@tiptap/extension-table' {
  import { Extension } from '@tiptap/core';
  const Table: Extension;
  export default Table;
}

declare module '@tiptap/extension-table-row' {
  import { Extension } from '@tiptap/core';
  const TableRow: Extension;
  export default TableRow;
}

declare module '@tiptap/extension-table-cell' {
  import { Extension } from '@tiptap/core';
  const TableCell: Extension;
  export default TableCell;
}

declare module '@tiptap/extension-table-header' {
  import { Extension } from '@tiptap/core';
  const TableHeader: Extension;
  export default TableHeader;
}

declare module '@tiptap/core' {
  export interface Editor {
    isActive: (name: string | { textAlign: string }, attrs?: Record<string, any>) => boolean;
    can: (name: string) => boolean;
    chain: () => Editor;
    focus: () => Editor;
    blur: () => Editor;
    toggleBold: () => Editor;
    toggleItalic: () => Editor;
    toggleUnderline: () => Editor;
    toggleHeading: (level: number) => Editor;
    toggleBulletList: () => Editor;
    toggleOrderedList: () => Editor;
    toggleCodeBlock: () => Editor;
    setLink: (attributes: { href: string; target?: string }) => Editor;
    setImage: (attributes: { src: string; alt?: string }) => Editor;
    setTextAlign: (align: 'left' | 'center' | 'right' | 'justify') => Editor;
    setColor: (color: string) => Editor;
    setUnderline: () => Editor;
    insertTable: (options?: { rows?: number; cols?: number; withHeaderRow?: boolean }) => Editor;
    addColumnBefore: () => Editor;
    addColumnAfter: () => Editor;
    deleteColumn: () => Editor;
    addRowBefore: () => Editor;
    addRowAfter: () => Editor;
    deleteRow: () => Editor;
    deleteTable: () => Editor;
    mergeCells: () => Editor;
    splitCell: () => Editor;
  }

  export class Extension {
    configure(options?: Record<string, any>): Extension;
  }

  export class Editor {
    chain(): Editor;
    focus(): Editor;
    run(): void;
    getHTML(): string;
    isActive(name: string, attributes?: Record<string, any>): boolean;
    setContent(content: string): void;
  }
} 