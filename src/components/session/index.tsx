import { GroupedScoreBadges } from "@/src/components/grouped-score-badge";
import Header from "@/src/components/layouts/header";
import { NoAccessError } from "@/src/components/no-access";
import { PublishSessionSwitch } from "@/src/components/publish-object-switch";
import { StarSessionToggle } from "@/src/components/star-toggle";
import { IOPreview } from "@/src/components/trace/IOPreview";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { ManualScoreButton } from "@/src/features/manual-scoring/components/ManualScoreButton";
import { DetailPageNav } from "@/src/features/navigate-detail-pages/DetailPageNav";
import { api } from "@/src/utils/api";
import Link from "next/link";

export const SessionPage: React.FC<{
  sessionId: string;
  projectId: string;
}> = ({ sessionId, projectId }) => {
  const session = api.sessions.byId.useQuery(
    {
      sessionId,
      projectId: projectId,
    },
    {
      retry(failureCount, error) {
        if (error.data?.code === "UNAUTHORIZED") return false;
        return failureCount < 3;
      },
    },
  );

  if (session.error?.data?.code === "UNAUTHORIZED") return <NoAccessError />;

  return (
    <div className="flex flex-col overflow-hidden xl:container">
      <Header
        title="Session"
        breadcrumb={[
          {
            name: "Sessions",
            href: `/project/${projectId}/sessions`,
          },
          { name: sessionId },
        ]}
        actionButtons={[
          <StarSessionToggle
            key="star"
            projectId={projectId}
            sessionId={sessionId}
            value={session.data?.bookmarked ?? false}
          />,
          <PublishSessionSwitch
            projectId={projectId}
            sessionId={sessionId}
            isPublic={session.data?.public ?? false}
            key="publish"
          />,
          <DetailPageNav
            key="nav"
            currentId={sessionId}
            path={(id) => `/project/${projectId}/sessions/${id}`}
            listKey="sessions"
          />,
        ]}
      />
      <div className="flex flex-wrap gap-2">
        {session.data?.users.map((userId) => (
          <Link key={userId} href={`/project/${projectId}/users/${userId}`}>
            <Badge>User ID: {userId}</Badge>
          </Link>
        ))}
        <Badge variant="outline">Traces: {session.data?.traces.length}</Badge>
      </div>
      <div className="mt-5 flex flex-col gap-2 border-t pt-5">
        {session.data?.traces.map((trace) => (
          <Card
            className="border-border-gray-150 group grid gap-3 p-2 shadow-none hover:border-gray-300 md:grid-cols-3"
            key={trace.id}
          >
            <div className="col-span-2 flex flex-col gap-2 p-0">
              {trace.input || trace.output ? (
                <IOPreview
                  key={trace.id}
                  input={trace.input}
                  output={trace.output}
                  hideIfNull
                />
              ) : (
                <div className="p-2 text-xs text-gray-500">
                  This trace has no input or output.
                </div>
              )}
            </div>
            <div className="-mt-1 p-1 opacity-50 transition-opacity group-hover:opacity-100">
              <Link
                href={`/project/${projectId}/traces/${trace.id}`}
                className="text-xs hover:underline"
              >
                Trace: {trace.name} ({trace.id})&nbsp;↗
              </Link>
              <div className="text-xs text-gray-500">
                {trace.timestamp.toLocaleString()}
              </div>
              <div className="mb-1 mt-2 text-xs text-gray-500">Scores</div>
              <div className="flex flex-wrap content-start items-start gap-1">
                <GroupedScoreBadges scores={trace.scores} />
              </div>
              <ManualScoreButton
                projectId={projectId}
                traceId={trace.id}
                scores={trace.scores}
                variant="badge"
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
