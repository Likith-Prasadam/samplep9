import { useCallback, useRef } from 'react';
import type {
  DocumentNode,
  OperationVariables,
  ApolloError,
} from '@apollo/client';
import { useLazyQuery } from '@apollo/client';

interface UseDebouncedQueryOptions<TData> {
  query: DocumentNode;
  delay?: number;
  onCompleted?: (data: TData) => void;
  onError?: (error: ApolloError) => void;
}

export const useDebouncedQuery = <
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables,
>({
  query,
  delay = 500,
  onCompleted,
  onError,
}: UseDebouncedQueryOptions<TData>) => {
  const [executeQuery, { loading, data, error }] = useLazyQuery<
    TData,
    TVariables
  >(query, {
    fetchPolicy: 'cache-and-network',
    onCompleted,
    onError,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const execute = useCallback(
    (variables: TVariables) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        executeQuery({ variables });
      }, delay);
    },
    [executeQuery, delay]
  );

  return {
    execute,
    loading,
    data,
    error,
  };
};
