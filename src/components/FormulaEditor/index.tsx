import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import "./styles.css";

interface Suggestion {
  id: string;
  name: string;
  category: string;
  value: string | number;
}

const FormulaEditor = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [originalNames, setOriginalNames] = useState<Record<string, string>>({});

  const { data: suggestions = [] } = useQuery({
    queryKey: ["autocomplete"],
    queryFn: async () => {
      const { data } = await axios.get<Suggestion[]>("https://652f91320b8d8ddac0b2b62b.mockapi.io/autocomplete");

      return data;
    },
  });

  const filteredSuggestions = suggestions.filter((item) => item.category.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleInput = () => {
    if (!editorRef.current) {
      return;
    }

    const sel = window.getSelection();
    const beforeCursor = sel?.anchorNode?.textContent?.substring(0, sel.anchorOffset) || "";
    const matches = beforeCursor.match(/(\w+)$/);

    if (matches && matches[1].length > 0) {
      setSearchTerm(matches[1]);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const insertTag = (tag: Suggestion) => {
    const sel = window.getSelection();

    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      const startOffset = sel.anchorOffset;
      const nodeText = sel.anchorNode?.textContent || "";
      const beforeText = nodeText.substring(0, startOffset);
      const match = beforeText.match(/(\w+)$/);

      if (match) {
        const wordStart = startOffset - match[1].length;

        range.setStart(sel.anchorNode!, wordStart);
        range.setEnd(sel.anchorNode!, startOffset);
        range.deleteContents();
      }

      const wrapper = document.createElement("span");
      wrapper.contentEditable = "false";
      wrapper.className = "formula-tag-wrapper";
      wrapper.dataset.id = tag.id;

      const categoryElem = document.createElement("span");
      categoryElem.className = "formula-category";
      categoryElem.textContent = tag.category;

      const nameElem = document.createElement("span");
      nameElem.className = "formula-name";
      nameElem.textContent = tag.name;

      nameElem.onclick = (e) => {
        e.stopPropagation();
        const tagElement = e.currentTarget as HTMLElement;
        const containerRect = editorRef.current!.getBoundingClientRect();
        const tagRect = tagElement.getBoundingClientRect();

        setActiveDropdown(tag.id);
        setCursorPos({
          x: tagRect.right - containerRect.left + 5,
          y: tagRect.top - containerRect.top,
        });
      };

      wrapper.append(categoryElem, nameElem);
      range.insertNode(wrapper);

      setOriginalNames((prev) => ({ ...prev, [tag.id]: tag.name }));

      const space = document.createTextNode("\u00A0");
      wrapper.after(space);

      range.setStartAfter(space);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

      setShowDropdown(false);
      setSearchTerm("");
      editorRef.current?.focus();
    }
  };

  const closeDropdowns = () => setActiveDropdown(null);

  useEffect(() => {
    document.addEventListener("click", closeDropdowns);

    return () => {
      document.removeEventListener("click", closeDropdowns);
    };
  }, []);

  const handleCalculate = () => {
    if (!editorRef.current) {
      return;
    }

    const valuesMap: Record<string, number> = suggestions.reduce((acc, curr) => {
      const numericValue = Number(curr.value);
      acc[curr.id] = isNaN(numericValue) ? 0 : numericValue;
      return acc;
    }, {} as Record<string, number>);

    let expression = "";

    editorRef.current.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        expression += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagId = (node as HTMLElement).dataset.id;
        if (tagId && valuesMap[tagId] !== undefined) {
          expression += valuesMap[tagId];
        } else {
          expression += "0";
        }
      }
    });

    try {
      const result = eval(expression);
      alert(`Calculation result: ${result}`);
    } catch {
      alert("Error in the formula");
    }
  };

  const replaceNameInTag = (tagId: string, newName: string) => {
    if (!editorRef.current) {
      return;
    }

    const tagElements = editorRef.current.querySelectorAll(".formula-tag-wrapper");

    tagElements.forEach((tagElement) => {
      if (tagElement instanceof HTMLElement && tagElement.dataset.id === tagId) {
        const nameElement = tagElement.querySelector(".formula-name");

        if (nameElement) {
          nameElement.textContent = newName;
        }
      }
    });
  };

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 500 }}>
      <div ref={editorRef} className="formula-editor" contentEditable onInput={handleInput} onKeyUp={() => handleInput()} />

      {showDropdown && filteredSuggestions.length > 0 && (
        <ul className="suggestion-menu" style={{ top: cursorPos.y + window.scrollY, left: cursorPos.x + window.scrollX }}>
          {filteredSuggestions.map((item) => (
            <li
              key={item.id}
              onMouseDown={(e) => {
                e.preventDefault();
                insertTag(item);
              }}
            >
              {item.category}
            </li>
          ))}
        </ul>
      )}

      {activeDropdown && (
        <ul
          className="action-menu"
          style={{
            top: cursorPos.y,
            left: cursorPos.x,
          }}
        >
          <li
            className="action-menu-item"
            onClick={() => {
              replaceNameInTag(activeDropdown, "Action 1");
              closeDropdowns();
            }}
          >
            Action 1
          </li>
          <li
            className="action-menu-item"
            onClick={() => {
              replaceNameInTag(activeDropdown, "Action 2");
              closeDropdowns();
            }}
          >
            Action 2
          </li>

          {originalNames[activeDropdown] && (
            <li
              className="action-menu-item original-name"
              onClick={() => {
                replaceNameInTag(activeDropdown, originalNames[activeDropdown]);
                closeDropdowns();
              }}
            >
              {originalNames[activeDropdown]}
            </li>
          )}
        </ul>
      )}

      <button onClick={handleCalculate} style={{ marginTop: 10 }}>
        Calculating values
      </button>
    </div>
  );
};

export default FormulaEditor;
