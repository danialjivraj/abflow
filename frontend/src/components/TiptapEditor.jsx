import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Underline } from "@tiptap/extension-underline";
import { Highlight } from "@tiptap/extension-highlight";
import { CharacterCount } from "@tiptap/extension-character-count";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import TextAlign from "@tiptap/extension-text-align";
import { useState, useRef, useEffect } from "react";
import {
  FaBold,
  FaItalic,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaUndo,
  FaRedo,
  FaHeading,
  FaCode,
  FaMinus,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaPalette,
  FaTable,
  FaTasks,
  FaHighlighter,
  FaPlus,
  FaTrash,
  FaSmile,
  FaUnderline,
} from "react-icons/fa";

const Toolbar = ({ editor }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0,
  });
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleEmojiPicker = (event) => {
    const { clientX, clientY } = event;
    setEmojiPickerPosition({ top: clientY, left: clientX });
    setShowEmojiPicker(!showEmojiPicker);
  };

  const addEmojiToEditor = (emoji) => {
    if (editor) {
      editor.chain().focus().insertContent(emoji.native).run();
      setShowEmojiPicker(false);
    }
  };

  if (!editor) return null;

  const toggleTextColor = () => {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || "light";
    const newColor = currentTheme === "light" ? "#000000" : "#ffffff";
    editor.chain().focus().setColor(newColor).run();
  };

  const doesDocumentHaveTables = () => {
    let hasTables = false;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "table") {
        hasTables = true;
        return false;
      }
    });
    return hasTables;
  };

  const hasTables = doesDocumentHaveTables();

  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";
  const defaultColor = currentTheme === "light" ? "#333333" : "#ffffff";

  return (
    <div className="tiptap-toolbar">
      {/* Text Formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "is-active" : ""}
        title="Bold"
      >
        <FaBold />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "is-active" : ""}
        title="Italic"
      >
        <FaItalic />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={editor.isActive("underline") ? "is-active" : ""}
        title="Underline"
      >
        <FaUnderline />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive("strike") ? "is-active" : ""}
        title="Strikethrough"
      >
        <FaStrikethrough />
      </button>

      {/* Separator */}
      <div className="toolbar-separator"></div>

      {/* Headings */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive("heading", { level: 1 }) ? "is-active" : ""}
        title="Heading 1"
      >
        <FaHeading /> 1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
        title="Heading 2"
      >
        <FaHeading /> 2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""}
        title="Heading 3"
      >
        <FaHeading /> 3
      </button>

      {/* Separator */}
      <div className="toolbar-separator"></div>

      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive("bulletList") ? "is-active" : ""}
        title="Bullet List"
      >
        <FaListUl />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive("orderedList") ? "is-active" : ""}
        title="Numbered List"
      >
        <FaListOl />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={editor.isActive("taskList") ? "is-active" : ""}
        title="Task List"
      >
        <FaTasks />
      </button>

      {/* Separator */}
      <div className="toolbar-separator"></div>

      {/* Blockquote */}
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive("blockquote") ? "is-active" : ""}
        title="Blockquote"
      >
        <FaQuoteLeft />
      </button>

      {/* Code Block */}
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive("codeBlock") ? "is-active" : ""}
        title="Code Block"
      >
        <FaCode />
      </button>

      {/* Horizontal Rule */}
      <button
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <FaMinus />
      </button>

      {/* Separator */}
      <div className="toolbar-separator"></div>

      {/* Text Alignment */}
      <button
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={editor.isActive({ textAlign: "left" }) ? "is-active" : ""}
        title="Align Left"
      >
        <FaAlignLeft />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={editor.isActive({ textAlign: "center" }) ? "is-active" : ""}
        title="Align Center"
      >
        <FaAlignCenter />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={editor.isActive({ textAlign: "right" }) ? "is-active" : ""}
        title="Align Right"
      >
        <FaAlignRight />
      </button>

      {/* Separator */}
      <div className="toolbar-separator"></div>

      <button onClick={toggleEmojiPicker} title="Insert Emoji">
        <FaSmile />
      </button>

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div
          className="emoji-picker-popup"
          style={{
            top: emojiPickerPosition.top,
            left: emojiPickerPosition.left,
          }}
          ref={emojiPickerRef}
        >
          <Picker data={data} onEmojiSelect={addEmojiToEditor} />
        </div>
      )}

      {/* Separator */}
      <div className="toolbar-separator"></div>

      {/* Highlight */}
      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={editor.isActive("highlight") ? "is-active" : ""}
        title="Highlight"
      >
        <FaHighlighter />
      </button>

      {/* Text Color */}
      <button onClick={toggleTextColor} title="Toggle Text Colour">
        <FaPalette />
      </button>
      <input
        type="color"
        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        value={editor.getAttributes("textStyle").color || defaultColor}
        title="Text Color"
      />

      {/* Separator */}
      <div className="toolbar-separator"></div>

      {/* Undo/Redo */}
      <button onClick={() => editor.chain().focus().undo().run()} title="Undo">
        <FaUndo />
      </button>
      <button onClick={() => editor.chain().focus().redo().run()} title="Redo">
        <FaRedo />
      </button>

      {/* Separator */}
      <div className="toolbar-separator"></div>

      {/* Tables */}
      <button
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
        title="Insert Table"
      >
        <FaTable />
      </button>

      {/* Table Options */}
      {hasTables && (
        <>
          <button
            onClick={() => editor.chain().focus().deleteTable().run()}
            title="Delete Table"
          >
            <FaTrash /> Table
          </button>
          <button
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            title="Add Column Before"
          >
            <FaPlus /> Col Before
          </button>
          <button
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            title="Add Column After"
          >
            <FaPlus /> Col After
          </button>
          <button
            onClick={() => editor.chain().focus().deleteColumn().run()}
            title="Delete Column"
          >
            <FaTrash /> Col
          </button>
          <button
            onClick={() => editor.chain().focus().addRowBefore().run()}
            title="Add Row Before"
          >
            <FaPlus /> Row Before
          </button>
          <button
            onClick={() => editor.chain().focus().addRowAfter().run()}
            title="Add Row After"
          >
            <FaPlus /> Row After
          </button>
          <button
            onClick={() => editor.chain().focus().deleteRow().run()}
            title="Delete Row"
          >
            <FaTrash /> Row
          </button>
        </>
      )}
    </div>
  );
};

const TiptapEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      CharacterCount.configure({ limit: 10000 }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
        defaultAlignment: "left",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {},
    },
  });

  return (
    <div className="tiptap-container">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <div className="character-count">
        Characters: {editor?.storage.characterCount.characters()}
      </div>
    </div>
  );
};

export default TiptapEditor;
