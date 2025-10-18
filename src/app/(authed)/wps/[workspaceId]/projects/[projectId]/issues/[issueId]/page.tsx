'use client';


import { useQuery } from "@tanstack/react-query";
import { getProjectQueryOptions } from '@/features/projects/api/actions';
import { useParams } from "next/navigation";
import CommentInput from '@/features/boards/ui/components/CommentInput';
import CommentList from '@/features/boards/ui/components/CommentList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Page() {
    const params = useParams<{
        workspaceId: string;
        projectId: string;
        issueId: string;
    }>();
    const { data: project } = useQuery(getProjectQueryOptions({ projectId: params.projectId }));

    const boardId = project?.boardId;

    const issueId = params.issueId;


    console.log("=====> check boardId : " + boardId);


    // const { data: issue, isPending, error } = useQuery(
    //   getBoardIssueQueryOptions({ boardId, issueId })
    // );


    return (
        <div className="flex h-screen bg-white">
            <div className="w-3/5 border-r border-gray-300 overflow-y-auto p-6">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">Issue: { }</h2>
                        <p className="text-gray-600">
                            Issue ID: <strong>{params.issueId}</strong> — Workspace:{" "}
                            <strong>{params.workspaceId}</strong>
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <h3 className="font-semibold text-lg mb-1">Description</h3>
                        <p className="text-gray-700 border rounded-md p-3">
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero nesciunt quas vitae, ducimus blanditiis ipsam repellat nemo sapiente officia ea iusto itaque quisquam error doloremque exercitationem earum reprehenderit cumque dolor.
                            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dicta esse labore id illo. Nemo ratione enim id natus fugit, harum, dignissimos, perferendis veritatis quam animi quas maiores laborum vitae voluptatum!
                            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Iure necessitatibus delectus consequuntur sapiente quam rerum, aspernatur commodi, minus vel quaerat quod? Facere, suscipit nam! Nisi iure accusantium quibusdam cupiditate quod!
                            Lorem ipsum dolor sit amet consectetur, adipisicing elit. Natus obcaecati earum ad. Nobis ipsum vitae facere numquam in, labore illo atque totam sint! Commodi dolore quo harum reiciendis, odio quam?
                        </p>
                    </div>
                    <Tabs defaultValue="checklist" className="w-full ">
                        <TabsList>
                            <TabsTrigger value="checklist">checklist</TabsTrigger>
                            <TabsTrigger value="comments">comments</TabsTrigger>
                        </TabsList>
                        <TabsContent value="checklist"></TabsContent>
                        <TabsContent value="comments"><CommentInput issueId={issueId} /><CommentList projectId={issueId} /></TabsContent>
                    </Tabs>
                </div>
            </div>  

            <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                    {/* Comments */}
                    <div>
                        <CommentInput issueId={issueId} />
                    </div>

                </div>
            </div>
        </div>
    );
}