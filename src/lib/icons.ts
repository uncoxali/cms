export interface IconCategory {
  name: string;
  icons: string[];
}

export const ICON_CATEGORIES: IconCategory[] = [
  {
    name: 'General',
    icons: [
      'Home', 'Search', 'Settings', 'Star', 'Heart', 'Bookmark', 'Bell', 'Clock',
      'Calendar', 'Check', 'X', 'Plus', 'Minus', 'Edit', 'Trash2', 'Copy',
      'Clipboard', 'Download', 'Upload', 'Share2', 'ExternalLink', 'Link', 'Tag',
      'Hash', 'Info', 'AlertCircle', 'AlertTriangle', 'HelpCircle', 'Eye', 'EyeOff',
      'Lock', 'Unlock', 'Key', 'Shield', 'Zap', 'Activity', 'TrendingUp', 'Award',
    ],
  },
  {
    name: 'Navigation',
    icons: [
      'ChevronLeft', 'ChevronRight', 'ChevronUp', 'ChevronDown', 'ArrowLeft',
      'ArrowRight', 'ArrowUp', 'ArrowDown', 'ArrowUpRight', 'CornerDownRight',
      'MoveHorizontal', 'MoveVertical', 'Maximize2', 'Minimize2', 'Menu',
      'MoreHorizontal', 'MoreVertical', 'Grid', 'List', 'Columns',
    ],
  },
  {
    name: 'Content',
    icons: [
      'FileText', 'File', 'Folder', 'FolderOpen', 'Image', 'Video', 'Music',
      'Paperclip', 'Type', 'AlignLeft', 'AlignCenter', 'AlignRight', 'AlignJustify',
      'Bold', 'Italic', 'Underline', 'Code', 'Code2', 'Braces', 'Quote',
      'Heading1', 'Heading2', 'Table', 'LayoutList', 'ListOrdered',
    ],
  },
  {
    name: 'Data',
    icons: [
      'Database', 'HardDrive', 'Server', 'BarChart', 'BarChart3', 'PieChart',
      'LineChart', 'GitBranch', 'GitCommit', 'GitPullRequest', 'GitMerge',
      'Layers', 'Box', 'Package', 'Archive', 'Filter', 'SortAsc', 'SortDesc',
      'Gauge', 'Binary', 'CircuitBoard', 'Cpu', 'Wifi', 'Globe',
    ],
  },
  {
    name: 'Users',
    icons: [
      'User', 'Users', 'UserPlus', 'UserMinus', 'UserCheck', 'UserX',
      'Contact', 'Mail', 'MessageSquare', 'MessageCircle', 'Send',
      'Phone', 'AtSign', 'Inbox', 'LogIn', 'LogOut',
    ],
  },
  {
    name: 'Commerce',
    icons: [
      'ShoppingCart', 'ShoppingBag', 'CreditCard', 'DollarSign', 'Wallet',
      'Receipt', 'Truck', 'Store', 'Gift', 'Percent', 'BadgeDollarSign',
      'Banknote', 'CircleDollarSign', 'HandCoins', 'PiggyBank',
    ],
  },
  {
    name: 'Media',
    icons: [
      'Camera', 'Mic', 'Volume2', 'VolumeX', 'Play', 'Pause', 'SkipForward',
      'SkipBack', 'Repeat', 'Shuffle', 'Radio', 'Tv', 'Monitor', 'Smartphone',
      'Tablet', 'Laptop', 'Printer', 'Speaker', 'Headphones',
    ],
  },
  {
    name: 'Shapes',
    icons: [
      'Circle', 'Square', 'Triangle', 'Hexagon', 'Pentagon', 'Octagon',
      'Diamond', 'Sparkles', 'Flame', 'Droplet', 'Cloud', 'Sun', 'Moon',
      'Snowflake', 'Wind', 'Leaf', 'TreePine', 'Mountain', 'Map', 'MapPin',
      'Compass', 'Navigation', 'Crosshair', 'Target',
    ],
  },
];

export const ALL_ICONS = ICON_CATEGORIES.flatMap((c) => c.icons);
