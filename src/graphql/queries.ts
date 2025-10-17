import { gql } from '@apollo/client';

export const GET_DONOR_DASHBOARD_DATA = gql`
  query GetDonorDashboardData($userId: uuid!) {
    users_by_pk(id: $userId) {
      id
      name
      blood_group
      last_donation_date
    }
  }
`;