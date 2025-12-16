import { LayoutDashboard, Settings } from 'lucide-react';
import { routes } from 'wasp/client/router';
export const userMenuItems = [
    {
        name: 'Video Generator',
        to: routes.VideoGeneratorRoute.to,
        icon: LayoutDashboard,
        isAdminOnly: false,
        isAuthRequired: true,
    },
    {
        name: 'Account Settings',
        to: routes.AccountRoute.to,
        icon: Settings,
        isAuthRequired: false,
        isAdminOnly: false,
    },
];
