export type TermsVersionLifecycleStatus = 'draft' | 'upcoming' | 'current' | 'deprecated';

export type ManagementTermsVersion = {
  id: string;
  versionKey: string;
  title: string;
  contentHash: string;
  contentTextEnUs: string;
  contentTextEs: string;
  announcementStartsAt: string | null;
  enforcementStartsAt: string;
  status: TermsVersionLifecycleStatus;
  createdAt: string;
  updatedAt: string;
};

export type ListTermsVersionsData = {
  termsVersions: ManagementTermsVersion[];
};

export type CreateTermsVersionBody = {
  versionKey: string;
  title: string;
  contentTextEnUs: string;
  contentTextEs: string;
  announcementStartsAt?: string | null;
  enforcementStartsAt: string;
  status: 'draft' | 'upcoming';
};

export type UpdateTermsVersionBody = {
  title?: string;
  contentTextEnUs?: string;
  contentTextEs?: string;
  announcementStartsAt?: string | null;
  enforcementStartsAt?: string;
  status?: 'draft' | 'upcoming';
};
