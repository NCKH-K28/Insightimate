'use client';

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { Button } from "@/components/ui/button";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface RichTextDescriptionProps {
  initialContent?: string;
  onSave?: (html: string) => void;
}

export default function RichTextDescription({ initialContent = "", onSave }: RichTextDescriptionProps) {
  const [content, setContent] = useState(initialContent);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleSave = () => {
    setEditing(false);
    onSave?.(content);
  };

  const handleCancel = () => {
    setContent(initialContent);
    setEditing(false);
  };

  const modules = {
    toolbar: [
      [{ font: [] }],
      [{ size: ["small", false, "large", "huge"] }],
      ["bold", "italic", "underline"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "blockquote", "code-block"],
      ["clean"],
    ],
  };

  return (
    <div className="mt-2">
      {!editing ? (
        <div
          className="text-gray-500 border rounded-md p-3 cursor-text hover:bg-gray-50"
          onClick={() => setEditing(true)}
        >
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            "Add description..."
          )}
        </div>
      ) : (
        <div className="bg-white rounded-md">
          <div className="p-3">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              placeholder="Write issue description..."
              className="min-h-[120px]"
            />
          </div>
          <div className="flex gap-2 px-3 pb-3">
            <Button onClick={handleSave}>
              Save
            </Button>
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
