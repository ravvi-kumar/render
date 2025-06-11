import { NavItem } from '@/types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    roles: ['admin', 'user'],
    items: [] // Empty array as there are no child items for Dashboard
  },
  {
    title: '2D-Work Flow',
    url: '/dashboard/two-dflow',
    icon: 'twoD',
    shortcut: ['p', 'p'],
    roles: ['admin', 'user'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Product Management',
    url: '/dashboard/inventory',
    icon: 'product',
    shortcut: ['p', 'm'],
    roles: ['admin', 'user'],
    isActive: false,
    items: [
      {
        title: 'Inventory',
        url: '/dashboard/inventory',
        icon: 'product',
        roles: ['user'],
        shortcut: ['i', 'i']
      },
      {
        title: 'Send to Prepvia',
        url: '/dashboard/send-to-prepvia',
        icon: 'upload',
        roles: ['user'],
        shortcut: ['s', 'p']
      }
    ]
  },
  {
    title: 'Account',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'billing',
    roles: ['admin', 'user'],
    isActive: true,

    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'userPen',
        shortcut: ['m', 'm']
      },
     /*  {
        title: 'Login',
        shortcut: ['l', 'l'],
        url: '/',
        icon: 'login'
      } */
    ]
  }
];

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'IN'
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'WK'
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'SD'
  }
];
