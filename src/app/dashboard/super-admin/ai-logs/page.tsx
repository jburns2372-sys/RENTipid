import AILogsPage from '../../admin/ai-logs/page';

interface SuperAdminAILogsPageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default function SuperAdminAILogsPage(props: SuperAdminAILogsPageProps) {
  return <AILogsPage searchParams={props.searchParams} />;
}
