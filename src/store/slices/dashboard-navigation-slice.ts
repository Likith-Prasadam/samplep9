import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: string;
  status: 'active' | 'inactive';
  features: string[];
}

export interface DashboardNavigationState {
  availableDashboards: Dashboard[];
  currentDashboard: string | null;
  loading: boolean;
}

const initialState: DashboardNavigationState = {
  availableDashboards: [
    {
      id: 'detention-panel',
      name: 'Detention Panel',
      description:
        'Monitor inmate counts, zone tracking, and facility management in real-time',
      path: '/dashboard/detention-panel',
      icon: 'Shield',
      status: 'active',
      features: ['Zone Counts', 'Traceback', 'Alerts', 'Facility Map'],
    },
    {
      id: 'civil-supplies',
      name: 'Civil Supplies',
      description:
        'Track distribution, inventory, and supply chain management for civil supplies',
      path: '/dashboard/civil-supplies',
      icon: 'Factory',
      status: 'active',
      features: ['Inventory', 'Distribution', 'Analytics', 'Reports'],
    },
  ],
  currentDashboard: null,
  loading: false,
};

const dashboardNavigationSlice = createSlice({
  name: 'dashboardNavigation',
  initialState,
  reducers: {
    setCurrentDashboard: (state, action: PayloadAction<string>) => {
      state.currentDashboard = action.payload;
    },
    setAvailableDashboards: (state, action: PayloadAction<Dashboard[]>) => {
      state.availableDashboards = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setCurrentDashboard, setAvailableDashboards, setLoading } =
  dashboardNavigationSlice.actions;

export default dashboardNavigationSlice.reducer;
