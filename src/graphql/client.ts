import { ApolloClient, InMemoryCache, ApolloLink } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import { SetContextLink } from '@apollo/client/link/context';

export const createApolloClient = (getToken: (options?: { template?: string }) => Promise<string | null>) => {
  const httpLink = new HttpLink({
    uri: import.meta.env.VITE_HASURA_GRAPHQL_ENDPOINT,
  });

  const authLink = new SetContextLink(async (operation, _) => {
    const token = await getToken({ template: 'Hasura' });

    const context = operation.getContext();
    const headers = context.headers || {};

    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  });

  return new ApolloClient({
    link: ApolloLink.from([authLink, httpLink]),
    cache: new InMemoryCache(),
  });
};