import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { Extension } from '@tiptap/core';
import { 
  Bold, 
  Italic,
  Underline as UnderlineIcon,
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Type,
  Palette,
  Highlighter
} from 'lucide-react';

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize,
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).run();
      },
    };
  },
});

interface TermsAndConditionsSettingsProps {
  content: string;
  onChange: (content: string) => void;
}

const fontSizes = [
  { label: 'Petit', value: '12px' },
  { label: 'Normal', value: '14px' },
  { label: 'Grand', value: '16px' },
  { label: 'Très grand', value: '18px' },
];

const colors = [
  { label: 'Noir', value: '#000000' },
  { label: 'Gris', value: '#666666' },
  { label: 'Rouge', value: '#FF0000' },
  { label: 'Vert', value: '#008000' },
  { label: 'Bleu', value: '#0000FF' },
];

const highlightColors = [
  { label: 'Jaune', value: '#FFEB3B' },
  { label: 'Vert', value: '#C8E6C9' },
  { label: 'Bleu', value: '#BBDEFB' },
  { label: 'Rose', value: '#F8BBD0' },
  { label: 'Orange', value: '#FFE0B2' },
];

export function TermsAndConditionsSettings({ content, onChange }: TermsAndConditionsSettingsProps) {
  const [showFontSizes, setShowFontSizes] = React.useState(false);
  const [showColors, setShowColors] = React.useState(false);
  const [showHighlightColors, setShowHighlightColors] = React.useState(false);
  const fontSizeMenuRef = React.useRef<HTMLDivElement>(null);
  const colorMenuRef = React.useRef<HTMLDivElement>(null);
  const highlightMenuRef = React.useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fontSizeMenuRef.current && !fontSizeMenuRef.current.contains(event.target as Node)) {
        setShowFontSizes(false);
      }
      if (colorMenuRef.current && !colorMenuRef.current.contains(event.target as Node)) {
        setShowColors(false);
      }
      if (highlightMenuRef.current && !highlightMenuRef.current.contains(event.target as Node)) {
        setShowHighlightColors(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const setFontSize = (size: string) => {
    editor.chain().focus().setFontSize(size).run();
    setShowFontSizes(false);
  };

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
    setShowColors(false);
  };

  const setHighlight = (color: string) => {
    editor.chain().focus().setHighlight({ color }).run();
    setShowHighlightColors(false);
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-gray-900">Conditions Générales de Vente</h4>
      
      <div className="border rounded-lg bg-white">
        <div className="flex items-center gap-1 p-2 border-b">
          {/* Formatage de texte basique */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-gray-100 ${
              editor.isActive('bold') ? 'bg-gray-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Gras"
          >
            <Bold size={16} />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-gray-100 ${
              editor.isActive('italic') ? 'bg-gray-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Italique"
          >
            <Italic size={16} />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded hover:bg-gray-100 ${
              editor.isActive('underline') ? 'bg-gray-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Souligné"
          >
            <UnderlineIcon size={16} />
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Taille de texte */}
          <div className="relative" ref={fontSizeMenuRef}>
            <button
              onClick={() => setShowFontSizes(!showFontSizes)}
              className={`p-1.5 rounded hover:bg-gray-100 text-gray-600`}
              title="Taille du texte"
            >
              <Type size={16} />
            </button>

            {showFontSizes && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[120px] z-10">
                {fontSizes.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setFontSize(size.value)}
                    className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100"
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Couleur de texte */}
          <div className="relative" ref={colorMenuRef}>
            <button
              onClick={() => setShowColors(!showColors)}
              className={`p-1.5 rounded hover:bg-gray-100 text-gray-600`}
              title="Couleur du texte"
            >
              <Palette size={16} />
            </button>

            {showColors && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[120px] z-10">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setColor(color.value)}
                    className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-200" 
                      style={{ backgroundColor: color.value }}
                    />
                    {color.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Surlignage */}
          <div className="relative" ref={highlightMenuRef}>
            <button
              onClick={() => setShowHighlightColors(!showHighlightColors)}
              className={`p-1.5 rounded hover:bg-gray-100 ${
                editor.isActive('highlight') ? 'bg-gray-100 text-blue-600' : 'text-gray-600'
              }`}
              title="Surligner"
            >
              <Highlighter size={16} />
            </button>

            {showHighlightColors && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[120px] z-10">
                <button
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setShowHighlightColors(false);
                  }}
                  className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  Aucun surlignage
                </button>
                <div className="my-1 border-t" />
                {highlightColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setHighlight(color.value)}
                    className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <div 
                      className="w-4 h-4 rounded border border-gray-200" 
                      style={{ backgroundColor: color.value }}
                    />
                    {color.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Alignement */}
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1.5 rounded hover:bg-gray-100 ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-gray-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Aligner à gauche"
          >
            <AlignLeft size={16} />
          </button>

          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1.5 rounded hover:bg-gray-100 ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-gray-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Centrer"
          >
            <AlignCenter size={16} />
          </button>

          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1.5 rounded hover:bg-gray-100 ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-gray-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Aligner à droite"
          >
            <AlignRight size={16} />
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Listes */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-gray-100 ${
              editor.isActive('bulletList') ? 'bg-gray-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Liste à puces"
          >
            <List size={16} />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-gray-100 ${
              editor.isActive('orderedList') ? 'bg-gray-100 text-blue-600' : 'text-gray-600'
            }`}
            title="Liste numérotée"
          >
            <ListOrdered size={16} />
          </button>
        </div>

        <EditorContent 
          editor={editor} 
          className="prose max-w-none p-4 min-h-[300px] focus:outline-none"
        />
      </div>
    </div>
  );
}