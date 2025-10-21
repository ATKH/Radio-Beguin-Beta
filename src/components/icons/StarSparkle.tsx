import * as React from "react";

function StarSparkle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        d="M12 3.5l1.3 3.84c.18.54.61.96 1.16 1.14L18 9.87l-3.04 2.23a1.57 1.57 0 00-.58 1.71l1.21 3.94-3.26-2.3a1.57 1.57 0 00-1.82 0l-3.26 2.3 1.21-3.95c.14-.46-.02-.97-.37-1.28L6 9.87l3.55-.39c.55-.06 1.03-.44 1.21-.97L12 3.5z"
        fill="currentColor"
        fillOpacity=".85"
      />
      <circle cx={20} cy={6} r={1.2} fill="currentColor" fillOpacity={0.8} />
      <circle cx={4} cy={7} r={0.8} fill="currentColor" fillOpacity={0.65} />
    </svg>
  );
}

export default StarSparkle;
