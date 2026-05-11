import React from 'react';
import type { UseFormReturn, FieldError } from 'react-hook-form';
import type { FormValues } from './../types/model-config';

interface ErrorSummaryProps {
  form: UseFormReturn<FormValues>;
}

const ErrorSummary: React.FC<ErrorSummaryProps> = ({ form }) => {
  if (Object.keys(form.formState.errors).length === 0) return null;

  return (
    <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500 text-red-400">
      <div className="flex items-start gap-2">
        <div className="w-5 h-5 mt-0.5 flex-shrink-0">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-medium mb-2">Please fix the following errors:</h4>
          <ul className="space-y-1 text-sm">
            {Object.entries(form.formState.errors).map(([fieldName, error]) => {
              const fieldLabel =
                {
                  model: 'Model Selection',
                  temperature: 'Temperature',
                  topP: 'Top P',
                  repetitionPenalty: 'Repetition Penalty',
                  maxTokens: 'Max Tokens',
                  user_prompt: 'User Prompt',
                  promptType: 'Prompt Type',
                }[fieldName] || fieldName;

              const fieldContext =
                fieldName === 'temperature'
                  ? ' (0.01 - 1.5)'
                  : fieldName === 'topP'
                    ? ' (0.001 - 0.9)'
                    : fieldName === 'repetitionPenalty'
                      ? ' (0.5 - 2.0)'
                      : fieldName === 'maxTokens'
                        ? ' (400 - 600)'
                        : '';

              return (
                <li key={fieldName} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>
                    <strong className="text-red-300">{fieldLabel}</strong>
                    {fieldContext && (
                      <span className="text-red-300 ml-1">{fieldContext}</span>
                    )}
                    {(error as FieldError)?.message && (
                      <span className="ml-1">
                        {' '}
                        - {(error as FieldError).message}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ErrorSummary;
