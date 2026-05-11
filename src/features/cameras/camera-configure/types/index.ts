export interface ProcessConfig extends Record<string, unknown> {
  camProcessConfigHash: string;
  orgProcessName?: string;
  orgProcessHash?: string;
  isEnabled: boolean;
}
