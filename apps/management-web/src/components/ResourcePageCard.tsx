import { Container, SectionWithHeading, Text } from '@metaboost/ui';

export type ResourcePageCardProps = {
  title: string;
  /** When set, renders an error message above children. */
  error?: string;
  /** When true, do not wrap in Container. Use when this card is already inside ContentPageLayout (or another layout that provides padding/max-width) to avoid double padding. */
  skipContainer?: boolean;
  children: React.ReactNode;
};

export function ResourcePageCard({
  title,
  error,
  skipContainer = false,
  children,
}: ResourcePageCardProps) {
  const content = (
    <SectionWithHeading title={title}>
      {error !== undefined && error !== '' && (
        <Text variant="error" role="alert">
          {error}
        </Text>
      )}
      {children}
    </SectionWithHeading>
  );
  if (skipContainer) return content;
  return <Container>{content}</Container>;
}
