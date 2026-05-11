'use client';

import {
  Battery,
  Box,
  ChevronDown,
  Cpu,
  HardDrive,
  Monitor,
  Wifi,
} from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

interface Spec {
  label: string;
  value: string;
}

interface SpecCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  specs: Spec[];
}

const DEFAULT_CATEGORIES: SpecCategory[] = [
  {
    id: 'display',
    name: 'Display',
    icon: <Monitor className="size-4" />,
    specs: [
      { label: 'Screen Size', value: '6.7" Super Retina XDR' },
      { label: 'Resolution', value: '2796 x 1290 pixels' },
      { label: 'Pixel Density', value: '460 ppi' },
      { label: 'Refresh Rate', value: '1-120Hz ProMotion' },
      { label: 'Display Type', value: 'OLED, HDR' },
      { label: 'Peak Brightness', value: '2000 nits (outdoor)' },
    ],
  },
  {
    id: 'performance',
    name: 'Performance',
    icon: <Cpu className="size-4" />,
    specs: [
      { label: 'Processor', value: 'A17 Pro chip' },
      { label: 'CPU Cores', value: '6-core (2 performance + 4 efficiency)' },
      { label: 'GPU', value: '6-core GPU' },
      { label: 'Neural Engine', value: '16-core' },
      { label: 'RAM', value: '8GB' },
    ],
  },
  {
    id: 'storage',
    name: 'Storage',
    icon: <HardDrive className="size-4" />,
    specs: [
      { label: 'Internal Storage', value: '256GB / 512GB / 1TB' },
      { label: 'Expandable', value: 'No' },
      { label: 'Cloud Storage', value: 'iCloud (5GB free)' },
    ],
  },
  {
    id: 'battery',
    name: 'Battery & Charging',
    icon: <Battery className="size-4" />,
    specs: [
      { label: 'Battery Capacity', value: '4422 mAh' },
      { label: 'Video Playback', value: 'Up to 29 hours' },
      { label: 'Streaming', value: 'Up to 25 hours' },
      { label: 'Wired Charging', value: '27W fast charging' },
      { label: 'Wireless Charging', value: '15W MagSafe, 7.5W Qi' },
      { label: 'Reverse Charging', value: 'No' },
    ],
  },
  {
    id: 'connectivity',
    name: 'Connectivity',
    icon: <Wifi className="size-4" />,
    specs: [
      { label: '5G', value: 'Yes (sub-6 GHz, mmWave)' },
      { label: 'Wi-Fi', value: 'Wi-Fi 6E (802.11ax)' },
      { label: 'Bluetooth', value: '5.3' },
      { label: 'NFC', value: 'Yes' },
      { label: 'USB', value: 'USB-C 3.0 (10Gb/s)' },
      { label: 'Satellite', value: 'Emergency SOS' },
    ],
  },
  {
    id: 'physical',
    name: 'Physical Specifications',
    icon: <Box className="size-4" />,
    specs: [
      { label: 'Height', value: '159.9 mm' },
      { label: 'Width', value: '76.7 mm' },
      { label: 'Depth', value: '8.25 mm' },
      { label: 'Weight', value: '221 g' },
      { label: 'Build', value: 'Titanium frame, ceramic shield' },
      { label: 'Water Resistance', value: 'IP68 (6m for 30 min)' },
    ],
  },
];

interface ProductSpecs1Props {
  categories?: SpecCategory[];
  title?: string;
  className?: string;
}

const ProductSpecs1 = ({
  categories = DEFAULT_CATEGORIES,
  title = 'Technical Specifications',
  className,
}: ProductSpecs1Props) => {
  const [openCategories, setOpenCategories] = useState<string[]>(
    categories.map((c) => c.id)
  );

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const expandAll = () => setOpenCategories(categories.map((c) => c.id));
  const collapseAll = () => setOpenCategories([]);

  return (
    <section className={cn('py-16 md:py-24', className)}>
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {title}
          </h2>
          <div className="flex gap-2 text-sm">
            <button
              onClick={expandAll}
              className="text-muted-foreground hover:text-foreground"
            >
              Expand all
            </button>
            <span className="text-muted-foreground">·</span>
            <button
              onClick={collapseAll}
              className="text-muted-foreground hover:text-foreground"
            >
              Collapse all
            </button>
          </div>
        </div>

        {/* Spec Categories */}
        <div className="space-y-4">
          {categories.map((category) => (
            <Collapsible
              key={category.id}
              open={openCategories.includes(category.id)}
              onOpenChange={() => toggleCategory(category.id)}
            >
              <div className="rounded-lg border">
                <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                      {category.icon}
                    </div>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'size-5 text-muted-foreground transition-transform',
                      openCategories.includes(category.id) && 'rotate-180'
                    )}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t">
                    <Table>
                      <TableBody>
                        {category.specs.map((spec, index) => (
                          <TableRow
                            key={index}
                            className="hover:bg-transparent"
                          >
                            <TableCell className="w-1/2 py-3 text-muted-foreground">
                              {spec.label}
                            </TableCell>
                            <TableCell className="py-3 font-medium">
                              {spec.value}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      </div>
    </section>
  );
};

export { ProductSpecs1 };
