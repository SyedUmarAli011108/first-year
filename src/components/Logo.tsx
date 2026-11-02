import React from 'react';
import { FlaskConical, MessageSquareText, Terminal } from 'lucide-react';
import { SubjectName } from '../types/study';

export function LogoMark({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="36" height="36" rx="10" fill="#2563EB" />
      {/* Open book left & right pages */}
      <path
        d="M9.5 12.5C9.5 11.6716 10.1716 11 11 11H16C17.1046 11 18 11.8954 18 13V25C18 24.1716 17.3284 23.5 16.5 23.5H11C10.1716 23.5 9.5 22.8284 9.5 22V12.5Z"
        fill="#FFFFFF"
      />
      <path
        d="M26.5 12.5C26.5 11.6716 25.8284 11 25 11H20C18.8954 11 18 11.8954 18 13V25C18 24.1716 18.6716 23.5 19.5 23.5H25C25.8284 23.5 26.5 22.8284 26.5 22V12.5Z"
        fill="#DBEAFE"
      />
      {/* Smart check / spark accent */}
      <circle cx="26.5" cy="10.5" r="4.5" fill="#10B981" stroke="#2563EB" strokeWidth="1.5" />
      <path
        d="M24.7 10.5L25.9 11.7L28.4 9.2"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SubjectIcon({
  subject,
  className = 'w-4 h-4',
}: {
  subject: SubjectName;
  className?: string;
}) {
  switch (subject) {
    case 'Chemistry':
      return <FlaskConical className={className} aria-hidden="true" />;
    case 'Communication Skills':
      return <MessageSquareText className={className} aria-hidden="true" />;
    case 'PSC':
      return <Terminal className={className} aria-hidden="true" />;
  }
}
