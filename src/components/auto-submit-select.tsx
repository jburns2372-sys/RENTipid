"use client";

import React from "react";

interface AutoSubmitSelectProps {
  name: string;
  defaultValue: string;
  options: string[];
  className?: string;
}

export function AutoSubmitSelect({ name, defaultValue, options, className }: AutoSubmitSelectProps) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      onChange={(e) => e.target.form?.requestSubmit()}
      className={className}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
