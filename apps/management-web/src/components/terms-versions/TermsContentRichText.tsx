import { Fragment } from 'react';

type TermsContentRichTextProps = {
  content: string;
};

function renderLineWithBold(line: string): React.ReactNode {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={`bold-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={`text-${index}`}>{part}</Fragment>;
  });
}

export function TermsContentRichText({ content }: TermsContentRichTextProps) {
  const lines = content.split('\n');
  return (
    <>
      {lines.map((line, index) => (
        <p key={`line-${index}`}>{line === '' ? <br /> : renderLineWithBold(line)}</p>
      ))}
    </>
  );
}
