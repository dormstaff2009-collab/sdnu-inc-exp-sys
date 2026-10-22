import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Building,
  Bug,
  Droplets,
  Bed,
  Wrench,
  Package,
  Box,
  FileText,
  UtensilsCrossed,
  Hammer,
  Zap,
  Sprout,
  Fuel,
  Truck,
  Building2,
  Receipt,
  Hotel,
  Coins,
  Key,
  Home,
  ShoppingBag,
  MoreHorizontal,
  PlusCircle,
  CircleDot,
  CheckCircle,
} from 'lucide-react';

interface Props {
  iconName: string;
  className?: string;
  color?: string;
}

const iconMap: Record<string, React.ElementType> = {
  Sparkles,
  ShieldCheck,
  Building,
  Bug,
  Droplets,
  Bed,
  Wrench,
  Package,
  Box,
  FileText,
  UtensilsCrossed,
  Hammer,
  Zap,
  Sprout,
  Fuel,
  Truck,
  Building2,
  Receipt,
  Hotel,
  Coins,
  Key,
  Home,
  ShoppingBag,
  MoreHorizontal,
  PlusCircle,
  CircleDot,
  CheckCircle,
};

export const CategoryIcon: React.FC<Props> = ({ iconName, className = 'w-5 h-5', color }) => {
  const IconComponent = iconMap[iconName] || CircleDot;
  return <IconComponent className={className} style={color ? { color } : undefined} />;
};

export const AVAILABLE_ICONS = [
  'Sparkles',
  'ShieldCheck',
  'Building',
  'Bug',
  'Droplets',
  'Bed',
  'Wrench',
  'Package',
  'Box',
  'FileText',
  'UtensilsCrossed',
  'Hammer',
  'Zap',
  'Sprout',
  'Fuel',
  'Truck',
  'Building2',
  'Receipt',
  'Hotel',
  'Coins',
  'Key',
  'Home',
  'ShoppingBag',
  'PlusCircle',
  'CircleDot',
];
