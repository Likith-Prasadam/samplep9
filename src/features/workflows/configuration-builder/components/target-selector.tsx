import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

interface TargetSelectorProps {
  targetType: 'camera' | 'batch';
  targetHash: string;
  onTargetTypeChange: (type: 'camera' | 'batch') => void;
  onTargetHashChange: (hash: string) => void;
}

export function TargetSelector({
  targetType,
  targetHash,
  onTargetTypeChange,
  onTargetHashChange,
}: TargetSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Target</CardTitle>
        <CardDescription>Choose where this workflow should run</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={targetType}
          onValueChange={(v) => onTargetTypeChange(v as 'camera' | 'batch')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="camera">Camera</TabsTrigger>
            <TabsTrigger value="batch">Batch Video</TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="camera_hash">Camera Hash</Label>
              <Input
                id="camera_hash"
                placeholder="Enter camera hash..."
                value={targetHash}
                onChange={(e) => onTargetHashChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the hash identifier for the target camera
              </p>
            </div>
          </TabsContent>

          <TabsContent value="batch" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch_hash">Batch Video Hash</Label>
              <Input
                id="batch_hash"
                placeholder="Enter batch video hash..."
                value={targetHash}
                onChange={(e) => onTargetHashChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the hash identifier for the target batch video
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
