import {
  LayoutDashboard,
  Cctv,
  Upload,
  // Sparkles,
  Eye,
  Users,
  Sparkles,
  BellRing,
  SquarePlay,
  // Package,
  // HardHat,
} from 'lucide-react';
import type { SidebarData } from '../types';

export const sidebarData: SidebarData = {
  user: {
    name: 'User',
    email: 'user@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'SPECTRA',
      logo: Eye,
      plan: 'A product of Parabola9',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'Users',
          url: '/users',
          icon: Users,
        },
        // {
        //   title: 'Organization Cohorts',
        //   url: '/org-cohorts',
        //   icon: Building2,
        // },
        {
          title: 'Live',
          url: '/live',
          icon: Cctv,
        },
        {
          title: 'Playground',
          url: '/playground',
          icon: Upload,
        },
        {
          title: 'AI Assistant',
          url: '/chat-page',
          icon: Sparkles,
        },
        {
          title: 'Alerts',
          url: '/notifications',
          icon: BellRing,
        },
        // {
        //   title: 'Smart Manufacturing',
        //   url: '/smart-manufacturing',
        //   icon: HardHat,
        // },
        {
          title: 'Demo',
          url: '/demo-videos',
          icon: SquarePlay,
        },
        // {
        //   title: 'Agentic Workflow',
        //   url: '/agentic-workflows',
        //   icon: GitBranch,
        // },
        // {
        //   title: 'Apps',
        //   url: '/apps',
        //   icon: Package,
        // },
        // {
        //   title: 'Configuration',
        //   icon: Settings2,
        //   items: [
        //     {
        //       title: 'Prompt Configuration',
        //       url: '/configuration/prompt-configuration',
        //     },
        //     {
        //       title: 'Model Configuration',
        //       url: '/configuration/model-configuration',
        //     },
        //     {
        //       title: 'Event Configuration',
        //       url: '/configuration/events',
        //     },
        //   ],
        // },
      ],
    },
    // {
    //   title: 'Pages',
    //   items: [
    //     {
    //       title: 'Auth',
    //       icon: ShieldCheck,
    //       items: [
    //         {
    //           title: 'Sign In',
    //           url: '/sign-in',
    //         },
    //         {
    //           title: 'Sign In (2 Col)',
    //           url: '/sign-in-2',
    //         },
    //         {
    //           title: 'Sign Up',
    //           url: '/sign-up',
    //         },
    //         {
    //           title: 'Forgot Password',
    //           url: '/forgot-password',
    //         },
    //         {
    //           title: 'OTP',
    //           url: '/otp',
    //         },
    //       ],
    //     },
    //     {
    //       title: 'Errors',
    //       icon: Bug,
    //       items: [
    //         {
    //           title: 'Unauthorized',
    //           url: '/errors/unauthorized',
    //           icon: Lock,
    //         },
    //         {
    //           title: 'Forbidden',
    //           url: '/errors/forbidden',
    //           icon: UserX,
    //         },
    //         {
    //           title: 'Not Found',
    //           url: '/errors/not-found',
    //           icon: FileX,
    //         },
    //         {
    //           title: 'Internal Server Error',
    //           url: '/errors/internal-server-error',
    //           icon: ServerOff,
    //         },
    //         {
    //           title: 'Maintenance Error',
    //           url: '/errors/maintenance-error',
    //           icon: Construction,
    //         },
    //       ],
    //     },
    //   ],
    // },
    // {
    //   title: 'Other',
    //   items: [
    //     {
    //       title: 'Settings',
    //       icon: Cog,
    //       items: [
    //         {
    //           title: 'Profile',
    //           url: '/settings/profile',
    //           icon: UserCog,
    //         },
    //         {
    //           title: 'Account',
    //           url: '/settings/account',
    //           icon: Wrench,
    //         },
    //         {
    //           title: 'Appearance',
    //           url: '/settings/appearance',
    //           icon: Palette,
    //         },
    //         {
    //           title: 'Notifications',
    //           url: '/settings/notifications',
    //           icon: Bell,
    //         },
    //         {
    //           title: 'Display',
    //           url: '/settings/display',
    //           icon: Monitor,
    //         },
    //       ],
    //     },
    //     // {
    //     //   title: 'Help Center',
    //     //   url: '/help-center',
    //     //   icon: HelpCircle,
    //     // },
    //   ],
    // },
  ],
};
