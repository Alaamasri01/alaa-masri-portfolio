import { WorkspaceLayout } from "@/components/layout/workspace-layout";

export default function Layout({ children, params }: LayoutProps<"/[locale]/parent">) {
  return (
    <WorkspaceLayout params={params} workspace="parent">
      {children}
    </WorkspaceLayout>
  );
}
