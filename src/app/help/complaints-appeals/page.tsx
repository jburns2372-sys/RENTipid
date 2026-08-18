import { redirect } from 'next/navigation';

export default function ComplaintsRedirect() {
  // Assuming /support or /contact is the canonical route for complaints.
  redirect('/support');
}
