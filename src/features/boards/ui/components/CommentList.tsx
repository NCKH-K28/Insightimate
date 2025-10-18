"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Heart, Share2 } from "lucide-react";
import ReplyModal from "./ReplyModal";
interface Comment {
  id: string;
  userId: string;
  userName: string;
  issueId: string;
  content: string;
  createdAt: string;
}

interface CommentListProps {
  projectId: string;
}

export default function CommentList({ projectId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    const mockData: Comment[] = [
      {
        id: "1",
        content: "<p>Dự án này rất thú vị, tôi sẽ theo dõi thêm!</p>",
        userId: "user1",
        userName: "Nguyễn Văn A",
        issueId: "issue1",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        content: "<p>Tôi nghĩ nên bổ sung thêm chức năng thống kê.</p>",
        userId: "user2",
        userName: "Trần Thị B",
        issueId: "issue1",
      
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
    setTimeout(() => {
      setComments(mockData.reverse());
      setLoading(false);
    }, 1000);
  }, [projectId]);


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);

  const handleOpenReplyModal = (comment: Comment) => {
    setSelectedComment(comment);
    setIsModalOpen(true);
  };

  const handleSendReply = (text: string) => {
    if (!text.trim()) return;
    console.log(`📨 Reply tới ${selectedComment?.userName}: ${text}`);
    setIsModalOpen(false);
  };

  if (loading) return <p className="text-center text-gray-500 comments-section pb-5"></p>;
  if (comments.length === 0)
    return <p className="text-center text-gray-400 comments-section pb-5">Chưa có bình luận nào.</p>;

  return (
    <div className="space-y-4 pb-30">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="bg-white shadow-md rounded-2xl p-4 border border-gray-100 mx-auto w-full"
        >
          {/* Header user */}
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-600">
              {comment.userId.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold">{comment.userName}</p>
              <p className="text-xs text-gray-400">
                {new Date(comment.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>

          {/* Nội dung comment */}
          <div
            className="prose max-w-none text-gray-800 mb-3"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />

          {/* Nút hành động */}
          <div className="flex items-center justify-between text-gray-400 text-sm">
            <div className="flex space-x-4">
              <button className="flex items-center gap-1 hover:text-red-500 transition">
                <Heart size={16} /> Like
              </button>
              <button
                className="flex items-center gap-1 hover:text-blue-500 transition"
                onClick={() => handleOpenReplyModal(comment)}
              >
                <MessageCircle size={16} /> Reply
              </button>
            </div>
            <Share2 size={16} className="hover:text-gray-700 cursor-pointer" />
          </div>

          {/* Form reply */}
          <ReplyModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            parentComment={selectedComment}
            replies={[
              {
                id: "r1",
                userId: "user3",
                userName: "Trần Thị B",
                issueId: "r1",
                content: "Đồng ý, phần thống kê tải hơi chậm, nhóm nên xem lại query DB.",
                createdAt: new Date(Date.now() - 3600000).toISOString(),
              },
              {
                id: "r2",
                userId: "user3",
                userName: "Phạm Văn C",
                issueId: "r2",
                content: "Mình đồng ý với B, nhóm backend cần tối ưu thêm caching.",
                createdAt: new Date(Date.now() - 1800000).toISOString(),
              },
            ]}
            onSendReply={handleSendReply}
          />
        </div>
      ))}
    </div>
  );
}
