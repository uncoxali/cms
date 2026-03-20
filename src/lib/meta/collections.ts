export type FieldType = 'string' | 'text' | 'textarea' | 'rich-text' | 'number' | 'integer' | 'float' | 'boolean' | 'select' | 'relation' | 'datetime' | 'file' | 'chart';

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: any[]; // For select, etc
  relationInfo?: {
    collection: string;
    type: 'many-to-one' | 'one-to-many';
    displayField?: string;
  };
  group?: string; // e.g., Basic, Media, SEO
  sortable?: boolean;
  searchable?: boolean;
  validation?: {
    min?: number;
    max?: number;
    regex?: string;
  };
  conditional?: {
    field: string;
    operator: '_eq' | '_neq';
    value: any;
  };
}

export interface CollectionPreset {
  layout?: string;
  search?: string;
  filters?: any[];
  sort?: { field: string; order: 'asc' | 'desc' };
  visibleColumns?: string[];
  pageSize?: number;
}

export interface CollectionConfig {
  id: string; // The backend path identifier, e.g. "products"
  name: string; // Internal name
  label: string; // Display name
  icon?: string;
  fields: FieldConfig[];
  preset?: CollectionPreset;
}

export const collections: Record<string, CollectionConfig> = {
  products: {
    id: 'products',
    name: 'Products',
    label: 'Products',
    icon: 'Inventory2Outlined',
    fields: [
      { name: 'id', label: 'ID', type: 'number', group: 'Meta', sortable: true, searchable: true },
      { name: 'title', label: 'Title', type: 'string', required: true, group: 'Basic', sortable: true, searchable: true },
      { name: 'description', label: 'Description', type: 'textarea', group: 'Basic' },
      { name: 'descriptionLong', label: 'Long Description (Rich Text)', type: 'rich-text', group: 'Basic' },
      { name: 'price', label: 'Price', type: 'number', group: 'Basic', sortable: true },
      { name: 'isActive', label: 'Active', type: 'boolean', group: 'Basic' },
      { name: 'category', label: 'Category', type: 'relation', relationInfo: { collection: 'categories', type: 'many-to-one', displayField: 'name' }, group: 'Relations' },
      { name: 'brand', label: 'Brand', type: 'relation', relationInfo: { collection: 'brands', type: 'many-to-one', displayField: 'name' }, group: 'Relations' },
      { name: 'thumbnail', label: 'Thumbnail', type: 'file', group: 'Media' },
      { name: 'createdAt', label: 'Date Created', type: 'datetime', group: 'Meta', sortable: true },
    ],
    preset: {
      visibleColumns: ['id', 'title', 'price', 'isActive'],
      sort: { field: 'createdAt', order: 'desc' },
      pageSize: 10
    }
  },
  categories: {
    id: 'categories',
    name: 'Categories',
    label: 'Categories',
    icon: 'CategoryOutlined',
    fields: [
      { name: 'id', label: 'ID', type: 'number', group: 'Meta', sortable: true, searchable: true },
      { name: 'name', label: 'Name', type: 'string', required: true, group: 'Basic', sortable: true, searchable: true },
      { name: 'description', label: 'Description', type: 'textarea', group: 'Basic' },
    ],
    preset: { visibleColumns: ['id', 'name'] }
  },
  brands: {
    id: 'brands',
    name: 'Brands',
    label: 'Brands',
    icon: 'BrandingWatermarkOutlined',
    fields: [
      { name: 'id', label: 'ID', type: 'number', group: 'Meta', sortable: true, searchable: true },
      { name: 'name', label: 'Brand Name', type: 'string', required: true, group: 'Basic', sortable: true, searchable: true },
      { name: 'logo', label: 'Logo', type: 'file', group: 'Media' }
    ],
    preset: { visibleColumns: ['id', 'name'] }
  },
  pages: {
    id: 'pages',
    name: 'Pages',
    label: 'Pages',
    icon: 'WebOutlined',
    fields: [
      { name: 'id', label: 'ID', type: 'number', group: 'Meta', sortable: true, searchable: true },
      { name: 'title', label: 'Title', type: 'string', required: true, group: 'Basic', sortable: true, searchable: true },
      { name: 'slug', label: 'Slug / Path', type: 'string', required: true, group: 'Basic', sortable: true, searchable: true },
      { name: 'content', label: 'Content', type: 'rich-text', group: 'Basic' },
      { name: 'isPublished', label: 'Published', type: 'boolean', group: 'Basic' },
      { name: 'seoTitle', label: 'SEO Title', type: 'string', group: 'SEO' },
      { name: 'seoDescription', label: 'SEO Description', type: 'textarea', group: 'SEO' }
    ],
    preset: { visibleColumns: ['id', 'title', 'slug', 'isPublished'], sort: { field: 'title', order: 'asc' } }
  }
};
