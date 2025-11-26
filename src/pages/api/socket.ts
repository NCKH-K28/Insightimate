import { Server as IOServer } from 'socket.io';

/** =========== [Ví dụ chạy được ở client] ===========
export default function DemoSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const socket = io({ path: "/api/socket" });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("connected:", socket.id);
    });

    socket.on("server:message", (msg: string) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.disconnect();
  }, []);

  const send = () => {
    socketRef.current?.emit("client:message", "Hello from client!");
  };

  return (
    <div className="p-4 space-y-2">
      <button onClick={send} className="border px-2 py-1">
        Send
      </button>
      <ul className="space-y-1">
        {messages.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  );
}
 */

export const config = { api: { bodyParser: false } };
export default function handler(_req: any, res: any) {
  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server, {
      path: '/api/socket',
      cors: { origin: '*' },
    });

    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('✅ client connected:', socket.id);

      socket.onAny((event, ...args) => {
        console.log('📩 event from client:', event, args);
      });

      socket.on('client:message', (msg) => {
        console.log('server nhận từ client:', msg);
        socket.emit('server:message', 'server đã nhận: ' + msg);
      });

      // ⭐ NEW: Xử lý tạo comment qua socket
      socket.on('create-comment', async (commentData) => {
        console.log('📝 Creating comment via socket:', commentData);
        
        try {
          // Import prisma và createId
          const { prisma } = await import('@/lib/prisma');
          const { createId } = await import('@paralleldrive/cuid2');

          // Tạo comment trong database
          const comment = await prisma.comment.create({
            data: {
              id: createId(),
              content: commentData.content,
              userId: commentData.userId,
              userName: commentData.userName,
              issueId: commentData.issueId,
              parentId: commentData.parentId || null,
            },
          });

          console.log('✅ Comment created successfully:', comment.id);

          // Gửi response về client đã gửi
          socket.emit('comment-created', {
            success: true,
            comment: comment,
          });

          // Broadcast đến tất cả users khác trong issue này
          socket.broadcast.emit('receive-comment', comment);

        } catch (error) {
          console.error('❌ Error creating comment via socket:', error);
          
          // Gửi error về client
          socket.emit('comment-created', {
            success: false,
            error: error.message,
          });
        }
      });
    });
  } else {
    console.log('♻️ Socket.io server already running');
  }

  res.end();
}
