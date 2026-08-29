import VerifyEmailClient from './verify-email-client';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; sent?: string }>;
}) {
  const { token, sent } = await searchParams;
  return <VerifyEmailClient token={token || ''} sent={sent === 'true'} />;
}
