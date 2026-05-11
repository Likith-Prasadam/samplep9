import { gql } from '@apollo/client';

export const GET_DETENTION_PANEL_DASHBOARD = gql`
  query GetDetentionPanelDashboard($facility_id: String!) {
    detention_panel {
      get_detention_panel_dashboard(facility_id: $facility_id) {
        count_accuracy
        variance_alerts
        total_inmates
        zones_online
        zones {
          actual
          expected
          status
          timestamp
          variance
          variance_percent
          zone_name
        }
      }
    }
  }
`;
