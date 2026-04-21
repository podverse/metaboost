import { redirect } from 'next/navigation';

import { termsVersionEditRoute } from '../../../../lib/routes';

type TermsVersionLegacyDetailPathProps = {
  params: Promise<{ id: string }>;
};

/** Old `/terms-version/:id` URLs redirect to the edit form; there is no separate detail page. */
export default async function TermsVersionLegacyDetailRedirect({
  params,
}: TermsVersionLegacyDetailPathProps) {
  const { id } = await params;
  redirect(termsVersionEditRoute(id));
}
