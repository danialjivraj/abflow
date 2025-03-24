if (typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

if (typeof window.IntersectionObserver !== "function") {
  window.IntersectionObserver = class {
    constructor(callback, options) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TiptapEditor from "../../src/components/TiptapEditor";

describe("TiptapEditor Component", () => {
  test("renders toolbar, editor content, and character count", async () => {
    const initialContent = "<p>Hello world</p>";
    const handleChange = jest.fn();
    render(<TiptapEditor value={initialContent} onChange={handleChange} />);
    await waitFor(() => {
      expect(document.querySelector(".ProseMirror")).toBeInTheDocument();
    });
    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(screen.getByTitle("Bold")).toBeInTheDocument();
    expect(screen.getByText(/Characters:/)).toBeInTheDocument();
  });

  test("calls onChange when content updates", async () => {
    const initialContent = "<p>Initial content</p>";
    const handleChange = jest.fn();
    render(<TiptapEditor value={initialContent} onChange={handleChange} />);
    await waitFor(() => {
      expect(document.querySelector(".ProseMirror")).toBeInTheDocument();
    });

    const prosemirror = document.querySelector(".ProseMirror");
    expect(prosemirror).toBeInTheDocument();
    prosemirror.innerHTML = "<p>Updated content</p>";
    fireEvent.input(prosemirror);

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled();
    });
  });
});

describe("TiptapEditor Component - Additional Tests", () => {
  test("renders all toolbar buttons", async () => {
    const handleChange = jest.fn();
    render(<TiptapEditor value="<p>Hello</p>" onChange={handleChange} />);
    await waitFor(() => {
      expect(document.querySelector(".ProseMirror")).toBeInTheDocument();
    });
    expect(screen.getByTitle("Bold")).toBeInTheDocument();
    expect(screen.getByTitle("Italic")).toBeInTheDocument();
    expect(screen.getByTitle("Underline")).toBeInTheDocument();
    expect(screen.getByTitle("Strikethrough")).toBeInTheDocument();
    expect(screen.getByTitle("Bullet List")).toBeInTheDocument();
    expect(screen.getByTitle("Numbered List")).toBeInTheDocument();
    expect(screen.getByTitle("Task List")).toBeInTheDocument();
    expect(screen.getByTitle("Heading 1")).toBeInTheDocument();
    expect(screen.getByTitle("Heading 2")).toBeInTheDocument();
    expect(screen.getByTitle("Heading 3")).toBeInTheDocument();
    expect(screen.getByTitle("Highlight")).toBeInTheDocument();
    expect(screen.getByTitle("Toggle Text Colour")).toBeInTheDocument();
  });

  test("emoji picker toggles on clicking emoji button and hides when clicking outside", async () => {
    const handleChange = jest.fn();
    render(<TiptapEditor value="<p>Hello</p>" onChange={handleChange} />);
    await waitFor(() =>
      expect(document.querySelector(".ProseMirror")).toBeInTheDocument()
    );

    const emojiButton = screen.getByTitle("Insert Emoji");
    fireEvent.click(emojiButton);

    await waitFor(() => {
      expect(document.querySelector(".emoji-picker-popup")).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(document.querySelector(".emoji-picker-popup")).toBeNull();
    });
  });

  test("undo and redo buttons are rendered and clickable", async () => {
    const handleChange = jest.fn();
    render(<TiptapEditor value="<p>Hello</p>" onChange={handleChange} />);
    await waitFor(() =>
      expect(document.querySelector(".ProseMirror")).toBeInTheDocument()
    );

    const undoBtn = screen.getByTitle("Undo");
    const redoBtn = screen.getByTitle("Redo");
    expect(undoBtn).toBeInTheDocument();
    expect(redoBtn).toBeInTheDocument();
    fireEvent.click(undoBtn);
    fireEvent.click(redoBtn);

    expect(handleChange).not.toHaveBeenCalled();
  });
});

describe("TiptapEditor Component - Element Presence Tests", () => {
  test("renders the container elements and the text color input", async () => {
    const handleChange = jest.fn();
    render(<TiptapEditor value="<p>Hello</p>" onChange={handleChange} />);

    await waitFor(() => {
      expect(document.querySelector(".tiptap-container")).toBeInTheDocument();
      expect(document.querySelector(".ProseMirror")).toBeInTheDocument();
    });

    expect(document.querySelector(".tiptap-toolbar")).toBeInTheDocument();
    const colorInput = screen.getByTitle("Text Color");
    expect(colorInput).toBeInTheDocument();
    expect(colorInput.type).toBe("color");
    expect(screen.getByTitle("Undo")).toBeInTheDocument();
    expect(screen.getByTitle("Redo")).toBeInTheDocument();
    expect(screen.getByTitle("Insert Emoji")).toBeInTheDocument();
  });

  test("renders table-related buttons when a table is present", async () => {
    const initialContent = `
        <table>
          <thead>
            <tr><th>Header</th></tr>
          </thead>
          <tbody>
            <tr><td>Data</td></tr>
          </tbody>
        </table>`;
    const handleChange = jest.fn();
    render(<TiptapEditor value={initialContent} onChange={handleChange} />);

    await waitFor(() => {
      expect(document.querySelector(".ProseMirror")).toBeInTheDocument();
    });

    expect(screen.getByTitle("Delete Table")).toBeInTheDocument();
    expect(screen.getByTitle("Add Column Before")).toBeInTheDocument();
    expect(screen.getByTitle("Add Column After")).toBeInTheDocument();
    expect(screen.getByTitle("Delete Column")).toBeInTheDocument();
    expect(screen.getByTitle("Add Row Before")).toBeInTheDocument();
    expect(screen.getByTitle("Add Row After")).toBeInTheDocument();
    expect(screen.getByTitle("Delete Row")).toBeInTheDocument();
  });
});
