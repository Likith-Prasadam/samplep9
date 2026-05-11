import { lazy, Suspense, useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
} from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { Toaster } from 'sonner';
import { store } from './store';
import { ApolloProviderWrapper } from './providers/query-provider';
import { LayoutProvider } from './providers/layout-provider';
import { DirectionProvider } from './providers/direction-provider';
import { ThemeProvider } from './providers/theme-provider';
import { UsersProvider } from './providers/users-provider';
import { SidebarProvider } from './components/ui/sidebar';
import { CameraProvider } from './providers/cameras-provider';
import { NotificationProvider } from './providers/notifications-provider';
import Dashboard from './features/dashboard';
import { jwtDecode } from 'jwt-decode';
import type { JwtPayload } from './features/login/types/types';
import { AppSidebar } from './components/layouts/app-sidebar';
import { UserContext, type UserData } from '@/context/user-context';
import { gql } from '@apollo/client';
import { useQuery as useApolloQuery } from '@apollo/client/react';
import { SearchProvider } from './providers/search-provider';
import { usePermissions } from '@/hooks/use-permissions';
import Users from './features/users';
import UserAddPage from '@/features/users/pages/user-add-page';
import PlaygroundList from './features/playground';
const UploadVideoPage = lazy(
  () => import('./features/playground/playground-upload-page')
);
import Apps from './features/apps';
import AiAssistant from './features/ai-assistant';
import SmartManufacturing from './features/dashboard/smart-manufacturing';

import LoginPage from '@/features/login';
const RoleSelectionPage = lazy(
  () => import('@/features/login/pages/role-selection')
);
const MicrosoftCallbackPage = lazy(
  () => import('@/features/login/pages/microsoft-callback')
);
const CamerasList = lazy(() => import('@/features/cameras/camera-list'));
const LiveLandingPage = lazy(
  () => import('@/features/live-stream/live-landing')
);
const AddCameraPage = lazy(() => import('@/features/cameras/camera-add'));
const EditCameraPage = lazy(() => import('@/features/cameras/camera-edit'));
const LiveStreamPage = lazy(() => import('@/features/live-stream'));
const ConnectedIntelligencePage = lazy(
  () => import('@/features/connected-intelligence')
);
const NotificationsPage = lazy(() => import('@/features/notifications'));
const NotificationToast = lazy(
  () => import('@/features/notifications/components/notification-toast')
);
const PromptConfiguration = lazy(
  () => import('@/features/configuration/prompt-configuration')
);
const PromptVersionsPage = lazy(
  () =>
    import(
      '@/features/configuration/prompt-configuration/pages/prompt-versions-page'
    )
);
const ModelConfiguration = lazy(
  () => import('@/features/configuration/model-configuration')
);
const EventConfiguration = lazy(
  () => import('@/features/configuration/event-configuration')
);
const DemoVideosPage = lazy(() => import('@/features/demo-videos'));
const VideoPlayground = lazy(
  () => import('@/features/demo-videos/video-playground')
);
const DemoChatInterface = lazy(
  () => import('@/features/demo-videos/demo-chat')
);
const ProfileSettings = lazy(() => import('@/features/settings/profile'));
const DetentionPanel = lazy(() => import('@/features/apps/detention-panel'));
const MainDashboard = lazy(() => import('@/features/dashboard/main-dashboard'));
const OverviewDashboard = lazy(() => import('@/features/dashboard/overview'));

const DetentionPanelDashboard = lazy(
  () => import('@/features/dashboard/detention-panel')
);

// Organization Cohorts
const OrgCohorts = lazy(() => import('@/features/org-cohorts'));

// ✅ ADD THIS: Import the batch video chat component
const BatchVideoChat = lazy(
  () => import('@/features/playground/components/playground-chat')
);

// ✅ NEW: Import workflow components
const PromptLibrary = lazy(() => import('@/features/workflows/prompt-library'));
const ProcessCatalog = lazy(
  () => import('@/features/workflows/process-catalog')
);
const ConfigurationBuilder = lazy(
  () => import('@/features/workflows/configuration-builder')
);

const AguiWebchatPrototypePage = lazy(
  () => import('@/features/prototypes/agui-webchat')
);

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded.exp) return false;
    return Date.now() < decoded.exp * 1000;
  } catch {
    return false;
  }
}

