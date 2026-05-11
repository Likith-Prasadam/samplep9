import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { format } from 'date-fns';

export interface WarehouseInsight {
  vehicles_entered: number;
  vehicles_exited: number;
  hamalis: number;
  supervisors: number;
  bags_loaded: number;
  bags_unloaded: number;
}

export type WarehouseInsights = Record<string, WarehouseInsight>;

export interface DashboardData {
  total_vehicles_entered: number;
  authorized_vehicles: number;
  unauthorized_vehicles: number;
  total_bags_loaded: number;
  total_bags_unloaded: number;
  total_hamalis: number;
  total_supervisors: number;
  date: string;
  warehouse_insights: WarehouseInsights;
}

export interface WarehouseMeta {
  id: string;
  name: string;
  district: string;
  region: string;
  status: string;
  lat: number;
  lng: number;
}

export interface StorageLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  capacity: string;
}

export interface CivilSuppliesState {
  data: DashboardData;
  warehouseMetadata: WarehouseMeta[];
  storageLocations: StorageLocation[];
  loading: boolean;
  error: string | null;
  activeTab: string;
  selectedDate: string;
  selectedWarehouse: string;
}

const initialDashboardData: DashboardData = {
  total_vehicles_entered: 342,
  authorized_vehicles: 318,
  unauthorized_vehicles: 24,
  total_bags_loaded: 15840,
  total_bags_unloaded: 12350,
  total_hamalis: 156,
  total_supervisors: 28,
  date: format(new Date(), 'yyyy-MM-dd'),
  warehouse_insights: {
    WH001: {
      vehicles_entered: 87,
      vehicles_exited: 82,
      hamalis: 42,
      supervisors: 8,
      bags_loaded: 4200,
      bags_unloaded: 3150,
    },
    WH002: {
      vehicles_entered: 65,
      vehicles_exited: 63,
      hamalis: 28,
      supervisors: 5,
      bags_loaded: 3180,
      bags_unloaded: 2840,
    },
    WH003: {
      vehicles_entered: 72,
      vehicles_exited: 70,
      hamalis: 35,
      supervisors: 6,
      bags_loaded: 3520,
      bags_unloaded: 2910,
    },
    WH004: {
      vehicles_entered: 58,
      vehicles_exited: 56,
      hamalis: 26,
      supervisors: 5,
      bags_loaded: 2680,
      bags_unloaded: 2230,
    },
    WH005: {
      vehicles_entered: 60,
      vehicles_exited: 58,
      hamalis: 25,
      supervisors: 4,
      bags_loaded: 2260,
      bags_unloaded: 1220,
    },
  },
};

const warehouseMetadataList: WarehouseMeta[] = [
  {
    id: 'WH001',
    name: 'MLS Point Gudivada',
    district: 'Krishna',
    region: 'Central',
    status: 'Active',
    lat: 16.4333,
    lng: 80.9833,
  },
  {
    id: 'WH002',
    name: 'MLS Point Bapatla',
    district: 'Bapatla',
    region: 'Central',
    status: 'Active',
    lat: 15.9042,
    lng: 80.4673,
  },
  {
    id: 'WH003',
    name: 'MLS Point Nidadavole',
    district: 'East Godavari',
    region: 'Central',
    status: 'Active',
    lat: 16.9167,
    lng: 81.6667,
  },
  {
    id: 'WH004',
    name: 'MLS Point Gudur',
    district: 'Gudur',
    region: 'Central',
    status: 'Active',
    lat: 14.15,
    lng: 79.85,
  },
  {
    id: 'WH005',
    name: 'MLS Point Tirupati',
    district: 'Tirupati',
    region: 'Rayalaseema',
    status: 'Active',
    lat: 13.6288,
    lng: 79.4192,
  },
];

const storageLocationsList: StorageLocation[] = [
  {
    id: 1,
    name: 'Visakhapatnam MLS Point',
    latitude: 17.6868,
    longitude: 83.2185,
    description: 'Main storage facility in Visakhapatnam',
    capacity: '10,000 tons',
  },
  {
    id: 2,
    name: 'Vijayawada MLS Point',
    latitude: 16.5062,
    longitude: 80.648,
    description: 'Primary distribution center for central AP',
    capacity: '8,500 tons',
  },
  {
    id: 3,
    name: 'Guntur MLS Point',
    latitude: 16.3067,
    longitude: 80.4365,
    description: 'Key logistics hub for agricultural products',
    capacity: '7,200 tons',
  },
  {
    id: 4,
    name: 'Tirupati MLS Point',
    latitude: 13.6288,
    longitude: 79.4192,
    description: "Southern AP's main storage facility",
    capacity: '6,000 tons',
  },
];

const initialState: CivilSuppliesState = {
  data: initialDashboardData,
  warehouseMetadata: warehouseMetadataList,
  storageLocations: storageLocationsList,
  loading: false,
  error: null,
  activeTab: 'overview',
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  selectedWarehouse: 'all',
};

export const fetchDashboardData = createAsyncThunk(
  'civilSupplies/fetchDashboardData',
  async (
    { date, warehouseId }: { date: string; warehouseId: string },
    { rejectWithValue }
  ) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      let filteredData = { ...initialDashboardData };

      if (date !== format(new Date(), 'yyyy-MM-dd')) {
        filteredData = {
          ...filteredData,
          total_vehicles_entered: 0,
          authorized_vehicles: 0,
          unauthorized_vehicles: 0,
          total_bags_loaded: 0,
          total_bags_unloaded: 0,
          total_hamalis: 0,
          total_supervisors: 0,
          warehouse_insights: Object.fromEntries(
            Object.keys(filteredData.warehouse_insights).map((id) => [
              id,
              {
                vehicles_entered: 0,
                vehicles_exited: 0,
                hamalis: 0,
                supervisors: 0,
                bags_loaded: 0,
                bags_unloaded: 0,
              },
            ])
          ),
        };
      }

      if (warehouseId !== 'all') {
        const warehouseInsight =
          initialDashboardData.warehouse_insights[warehouseId];
        if (warehouseInsight) {
          filteredData = {
            ...filteredData,
            total_vehicles_entered: warehouseInsight.vehicles_entered,
            authorized_vehicles: Math.floor(
              warehouseInsight.vehicles_entered * 0.93
            ),
            unauthorized_vehicles:
              warehouseInsight.vehicles_entered -
              Math.floor(warehouseInsight.vehicles_entered * 0.93),
            total_bags_loaded: warehouseInsight.bags_loaded,
            total_bags_unloaded: warehouseInsight.bags_unloaded,
            total_hamalis: warehouseInsight.hamalis,
            total_supervisors: warehouseInsight.supervisors,
            warehouse_insights: { [warehouseId]: warehouseInsight },
          };
        }
      }

      return filteredData;
    } catch {
      return rejectWithValue('Failed to fetch dashboard data');
    }
  }
);

const civilSuppliesSlice = createSlice({
  name: 'civilSupplies',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    setSelectedWarehouse: (state, action: PayloadAction<string>) => {
      state.selectedWarehouse = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    resetFilters: (state) => {
      state.selectedDate = format(new Date(), 'yyyy-MM-dd');
      state.selectedWarehouse = 'all';
      state.data = initialDashboardData;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setActiveTab,
  setSelectedDate,
  setSelectedWarehouse,
  setLoading,
  resetFilters,
} = civilSuppliesSlice.actions;

export default civilSuppliesSlice.reducer;
