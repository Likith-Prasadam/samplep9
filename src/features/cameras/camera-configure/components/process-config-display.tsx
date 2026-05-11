import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProcessConfigDisplayProps {
  processConfig: Record<string, unknown>;
  isLoading?: boolean;
}

export const ProcessConfigDisplay: React.FC<ProcessConfigDisplayProps> = ({
  processConfig,
  isLoading = false,
}) => {
  const form = useFormContext();

  // Parse processConfig if it's a string
  let displayConfig = processConfig;
  if (typeof displayConfig === 'string') {
    try {
      displayConfig = JSON.parse(displayConfig);
    } catch {
      displayConfig = processConfig;
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading configuration...</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Form context not available</div>
      </div>
    );
  }

  if (
    !displayConfig ||
    Object.keys(displayConfig as Record<string, unknown>).length === 0
  ) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">
          No configuration settings available
        </div>
      </div>
    );
  }

  // Categorize fields
  const hashFields: [string, unknown][] = [];
  const otherFields: [string, unknown][] = [];

  Object.entries(displayConfig as Record<string, unknown>).forEach(
    ([key, value]) => {
      if (key.endsWith('_hash') || key === 'model_hash') {
        hashFields.push([key, value]);
      } else if (key === 'parameters' && typeof value === 'object') {
        // Parameters will be handled separately
      } else if (
        key.startsWith('selected') ||
        (typeof value === 'string' && value.match(/^[a-f0-9-]{36}$/))
      ) {
        hashFields.push([key, value]);
      } else {
        otherFields.push([key, value]);
      }
    }
  );

  const parametersObj = (displayConfig as Record<string, unknown>)
    .parameters as Record<string, unknown> | undefined;

  const renderField = (key: string, value: unknown) => {
    // Skip internal fields
    if (
      key.startsWith('_') ||
      key === 'id' ||
      value === null ||
      value === undefined
    ) {
      return null;
    }

    const fieldLabel = key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^./, (str) => str.toUpperCase());

    if (typeof value === 'boolean') {
      return (
        <FormField
          key={key}
          control={form.control}
          name={`processConfig.${key}`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-background shadow-sm hover:shadow-md transition-shadow">
              <FormLabel className="text-base font-medium cursor-pointer">
                {fieldLabel}
              </FormLabel>
              <FormControl>
                <Switch
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
            </FormItem>
          )}
        />
      );
    }

    if (typeof value === 'number') {
      return (
        <FormField
          key={key}
          control={form.control}
          name={`processConfig.${key}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{fieldLabel}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={fieldLabel}
                  {...field}
                  disabled={isLoading}
                  value={field.value || ''}
                  step="0.01"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    // Default string handling
    return (
      <FormField
        key={key}
        control={form.control}
        name={`processConfig.${key}`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{fieldLabel}</FormLabel>
            <FormControl>
              <Input
                placeholder={fieldLabel}
                {...field}
                disabled={isLoading}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Key Parameters Highlight - Show Temperature and Max Tokens prominently */}
      {parametersObj &&
        (parametersObj.temperature !== undefined ||
          parametersObj.max_tokens !== undefined) && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Key Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {parametersObj.temperature !== undefined && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">
                      Temperature
                    </p>
                    <p className="text-2xl font-semibold">
                      {String(parametersObj.temperature)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Controls randomness (0-2)
                    </p>
                  </div>
                )}
                {parametersObj.max_tokens !== undefined && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">
                      Max Response Length
                    </p>
                    <p className="text-2xl font-semibold">
                      {String(parametersObj.max_tokens)}
                    </p>
                    <p className="text-xs text-muted-foreground">tokens</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Parameters Section */}
      {parametersObj && Object.keys(parametersObj).length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span>Parameters</span>
                <Badge variant="outline" className="text-xs font-normal">
                  {Object.keys(parametersObj).length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(parametersObj).map(([key, value]) => {
                  const fieldLabel = key
                    .replace(/_/g, ' ')
                    .replace(/([A-Z])/g, ' $1')
                    .trim()
                    .replace(/^./, (str) => str.toUpperCase());

                  // Skip hash-like parameters here since they're shown separately
                  if (key.endsWith('_hash') || key.startsWith('selected')) {
                    return null;
                  }

                  // Skip temperature and max_tokens as they're highlighted above
                  if (key === 'temperature' || key === 'max_tokens') {
                    return null;
                  }

                  if (typeof value === 'number') {
                    return (
                      <FormField
                        key={key}
                        control={form.control}
                        name={`processConfig.parameters.${key}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">
                              {fieldLabel}
                            </FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  placeholder={fieldLabel}
                                  {...field}
                                  disabled={isLoading}
                                  value={field.value || ''}
                                  step="0.01"
                                  className="flex-1"
                                />
                                <span className="text-sm text-muted-foreground">
                                  {value}
                                </span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  }

                  if (typeof value === 'boolean') {
                    return (
                      <FormField
                        key={key}
                        control={form.control}
                        name={`processConfig.parameters.${key}`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-background shadow-sm">
                            <FormLabel className="font-semibold cursor-pointer">
                              {fieldLabel}
                            </FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                                disabled={isLoading}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    );
                  }

                  return (
                    <FormField
                      key={key}
                      control={form.control}
                      name={`processConfig.parameters.${key}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">
                            {fieldLabel}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={fieldLabel}
                              {...field}
                              disabled={isLoading}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Prompt Selections */}
          {parametersObj.selectedSystemPrompt ||
          parametersObj.selectedUserPrompt ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prompt Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {parametersObj.selectedSystemPrompt ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      System Prompt
                    </p>
                    <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                      {String(parametersObj.selectedSystemPrompt)}
                    </p>
                  </div>
                ) : null}
                {parametersObj.selectedUserPrompt ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      User Prompt
                    </p>
                    <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                      {String(parametersObj.selectedUserPrompt)}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </>
      )}

      {/* Other Fields Section */}
      {otherFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span>Additional Settings</span>
              <Badge variant="outline" className="text-xs font-normal">
                {otherFields.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {otherFields.map(([key, value]) => renderField(key, value))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
