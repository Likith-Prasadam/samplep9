import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import authReducer from '../../../store/slices/auth-slice';
import { camerasReducer } from '../../../store/slices/camera-slice';
import timezoneReducer from '../../../store/slices/timezone-slice';
import { SidebarProvider } from '../../../context/sidebar-context';
import { SearchProvider } from '../../../providers/search-provider';
import { cameraFormSchema, type CameraFormValues } from '../camera-add/schema';
import { INITIAL_FORM_DATA } from '../camera-add/types/types';
import { Step0General } from '../camera-add/components/steps/step-0-general';
import { Step1Location } from '../camera-add/components/steps/step-1-location';
import EditCameraPage from './index';
import { DirectionProvider } from '../../../providers/direction-provider';
import { LayoutProvider } from '../../../providers/layout-provider';

// Mock providers/hooks that are not under test
vi.mock('../../../providers/cameras-provider', () => ({
  useCameras: () => ({ setOpen: vi.fn() }),
}));

vi.mock('@/components/profile-dropdown', () => ({
  ProfileDropdown: () => <div data-testid="profile-dropdown" />,
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom'
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

// Stub fetchCams to avoid real network calls during onCompleted
vi.mock('../../../store/slices/camera-slice', async () => {
  const actual = await vi.importActual<
    typeof import('../../../store/slices/camera-slice')
  >('../../../store/slices/camera-slice');
  return {
    ...actual,
    fetchCams: vi.fn(() => ({ type: 'FETCH_CAMS_MOCK' })),
    camerasReducer: actual.camerasReducer,
  };
});

// Mock Apollo hooks so we can drive responses manually
let mockQueryData: Record<string, unknown> | null = null;
const mockUpdateFn = vi.fn();

vi.mock('@apollo/client', async () => {
  const actual =
    await vi.importActual<typeof import('@apollo/client')>('@apollo/client');
  return {
    ...actual,
    useQuery: vi.fn(() => ({ data: mockQueryData })),
    useMutation: vi.fn((_query, options) => {
      // Capture the options for this specific mutation call so onCompleted stays scoped
      const localOptions = options;
      const mutate = async (args: { variables: unknown }) => {
        const result = { data: { updateCam: true }, ...args } as const;
        localOptions?.onCompleted?.({ updateCam: true });
        return result;
      };
      mockUpdateFn.mockImplementationOnce(mutate);
      return [mockUpdateFn, { loading: false }];
    }),
  };
});

beforeEach(() => {
  mockQueryData = {
    cams: {
      fetch_data_by_filters_cams: {
        cams: [
          { cam_id: 2, cam_name: 'Another Cam' },
          { cam_id: 3, cam_name: 'Spare Cam' },
        ],
      },
    },
  };
  mockUpdateFn.mockClear();
});

describe('Camera Edit Form Tests', () => {
  const renderForm = (children: React.ReactNode) => {
    const FormComponent = () => {
      const methods = useForm<CameraFormValues>({
        resolver: zodResolver(cameraFormSchema),
        defaultValues: INITIAL_FORM_DATA,
        mode: 'onChange',
      });

      return <FormProvider {...methods}>{children}</FormProvider>;
    };

    return render(
      <MemoryRouter>
        <TestWrapper>
          <FormComponent />
        </TestWrapper>
      </MemoryRouter>
    );
  };

  const renderFormWithSubmit = (children: React.ReactNode) => {
    const FormComponent = () => {
      const methods = useForm<CameraFormValues>({
        resolver: zodResolver(cameraFormSchema),
        defaultValues: INITIAL_FORM_DATA,
        mode: 'onChange',
      });

      return (
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(() => undefined)}>
            {children}
            <button type="submit">Submit</button>
          </form>
        </FormProvider>
      );
    };

    return render(
      <MemoryRouter>
        <TestWrapper>
          <FormComponent />
        </TestWrapper>
      </MemoryRouter>
    );
  };

  const defaultCamera = {
    cam_hash: 'cam-hash-1',
    cam_id: 1,
    cam_name: 'Lobby Cam',
    cam_latitude: '40.0000',
    cam_longitude: '-70.0000',
    cam_placement_zone: 'Zone A',
    cam_placement_subzone: 'Sub A',
    cam_placement_zone_slot: 'Slot 1',
    cam_cloud_stream_id: 'stream-1',
    cam_ip: '192.168.0.10',
    cam_type: 'dome',
    cam_resolution: '1080p',
    cam_address1: '123 Main St',
    cam_city: 'NYC',
    cam_zipcode: '10001',
    camFpsSourceRate: '30',
    camThumbnailPath: '',
    cam_status: 'active',
    cam_tags: 'tag1,tag2',
  } as const;

  const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    const store = configureStore({
      reducer: {
        auth: authReducer,
        cameras: camerasReducer,
        timezone: timezoneReducer,
      },
      preloadedState: {
        auth: {
          user: {
            username: 'testuser',
            roles: ['Root Admin'],
            first_name: 'Test',
            last_name: 'User',
            user_hash: 'test-user-hash',
            cohort_hash: 'cohort-1',
            cohort_id: 1,
            user_id: 1,
          },
          userHash: 'test-user-hash',
          currentRoleCohortHash: 'cohort-1',
          availableRoles: [],
          isLoading: false,
          error: null,
        },
        cameras: {
          searchTerm: '',
          statusFilter: 'all' as const,
          currentPage: 1,
          itemsPerPage: 20,
          isAddCameraOpen: false,
          isDeleteDialogOpen: false,
          isEditDialogOpen: false,
          cameraToEdit: null,
          cameraToDelete: null,
          snackbar: { message: '', isOpen: false, variant: 'success' as const },
          cams: [],
          selectedCam: null,
          totalCount: 0,
          hasNext: false,
          loading: false,
          cameraLoading: false,
          error: null,
        },
        timezone: {
          selectedTimezone: {
            value: 'UTC-12',
            label: 'UTC-12 (-12:00)',
            iana: 'Etc/GMT+12',
            city: 'Baker Island',
          },
        },
      },
    });

    return (
      <Provider store={store}>
        <SearchProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </SearchProvider>
      </Provider>
    );
  };

  it('renders Step0General and Step1Location components', () => {
    renderForm(
      <>
        <Step0General />
        <Step1Location />
      </>
    );

    expect(
      screen.getByPlaceholderText(/Enter camera name/i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/40.7128/)).toBeInTheDocument();
  });

  it('shows validation error when camera name is cleared', async () => {
    renderForm(<Step0General />);

    const nameInput = screen.getByPlaceholderText(/Enter camera name/i);
    await userEvent.type(nameInput, 'test-name');
    await userEvent.clear(nameInput);
    await userEvent.tab();

    await waitFor(
      () => {
        expect(
          screen.getByText(/Camera name is required/i)
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('accepts valid camera name input', async () => {
    renderForm(<Step0General />);

    const nameInput = screen.getByPlaceholderText(
      /Enter camera name/i
    ) as HTMLInputElement;
    await userEvent.type(nameInput, 'My Camera');

    expect(nameInput.value).toBe('My Camera');
  });

  it('selects camera type and resolution', async () => {
    renderForm(<Step0General />);

    const [typeSelect, resolutionSelect] = screen.getAllByRole('combobox');

    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByText(/Dome Camera/i));

    await userEvent.click(resolutionSelect);
    await userEvent.click(screen.getByText(/1080p \(Full HD\)/i));

    expect(screen.getByText(/Dome Camera/i)).toBeInTheDocument();
    expect(screen.getByText(/1080p \(Full HD\)/i)).toBeInTheDocument();
  });

  it('requires cloud stream id', async () => {
    renderForm(<Step0General />);

    const cloudInput = screen.getByPlaceholderText(
      /Enter cloud stream identifier/i
    );
    await userEvent.type(cloudInput, 'temp');
    await userEvent.clear(cloudInput);
    await userEvent.tab();

    await waitFor(() => {
      expect(
        screen.getByText(/Cloud Stream ID is required/i)
      ).toBeInTheDocument();
    });
  });

  it('sanitizes IP input to allowed characters', async () => {
    renderForm(<Step0General />);

    const ipInput = screen.getByPlaceholderText(
      '192.168.1.100'
    ) as HTMLInputElement;
    await userEvent.type(ipInput, '192.168.0.1xyz!');

    await waitFor(() => {
      expect(ipInput.value).toBe('192.168.0.1');
    });
  });

  it('limits FPS to two digits', async () => {
    renderForm(<Step0General />);

    const fpsInput = screen.getByPlaceholderText('30') as HTMLInputElement;
    await userEvent.clear(fpsInput);
    await userEvent.type(fpsInput, '123');

    await waitFor(() => {
      expect(fpsInput.value).toBe('12');
    });
  });

  it('normalizes tags to 10 entries max', async () => {
    renderForm(<Step0General />);

    const tagsInput = screen.getByPlaceholderText(
      /Comma separated/i
    ) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(tagsInput, {
        target: {
          value:
            'tag1,tag2,tag3,tag4,tag5,tag6,tag7,tag8,tag9,tag10,tag11toolong,',
        },
      });
    });

    const el = await screen.findByDisplayValue(
      'tag1, tag2, tag3, tag4, tag5, tag6, tag7, tag8, tag9, tag10',
      { exact: true }
    );
    const tokens = (el as HTMLInputElement).value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    expect(tokens.length).toBe(10);
    expect(tokens.every((t) => t.length <= 15)).toBe(true);
  });

  it('shows validation for placement zone and latitude/longitude', async () => {
    const user = userEvent.setup({ delay: null });
    renderFormWithSubmit(<Step1Location />);

    const latInput = screen.getByPlaceholderText('40.7128');
    const longInput = screen.getByPlaceholderText('74.0060');
    const zoneInput = screen.getByPlaceholderText(/Enter placement zone/i);

    await user.type(latInput, '1');
    await user.clear(latInput);
    await user.tab();
    await user.type(longInput, '1');
    await user.clear(longInput);
    await user.tab();
    await user.type(zoneInput, 'temp');
    await user.clear(zoneInput);
    await user.tab();

    await user.click(screen.getByText('Submit'));

    const hasText = (text: string) => (content: string) =>
      content.toLowerCase().includes(text);

    expect(
      await screen.findByText(hasText('latitude is required'), {
        exact: false,
      })
    ).toBeInTheDocument();
    expect(
      await screen.findByText(hasText('longitude is required'), {
        exact: false,
      })
    ).toBeInTheDocument();
    expect(
      await screen.findByText(hasText('placement zone is required'), {
        exact: false,
      })
    ).toBeInTheDocument();
  });

  it('sanitizes city and postal code inputs', async () => {
    const user = userEvent.setup({ delay: null });
    renderForm(<Step1Location />);

    const cityInput = screen.getByPlaceholderText(
      /Enter city/i
    ) as HTMLInputElement;
    const zipInput = screen.getByPlaceholderText(
      /Enter postal code/i
    ) as HTMLInputElement;

    await user.type(cityInput, 'San Fr4ncisco!');
    await user.type(zipInput, '12a3456b');

    await waitFor(() => {
      expect(cityInput.value).toBe('San Frncisco');
      expect(zipInput.value).toBe('123456');
    });
  });

  it('enforces placement sub-zone and slot length limits', async () => {
    renderForm(<Step1Location />);

    const subZoneInput = screen.getByPlaceholderText(
      /Enter sub-zone/i
    ) as HTMLInputElement;
    const slotInput = screen.getByPlaceholderText(
      /Enter slot identifier/i
    ) as HTMLInputElement;

    await userEvent.type(subZoneInput, 'A'.repeat(50));
    await userEvent.type(slotInput, 'B'.repeat(50));

    expect(subZoneInput.value.length).toBeLessThanOrEqual(30);
    expect(slotInput.value.length).toBeLessThanOrEqual(30);
  });

  it('accepts street address input', async () => {
    renderForm(<Step1Location />);

    const addressInput = screen.getByPlaceholderText(
      /Enter street address/i
    ) as HTMLInputElement;

    await userEvent.type(addressInput, '456 Market Street');

    expect(addressInput.value).toBe('456 Market Street');
  });

  it('navigates back to live page on cancel or back button', async () => {
    mockNavigate.mockClear();

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/cameras/edit',
            state: {
              camera: defaultCamera,
              cohortHash: 'cohort-1',
              source: 'live-landing',
            },
          },
        ]}
      >
        <DirectionProvider>
          <LayoutProvider>
            <TestWrapper>
              <EditCameraPage />
            </TestWrapper>
          </LayoutProvider>
        </DirectionProvider>
      </MemoryRouter>
    );

    await userEvent.click(screen.getByText(/Back to Cameras/i));
    expect(mockNavigate).toHaveBeenCalledWith('/live?cohort=cohort-1');

    mockNavigate.mockClear();
    await userEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/live?cohort=cohort-1');
  });

  it('submits update and navigates back to live page', async () => {
    mockNavigate.mockClear();

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/cameras/edit',
            state: {
              camera: defaultCamera,
              cohortHash: 'cohort-1',
              source: 'live-landing',
            },
          },
        ]}
      >
        <DirectionProvider>
          <LayoutProvider>
            <TestWrapper>
              <EditCameraPage />
            </TestWrapper>
          </LayoutProvider>
        </DirectionProvider>
      </MemoryRouter>
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Update Camera/i })
    );

    await waitFor(() => {
      expect(mockUpdateFn).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/live?cohort=cohort-1');
    });
  });
});
