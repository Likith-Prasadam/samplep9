import { gql } from '@apollo/client';

export const GET_MANUFACTURING_RECORDS = gql`
  query GetManufacturingRecords(
    $cam_id: Int!
    $start_date: String!
    $end_date: String!
  ) {
    manufacturing {
      records: get_manufacturing_records(
        filters: {
          cam_id: $cam_id
          start_date: $start_date
          end_date: $end_date
        }
      ) {
        cam_id
        created_at
        gloves_missing
        goggles_missing
        hard_hat_missing
        id
        list_of_vehicles
        safety_shoes_missing
        safety_vest_missing
        timestamp
        total_missing
        updated_at
        user_role_id
      }
    }
  }
`;

export const GET_MANUFACTURING_WEEKLY_TIMELINE = gql`
  query GetManufacturingWeeklyTimeline {
    manufacturing {
      timeline: get_manufacturing_weekly_timeline {
        date
        total_missing
        hard_hat_missing
        safety_vest_missing
        gloves_missing
        goggles_missing
        safety_shoes_missing
      }
    }
  }
`;
