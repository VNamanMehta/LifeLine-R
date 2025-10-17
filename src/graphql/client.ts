import { ApolloClient, InMemoryCache, ApolloLink } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import { SetContextLink } from '@apollo/client/link/context';

export const createApolloClient = (getToken: (options?: { template?: string }) => Promise<string | null>) => {
  const httpLink = new HttpLink({
    uri: import.meta.env.VITE_HASURA_GRAPHQL_ENDPOINT,
  });

  // This is the simplest and most robust solution.
  // We don't need to access the operation or context arguments.
  const authLink = new SetContextLink(async () => {
    const token = await getToken({ template: 'hasura' });

    // Return a context object with just the headers we need to set.
    // Apollo Client will automatically handle merging this with any existing context.
    return {
      headers: {
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  });

  return new ApolloClient({
    link: ApolloLink.from([authLink, httpLink]),
    cache: new InMemoryCache(),
  });
};