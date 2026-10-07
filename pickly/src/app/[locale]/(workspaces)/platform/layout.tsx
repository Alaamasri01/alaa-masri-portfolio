import { WorkspaceLayout } from "@/components/layout/workspace-layout";

export default function Layout({ children, params }: LayoutProps<"/[locale]/platform">) {
  return (
    <WorkspaceLayout params={params} workspace="platform">
      {children}
    </WorkspaceLayout>
  );
}
