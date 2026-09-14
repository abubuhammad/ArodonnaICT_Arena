import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

interface MenuBarProps {
  editor: any;
}

const MenuBar: React.FC<MenuBarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 p-2 flex flex-wrap gap-2 bg-white">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
        title="Bold"
      >
        <i className="fas fa-bold"></i>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
        title="Italic"
      >
        <i className="fas fa-italic"></i>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 rounded ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
        title="Underline"
      >
        <i className="fas fa-underline"></i>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
        title="Heading 1"
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
        title="Heading 2"
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
        title="Bullet List"
      >
        <i className="fas fa-list-ul"></i>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
        title="Numbered List"
      >
        <i className="fas fa-list-ol"></i>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-2 rounded ${editor.isActive('codeBlock') ? 'bg-gray-200' : ''}`}
        title="Code Block"
      >
        <i className="fas fa-code"></i>
      </button>
      <button
        onClick={() => {
          const url = window.prompt('Enter URL');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={`p-2 rounded ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
        title="Add Link"
      >
        <i className="fas fa-link"></i>
      </button>
      <button
        onClick={() => {
          const url = window.prompt('Enter image URL');
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }}
        className="p-2 rounded"
        title="Add Image"
      >
        <i className="fas fa-image"></i>
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-2 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
        title="Align Left"
      >
        <i className="fas fa-align-left"></i>
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-2 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
        title="Align Center"
      >
        <i className="fas fa-align-center"></i>
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-2 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
        title="Align Right"
      >
        <i className="fas fa-align-right"></i>
      </button>
      <select
        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        className="p-2 rounded border border-gray-300"
      >
        <option value="">Text Color</option>
        <option value="#000000">Black</option>
        <option value="#FF0000">Red</option>
        <option value="#00FF00">Green</option>
        <option value="#0000FF">Blue</option>
      </select>
    </div>
  );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      Image,
      Placeholder.configure({
        placeholder: placeholder || 'Start writing your content...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <MenuBar editor={editor} />
      <div className="p-4 min-h-[300px] bg-white">
        <EditorContent 
          editor={editor} 
          className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[250px]"
        />
      </div>
    </div>
  );
};

export default RichTextEditor; 