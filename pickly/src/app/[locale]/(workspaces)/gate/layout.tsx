import { WorkspaceLayout } from "@/components/layout/workspace-layout";

export default function Layout({ children, params }: LayoutProps<"/[locale]/gate">) {
  return (
    <WorkspaceLayout params={params} workspace="gate">
      {children}
    </WorkspaceLayout>
  );
}
