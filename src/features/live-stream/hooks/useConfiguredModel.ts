import { useQuery } from '@apollo/client';
import { useState } from 'react';
import {
  GET_CAM_PROCESS_CONFIGS,
  GET_CAM_PROCESS_CONFIG,
} from '@/graphql/camera-process-config-queries';
import { GET_ORG_MODEL_BY_HASH } from '@/graphql/workflow_queries';
import type { Camera } from '@/features/cameras/camera-list/types/cameras';
import { logger } from '@/utils/logger';

interface ConfiguredModel {
  modelHash: string;
  modelIdentifier: string;
  modelName: string;
  modelProvider: string;
  isLoading: boolean;
}

/**
 * Hook to fetch the configured model from camera configuration
 * This runs automatically when a camera is provided
 */
export const useConfiguredModel = (camera: Camera | null): ConfiguredModel => {
  const [modelHash, setModelHash] = useState<string>('');
  const [modelIdentifier, setModelIdentifier] = useState<string>('');
  const [modelName, setModelName] = useState<string>('');
  const [modelProvider, setModelProvider] = useState<string>('');
  const [modelHashToFetch, setModelHashToFetch] = useState<string>('');
  const [configHashToFetch, setConfigHashToFetch] = useState<string>('');

  // Fetch all configs for the camera
  const { loading: configsLoading } = useQuery(GET_CAM_PROCESS_CONFIGS, {
    variables: { cam_hash: camera?.cam_hash || '' },
    skip: !camera?.cam_hash,
    onCompleted: (data) => {
      const configs = data?.getCamProcessConfigs || [];
      logger.debug('[useConfiguredModel] Configs loaded:', {
        count: configs.length,
        camera: camera?.cam_hash,
      });
      if (configs.length > 0) {
        const firstConfig = configs[0];
        setConfigHashToFetch(firstConfig.camProcessConfigHash as string);
      } else {
        logger.warn(
          '[useConfiguredModel] No configs found for camera:',
          camera?.cam_hash
        );
      }
    },
    onError: (error) => {
      logger.error('[useConfiguredModel] Error loading configs:', error);
    },
  });

  // Fetch the detailed config to get model hash
  const { loading: detailedLoading } = useQuery(GET_CAM_PROCESS_CONFIG, {
    variables: { cam_process_config_hash: configHashToFetch },
    skip: !configHashToFetch,
    onCompleted: (data) => {
      const detailedConfig = data?.getCamProcessConfig;
      if (detailedConfig) {
        let parsedConfig: Record<string, unknown> =
          detailedConfig.processConfig;

        if (typeof parsedConfig === 'string') {
          try {
            parsedConfig = JSON.parse(parsedConfig);
          } catch {
            parsedConfig = {};
          }
        }

        const extractedModelHash =
          parsedConfig?.model_hash || parsedConfig?.modelHash;
        const extractedModelIdentifier =
          (parsedConfig?.modelIdentifier as string) || '';
        const extractedModelName = (parsedConfig?.modelName as string) || '';
        const extractedModelProvider =
          (parsedConfig?.modelProvider as string) || '';

        logger.debug('[useConfiguredModel] Config loaded:', {
          extractedModelHash,
          extractedModelIdentifier,
          extractedModelName,
          extractedModelProvider,
          configHash: configHashToFetch,
        });

        if (extractedModelHash && typeof extractedModelHash === 'string') {
          setModelHash(extractedModelHash);
          setModelIdentifier(extractedModelIdentifier);
          setModelName(extractedModelName);
          setModelProvider(extractedModelProvider);

          // If modelIdentifier is missing, fetch it from the backend using the modelHash
          if (!extractedModelIdentifier) {
            logger.warn(
              '[useConfiguredModel] Model identifier missing, will fetch from backend'
            );
            setModelHashToFetch(extractedModelHash);
          }

          logger.debug('[useConfiguredModel] Model data set:', {
            hash: extractedModelHash,
            identifier: extractedModelIdentifier,
            name: extractedModelName,
            provider: extractedModelProvider,
          });
        } else {
          logger.warn('[useConfiguredModel] No model hash found in config:', {
            extractedModelHash,
            parsedConfig,
          });
        }
      }
    },
    onError: (error) => {
      logger.error(
        '[useConfiguredModel] Error loading detailed config:',
        error
      );
    },
  });

  // Fetch model details by hash if identifier is missing
  const { loading: modelLoading } = useQuery(GET_ORG_MODEL_BY_HASH, {
    variables: { modelHash: modelHashToFetch },
    skip: !modelHashToFetch,
    onCompleted: (data) => {
      const model = data?.getOrgModelByHash;
      if (model && !modelIdentifier) {
        logger.debug(
          '[useConfiguredModel] Fetched model details from backend:',
          {
            modelHash: model.modelHash,
            modelIdentifier: model.modelIdentifier,
            modelName: model.modelName,
            modelProvider: model.modelProvider,
          }
        );

        // Update with fetched model data
        setModelIdentifier(model.modelIdentifier || '');
        if (model.modelName) setModelName(model.modelName);
        if (model.modelProvider) setModelProvider(model.modelProvider);
      }
    },
    onError: (error) => {
      logger.error('[useConfiguredModel] Error fetching model details:', error);
    },
  });

  return {
    modelHash,
    modelIdentifier,
    modelName,
    modelProvider,
    isLoading: configsLoading || detailedLoading || modelLoading,
  };
};
