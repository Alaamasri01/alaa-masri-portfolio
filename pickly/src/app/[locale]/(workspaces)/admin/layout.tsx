import { WorkspaceLayout } from "@/components/layout/workspace-layout";

export default function Layout({ children, params }: LayoutProps<"/[locale]/admin">) {
  return (
    <WorkspaceLayout params={params} workspace="admin">
      {children}
    </WorkspaceLayout>
  );
}
