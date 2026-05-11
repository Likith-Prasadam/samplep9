import { ApolloClient, InMemoryCache } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import { setContext } from '@apollo/client/link/context';

const httpLink = new HttpLink({
  uri:
    import.meta.env.VITE_GRAPHQL_ENDPOINT?.trim() ||
    'https://api-load-test.p9sphere.com/api/v1/graphql',
});

// setContext returns an ApolloLink, not a class constructor
const authLink = setContext((_, { headers }) => {
  // Check for access_token first (authenticated user), then selection_token (role selection), then old token format
  const accessToken = localStorage.getItem('access_token');
  const selectionToken = localStorage.getItem('selection_token');
  const token = localStorage.getItem('token');

  const authToken = accessToken || selectionToken || token;

  // console.log('🔐 Apollo Client Auth Link:', {
  //   hasAccessToken: !!accessToken,
  //   hasSelectionToken: !!selectionToken,
  //   hasToken: !!token,
  //   usingToken: authToken ? authToken.substring(0, 50) + '...' : 'NONE',
  // });

  return {
    headers: {
      ...headers,
      authorization: authToken ? `Bearer ${authToken}` : '',
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          events_lists: {
            merge: true,
          },
          global_prompts: {
            merge: true,
          },
          batch: {
            merge: true,
          },
          cams: {
            merge: true,
          },
        },
      },
      BatchQueries: {
        fields: {
          getBatchVideos: {
            merge: true,
          },
        },
      },
      GlobalPromptsQueries: {
        fields: {
          get_global_prompts: {
            merge: true,
          },
          read_prompts_from_path: {
            merge: true,
          },
        },
      },
      CamsQueries: {
        fields: {
          fetch_data_by_filters_cams: {
            keyArgs: ['input_json'],
            merge(incoming) {
              return incoming;
            },
          },
        },
      },
      EventsList: {
        merge: true,
      },
      Camera: {
        keyFields: ['cam_hash'],
      },
    },
  }),
});

export default client;
