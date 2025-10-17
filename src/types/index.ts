// This interface describes the shape of the user profile data
export interface UserProfile {
  id: string;
  name: string;
  blood_group: string | null;
  last_donation_date: string | null;
}

// This interface describes the entire shape of the data returned by your GraphQL query
export interface DashboardQueryData {
  users_by_pk: UserProfile;
}