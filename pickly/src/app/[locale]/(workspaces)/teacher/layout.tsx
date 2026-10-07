import { WorkspaceLayout } from "@/components/layout/workspace-layout";

export default function Layout({ children, params }: LayoutProps<"/[locale]/teacher">) {
  return (
    <WorkspaceLayout params={params} workspace="teacher">
      {children}
    </WorkspaceLayout>
  );
}
