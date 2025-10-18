"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { Button } from "@/components/ui/button";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface CommentInputProps {
  issueId: string;
  parentId?: string; // Thêm parentId nếu cần
}

export default function CommentInput({ issueId }: CommentInputProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // ✅ Lấy thông tin người dùng hiện tại
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/current");
        const data = await res.json();
        setCurrentUser(data);
        console.log("👤 Current user:", data);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
      }
    };
    fetchUser();
  }, []);

  // ✅ Gửi bình luận
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !currentUser) return;

    setLoading(true);
    try {
      await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId,
          parentId: null,
          userId: currentUser.data.$id,
          userName: currentUser.data.name,
          content,
        }),
      });

      setContent("");
      window.location.reload();
    } catch (error) {
      console.error("Lỗi khi gửi comment:", error);
    } finally {
      setLoading(false);
    }
  };

  
  const modules = {
    toolbar: [
      [{ font: [] }], 
      [{ size: ["small", false, "large", "huge"] }], 
      ["bold", "italic", "underline", ], 
      [{ color: [] }, { background: [] }], 
      [{ align: [] }], 
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "blockquote", "code-block"],
      ["clean"], 
    ],
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 bg-white p-4 border border-gray-200 rounded-2xl shadow-sm"
    >
      <ReactQuill
        theme="snow"
        value={content}
        onChange={setContent}
        modules={modules}
        placeholder="Write a comment..."
        className="mb-4"
      />

      <Button
        type="submit"
        disabled={loading || !currentUser}
        className="text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex justify-end  "
      >
        {loading ? "Sending..." : "Send Comment"}
      </Button>
    </form>
  );
}