interface GetOrgCohortsByIdQuery {
  org_cohorts?: {
    fetch_data_by_filters_orgcohorts?: {
      org_cohorts?: Array<{
        is_root: boolean;
        is_general: boolean;
      }>;
    };
  };
}

const GET_ORG_COHORTS_BY_ID = gql`
  query GetOrgCohortsById($id: Int!) {
    org_cohorts {
      fetch_data_by_filters_orgcohorts(input_json: { id: $id }) {
        org_cohorts {
          is_root
          is_general
        }
      }
    }
  }
`;

function RequireAuth() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsAuthenticated(false);
      navigate('/login', { replace: true });
      return;
    }

    if (!isTokenValid(token)) {
      setIsAuthenticated(false);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_hash');
      navigate('/login', { replace: true });
      return;
    }

    setIsAuthenticated(true);
  }, [navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading authentication...
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : null;
}

function ProtectedLayout() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser && Object.keys(storedUser).length > 0) {
          console.log('Loading user from storage:', storedUser);
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
      }
    };

    loadUserFromStorage();

    window.addEventListener('user-logged-in', loadUserFromStorage);

    // Also listen for storage changes (e.g., from another tab)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'user') {
        loadUserFromStorage();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('user-logged-in', loadUserFromStorage);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const { data: cohortData } = useApolloQuery<GetOrgCohortsByIdQuery>(
    GET_ORG_COHORTS_BY_ID,
    {
      variables: { id: Number(user?.cohort_id) },
      skip: !user?.cohort_id || user?.is_root !== undefined,
    }
  );

  useEffect(() => {
    if (
      cohortData?.org_cohorts?.fetch_data_by_filters_orgcohorts
        ?.org_cohorts?.[0]
    ) {
      const orgData =
        cohortData.org_cohorts.fetch_data_by_filters_orgcohorts.org_cohorts[0];
      if (user) {
        const updatedUser: UserData = {
          ...user,
          is_root: orgData.is_root,
          is_general: orgData.is_general,
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
  }, [cohortData, user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <SearchProvider>
        <LayoutProvider>
          <UsersProvider>
            <CameraProvider>
              <SidebarProvider>
                <div className="flex h-screen w-full bg-background text-foreground">
                  <AppSidebar />
                  <main className="flex-1 overflow-y-auto">
                    <Outlet />
                  </main>
                </div>
              </SidebarProvider>
            </CameraProvider>
          </UsersProvider>
        </LayoutProvider>
      </SearchProvider>
    </UserContext.Provider>
  );
}

function AppInitializer() {
  return null;
}

function RequireRootOnlyFeature() {
  const { isRootAdmin, isRootUser } = usePermissions();
  const canAccessRootOnlyFeatures = isRootAdmin || isRootUser;
  return canAccessRootOnlyFeatures ? <Outlet /> : <Navigate to="/" replace />;
}

function RequireDashboardAccess() {
  const { selectedRole } = usePermissions();
  const canAccessDashboard =
    selectedRole === 'ROOT_ADMIN' || selectedRole === 'ROOT_USER';
  return canAccessDashboard ? (
    <Outlet />
  ) : (
    <Navigate to="/playground" replace />
  );
}

function App() {
  return (
    <Provider store={store}>
      <ApolloProviderWrapper>
        <Router>
          <DirectionProvider>
            <ThemeProvider>
              <SnackbarProvider maxSnack={3}>
                <Toaster richColors position="bottom-center" />

                <NotificationProvider>
                  <Suspense fallback={<div />}>
                    <NotificationToast />
                  </Suspense>

                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center min-h-screen">
                        Loading...
                      </div>
                    }
                  >
                    <AppInitializer />
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/login" element={<LoginPage />} />
                      <Route
                        path="/role-selection"
                        element={<RoleSelectionPage />}
                      />
                      <Route
                        path="/auth/microsoft/callback"
                        element={<MicrosoftCallbackPage />}
                      />

                      {/* Protected Routes */}
                      <Route element={<RequireAuth />}>
                        <Route element={<ProtectedLayout />}>
                          <Route
                            index
                            element={<Navigate to="/playground" replace />}
                          />
                          <Route element={<RequireDashboardAccess />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route
                              path="/dashboard/overview"
                              element={<OverviewDashboard />}
                            />
                            <Route
                              path="/dashboard/main"
                              element={<MainDashboard />}
                            />
                            <Route
                              path="/dashboard/detention-panel"
                              element={<DetentionPanelDashboard />}
                            />
                            <Route
                              path="/dashboard/smart-manufacturing"
                              element={<SmartManufacturing />}
                            />
                          </Route>
                          <Route path="/users" element={<Users />} />
                          <Route path="/users/add" element={<UserAddPage />} />
                          <Route path="/org-cohorts" element={<OrgCohorts />} />

                          <Route path="/live" element={<LiveLandingPage />} />
                          <Route path="/cameras" element={<CamerasList />} />
                          <Route
                            path="/connected-intelligence"
                            element={<ConnectedIntelligencePage />}
                          />
                          <Route
                            path="/playground"
                            element={<PlaygroundList />}
                          />
                          <Route
                            path="/playground/"
                            element={<PlaygroundList />}
                          />
                          <Route
                            path="/playground/upload"
                            element={<UploadVideoPage />}
                          />

                          <Route
                            path="/playground/chat/:videoId"
                            element={<BatchVideoChat />}
                          />

                          <Route
                            path="/cameras/add"
                            element={<AddCameraPage />}
                          />
                          <Route
                            path="/cameras/edit"
                            element={<EditCameraPage />}
                          />
                          <Route
                            path="/cameras/:cameraName"
                            element={<LiveStreamPage />}
                          />
                          <Route
                            path="/live/:cameraName"
                            element={<LiveStreamPage />}
                          />
                          <Route
                            path="/notifications"
                            element={<NotificationsPage />}
                          />
                          <Route
                            path="/configuration/prompt-configuration"
                            element={<PromptConfiguration />}
                          />
                          <Route
                            path="/configuration/prompt-configuration/versions/:promptHash"
                            element={<PromptVersionsPage />}
                          />
                          <Route
                            path="/configuration/model-configuration"
                            element={<ModelConfiguration />}
                          />
                          <Route
                            path="/configuration/events"
                            element={<EventConfiguration />}
                          />

                          {/* Workflow Routes */}
                          <Route
                            path="/workflows/prompts"
                            element={<PromptLibrary />}
                          />
                          <Route
                            path="/workflows/catalog"
                            element={<ProcessCatalog />}
                          />
                          <Route
                            path="/workflows/configure/:processHash"
                            element={<ConfigurationBuilder />}
                          />

                          <Route element={<RequireRootOnlyFeature />}>
                            <Route
                              path="/demo-videos"
                              element={<DemoVideosPage />}
                            />
                            <Route
                              path="/demo-videos/:slug"
                              element={<VideoPlayground />}
                            />
                            <Route
                              path="/demo-videos/:slug/chat"
                              element={<DemoChatInterface />}
                            />
                            <Route
                              path="/chat-page"
                              element={<AiAssistant />}
                            />
                          </Route>
                          <Route
                            path="/settings/profile"
                            element={<ProfileSettings />}
                          />
                          <Route
                            path="/settings/account"
                            element={
                              <Navigate to="/settings/profile" replace />
                            }
                          />
                          <Route
                            path="/settings/appearance"
                            element={
                              <Navigate to="/settings/profile" replace />
                            }
                          />
                          <Route
                            path="/settings/notifications"
                            element={
                              <Navigate to="/settings/profile" replace />
                            }
                          />
                          <Route
                            path="/settings/display"
                            element={
                              <Navigate to="/settings/profile" replace />
                            }
                          />
                          <Route path="/apps" element={<Apps />} />
                          <Route
                            path="/apps/detention-panel"
                            element={<DetentionPanel />}
                          />

                          <Route
                            path="/prototype/agui-webchat"
                            element={<AguiWebchatPrototypePage />}
                          />
                        </Route>
                      </Route>

                      {/* Fallback */}
                      <Route
                        path="*"
                        element={<Navigate to="/login" replace />}
                      />
                    </Routes>
                  </Suspense>
                </NotificationProvider>
              </SnackbarProvider>
            </ThemeProvider>
          </DirectionProvider>
        </Router>
      </ApolloProviderWrapper>
    </Provider>
  );
}

export default App;
