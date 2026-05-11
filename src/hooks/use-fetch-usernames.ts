import { useEffect, useCallback, useRef } from 'react';
import { useLazyQuery } from '@apollo/client';
import { GET_USERS } from '@/graphql/mutations';
import type { AppDispatch } from '@/store/index';
import { setUsernames } from '@/store/slices/playground-slice';
import type { BatchVideo } from '@/features/playground/types/batch-analysis';

export const useFetchUsernames = (
  videos: BatchVideo[],
  usernames: Record<string, string>,
  dispatch: AppDispatch // Typed as AppDispatch
) => {
  const [getUser] = useLazyQuery(GET_USERS, { fetchPolicy: 'network-only' });
  const isFetchingRef = useRef(false);
  const fetchedUserIdsRef = useRef<Set<string>>(new Set());

  const fetchUser = useCallback(
    async (id: string): Promise<string> => {
      try {
        // Convert string user_id to number if needed for GraphQL
        const userIdNum = parseInt(id, 10);
        if (isNaN(userIdNum)) {
          console.warn(`[useFetchUsernames] Invalid user_id format: ${id}`);
          return '';
        }

        const { data, error } = await getUser({
          variables: { input_json: { user_id: userIdNum } },
        });

        if (error) {
          console.error(
            `[useFetchUsernames] Error fetching user ${id}:`,
            error
          );
          return '';
        }

        const username =
          data?.users?.fetch_data_by_filters_users?.users?.[0]?.username || '';

        if (username) {
          console.log(
            `[useFetchUsernames] Fetched username for user_id ${id}: ${username}`
          );
        } else {
          console.warn(
            `[useFetchUsernames] No username found for user_id: ${id}`
          );
        }

        return username;
      } catch (error) {
        console.error(
          `[useFetchUsernames] Exception fetching user ${id}:`,
          error
        );
        return '';
      }
    },
    [getUser]
  );

  useEffect(() => {
    if (videos.length === 0 || isFetchingRef.current) return;

    isFetchingRef.current = true;
    const userIds = [
      ...new Set(
        videos
          .map((v) => v.user_id)
          .filter((id): id is string => id !== undefined)
      ),
    ];
    const missingIds = userIds.filter((id) => {
      if (usernames[id] && usernames[id].trim() !== '') {
        return false;
      }
      if (fetchedUserIdsRef.current.has(id)) {
        return false;
      }
      return true;
    });

    if (missingIds.length === 0) {
      isFetchingRef.current = false;
      return;
    }

    missingIds.forEach((id) => fetchedUserIdsRef.current.add(id));

    console.log(
      `[useFetchUsernames] Fetching usernames for ${missingIds.length} users:`,
      missingIds
    );

    Promise.all(
      missingIds.map(async (id) => {
        const username = await fetchUser(id);
        return { id, username };
      })
    )
      .then((results) => {
        const usernameMap = Object.fromEntries(
          results.map((r) => [r.id, r.username || 'Unknown'])
        );
        console.log('[useFetchUsernames] Usernames fetched:', usernameMap);
        dispatch(setUsernames(usernameMap));
      })
      .catch((error) => {
        console.error('[useFetchUsernames] Error in Promise.all:', error);
      })
      .finally(() => {
        isFetchingRef.current = false;
      });
  }, [videos, usernames, fetchUser, dispatch]);
};
