import { redirect } from 'next/navigation';

export default function AdsTransparencyRedirect() {
  // If no canonical page exists yet, redirect to trust and safety hub
  redirect('/help/trust-safety-legal');
}
