import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building,
  Factory,
  Stethoscope,
  HardHat,
  Truck,
  Banknote,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Main } from '@/components/layouts/main';
import type { UseCase } from './types';
import image1 from '@/assets/file.svg';
import image2 from '@/assets/image2.svg';
import image3 from '@/assets/image3.svg';
import image4 from '@/assets/image4.svg';
import image5 from '@/assets/scl.svg';
import image6 from '@/assets/sb.svg';

const UseCaseCard = memo(
  ({
    useCase,
    onCardClick,
  }: {
    useCase: UseCase;
    onCardClick: (slug: string) => void;
  }) => {
    const handleClick = useCallback(() => {
      onCardClick(useCase.slug);
    }, [useCase.slug, onCardClick]);
    return (
      <Card className="group w-full max-w-sm h-[370px] rounded-lg shadow-sm hover:shadow-md will-change-transform overflow-hidden border-0 p-0">
        <div className="relative w-full h-48 overflow-hidden rounded-t-lg bg-card">
          <img
            src={useCase.image}
            alt={useCase.name}
            className="absolute inset-0 object-cover w-full h-full transform-gpu group-hover:scale-105"
            loading="eager"
            style={{ transition: 'transform 0.3s ease-out' }}
          />
        </div>
        <CardHeader className="flex flex-col bg-card rounded-b-lg">
          <div className="flex items-center gap-3 w-full">
            <div className="rounded-full flex-shrink-0">{useCase.icon}</div>

            <Tooltip>
              <TooltipTrigger asChild>
                <CardTitle
                  className="
          text-xl font-semibold leading-tight 
          truncate overflow-hidden whitespace-nowrap 
          max-w-[280px]
        "
                >
                  {useCase.name}
                </CardTitle>
              </TooltipTrigger>

              <TooltipContent side="top">
                <p>{useCase.name}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-3 mt-1 leading-tight m-0">
            {useCase.content}
          </p>
          <Button
            className="w-full font-medium rounded-md py-1 mt-1 mb-0"
            onClick={handleClick}
          >
            View Videos
          </Button>
        </CardHeader>
      </Card>
    );
  }
);

UseCaseCard.displayName = 'UseCaseCard';

const useCases: UseCase[] = [
  {
    name: 'Smart Cities',
    slug: 'smart_cities',
    content:
      'Utilizing AI and IoT for real-time traffic monitoring, incident detection, and emergency response to enhance urban safety and efficiency.',
    icon: <Building className="w-6 h-6" />,
    image: image1,
  },
  {
    name: 'Smart Manufacturing',
    slug: 'smart_manufacturing',
    content:
      'AI-driven analytics for predictive maintenance, quality control, and real-time production monitoring to minimize downtime and enhance efficiency.',
    icon: <Factory className="w-6 h-6" />,
    image: image2,
  },
  {
    name: 'Smart Healthcare',
    slug: 'smart_healthcare',
    content:
      'Real-time patient monitoring, AI-assisted diagnostics, and incident detection for improved healthcare response and operational efficiency.',
    icon: <Stethoscope className="w-6 h-6" />,
    image: image3,
  },
  {
    name: 'Smart Construction',
    slug: 'smart_construction',
    content:
      'Live tracking of site activities, safety compliance monitoring, and predictive analytics for hazard detection and risk mitigation.',
    icon: <HardHat className="w-6 h-6" />,
    image: image4,
  },
  {
    name: 'Smart Supply Chain & Logistics',
    slug: 'smart-supply-chain-logistics',
    content:
      'AI-powered tracking analytics, and automated surveillance to optimize inventory management and mitigate risks across the supply chain.',
    icon: <Truck className="w-6 h-6" />,
    image: image5,
  },
  {
    name: 'Smart Banking',
    slug: 'smart-banking',
    content:
      'AI-driven surveillance for proactive risk management, fraud detection, and operational efficiency in modern banking.',
    icon: <Banknote className="w-6 h-6" />,
    image: image6,
  },
];

function DemoVideosPage() {
  const navigate = useNavigate();
  const handleCardClick = useCallback(
    (slug: string) => {
      navigate(`/demo-videos/${slug}`);
    },
    [navigate]
  );
  return (
    <div className="flex flex-col rounded-2xl h-full">
      <Header fixed>
        <SearchField />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <TimezoneDropdown />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main fixed className="flex-1 overflow-y-auto pl-25 pr-25 scroll-smooth">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Video Playground
          </h1>
          <p className="text-muted-foreground mt-2">
            Process and analyze videos with AI-powered insights
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
          {useCases.map((useCase) => (
            <UseCaseCard
              key={useCase.slug}
              useCase={useCase}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </Main>
    </div>
  );
}

export default memo(DemoVideosPage);
