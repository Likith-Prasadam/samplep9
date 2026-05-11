import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import { enableMapSet } from 'immer';
import counterReducer from './slices/example-counter-slice';
import authReducer from './slices/auth-slice';
import usersReducer from './slices/users-slice';
import { camerasReducer } from './slices/camera-slice';
import notificationsReducer from './slices/notifications-slice';
import promptConfigurationReducer from './slices/prompt-configuration-slice';
import modelConfigurationReducer from './slices/model-configuration-slice';
import eventConfigurationReducer from './slices/event-configuration-slice';
import profileReducer from './slices/profile-slice';
import civilSuppliesReducer from './slices/civil-supplies-slice';
import detentionPanelReducer from './slices/detention-panel-slice';
import dashboardNavigationReducer from './slices/dashboard-navigation-slice';

enableMapSet();
import demoVideosReducer from './slices/demo-videos-slice';

import apolloClient from '@/lib/apollo-client';
import batchVideosReducer from './slices/playground-slice';
import liveStreamReducer from './slices/live-stream-slice';
import orgCohortsReducer from './slices/org-cohorts-slice';
import workflowReducer from './slices/workflow-slice';
import timezoneReducer from './slices/timezone-slice';
import connectedIntelligenceReducer from './slices/connected-intelligence-slice';
import chatPanelsReducer from './slices/chat-panel-slice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
    users: usersReducer,
    cameras: camerasReducer,
    notifications: notificationsReducer,
    promptConfiguration: promptConfigurationReducer,
    modelConfiguration: modelConfigurationReducer,
    eventConfiguration: eventConfigurationReducer,
    demoVideos: demoVideosReducer,
    profile: profileReducer,
    batchVideos: batchVideosReducer,
    civilSupplies: civilSuppliesReducer,
    detentionPanel: detentionPanelReducer,
    liveStream: liveStreamReducer,
    dashboardNavigation: dashboardNavigationReducer,
    orgCohorts: orgCohortsReducer,
    workflow: workflowReducer,
    timezone: timezoneReducer,
    connectedIntelligence: connectedIntelligenceReducer,
    chatPanels: chatPanelsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'notifications/setViewedNotifications',
          'notifications/markAsViewed',
          'notifications/markAllAsRead',
        ],
        ignoredPaths: [
          'notifications.viewedNotifications',
          'notifications.unreadCameraIds',
        ],
      },
      thunk: {
        extraArgument: { apolloClient },
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
