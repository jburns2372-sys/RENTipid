import ProviderListingPromotePage from '@/app/dashboard/provider/listings/[id]/promote/page';

export default function BusinessListingPromotePage({ params }: { params: Promise<{ id: string }> }) {
  return <ProviderListingPromotePage params={params} />;
}
