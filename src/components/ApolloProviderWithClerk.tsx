import { ApolloProvider } from '@apollo/client/react';
import { useAuth } from '@clerk/clerk-react';
import { useMemo } from 'react';
import { createApolloClient } from '../graphql/client';

export const ApolloProviderWithClerk = ({ children }: { children: React.ReactNode }) => {
  const { getToken } = useAuth();

  // We use useMemo to ensure the client is only created once per session,
  // preventing it from being recreated on every render.
  const apolloClient = useMemo(() => {
    return createApolloClient(getToken);
  }, [getToken]);

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
};