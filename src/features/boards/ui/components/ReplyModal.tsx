"use client";

import { useState } from "react";
import CommentList from "./CommentList";
import CommentInput from "./CommentInput";

interface Comment {
  id: string;
  userId: string;
  userName: string;
  issueId: string;
  content: string;
  createdAt: string;
}

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentComment: Comment | null;
  replies: Comment[];
  onSendReply: (reply: string) => void;
}

export default function ReplyModal({
  isOpen,
  onClose,
  parentComment,
  replies,
  onSendReply,
}: ReplyModalProps) {
  const [reply, setReply] = useState("");
  const issueId = parentComment?.issueId || "";

  if (!isOpen || !parentComment) return null;

  return (
    <div className="fixed inset-0 bg-gray-500/30 flex items-center justify-center z-50">

      <div className="bg-white rounded-2xl w-[500px] max-h-[80vh] overflow-y-auto shadow-xl p-4">
        {/* Bình luận gốc */}
        <div className="border rounded-xl p-4 mb-3 bg-gray-50">
          <div className="flex items-center mb-1">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-600 mr-2">
              {parentComment.userName.slice(0, 1)}
            </div>
            <p className="font-semibold text-sm">{parentComment.userName}</p>
          </div>
          <p className="text-gray-800 text-sm">{parentComment.content}</p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(parentComment.createdAt).toLocaleString("vi-VN")}
          </p>
        </div>

        {/* Các reply */}
        <div className="space-y-2 mb-4">
          {replies.map((r) => (
            <div
              key={r.id}
              className="border rounded-xl p-3 bg-gray-50 ml-8"
            >
              <div className="flex items-center mb-1">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center font-semibold text-green-600 mr-2">
                  {r.userName.slice(0, 1)}
                </div>
                <p className="font-semibold text-sm">{r.userName}</p>
              </div>
              <p className="text-gray-700 text-sm">{r.content}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(r.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          ))}
        </div>

        {/* Ô nhập phản hồi */}
          <CommentInput issueId={issueId} />

        {/* Nút */}
        <div className="flex justify-end gap-2 mt-3">
          <button
            className="px-3 py-1 text-sm rounded-lg bg-gray-200 hover:bg-gray-300"
            onClick={onClose}
          >
            Đóng
          </button>
          <button
            className="px-3 py-1 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600"
            onClick={() => {
              onSendReply(reply);
              setReply("");
            }}
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
