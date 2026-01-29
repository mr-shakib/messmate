# Shared Components

This directory contains reusable UI components used throughout the MessMate application.

## Components

### Navigation Components

#### Navbar
Top navigation bar with mess switcher and user menu.

```tsx
import { Navbar } from './components/shared';

// Used automatically in Layout component
```

**Features:**
- Mess switcher dropdown
- User menu with profile/settings/logout
- Responsive design

#### Sidebar
Side navigation menu with main app sections.

```tsx
import { Sidebar } from './components/shared';

// Used automatically in Layout component
```

**Features:**
- Navigation links (Dashboard, Expenses, Settlements, Members, Settings)
- Active link highlighting
- Collapsible on mobile

#### Layout
Wrapper component combining Navbar, Sidebar, and ToastContainer.

```tsx
import { Layout } from './components/shared';

<Layout>
  <YourPageContent />
</Layout>
```

### UI Components

#### LoadingSpinner
Animated loading indicator.

```tsx
import { LoadingSpinner } from './components/shared';

// Inline spinner
<LoadingSpinner size="md" color="blue" message="Loading..." />

// Full screen spinner
<LoadingSpinner fullScreen message="Processing..." />
```

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `color`: 'blue' | 'white' | 'gray' (default: 'blue')
- `fullScreen`: boolean (default: false)
- `message`: string (optional)

#### ToastContainer
Global toast notification system.

```tsx
import { ToastContainer } from './components/shared';
import { useUIStore } from './store/uiStore';

// Add to root of app (included in Layout)
<ToastContainer />

// Show toast from anywhere
const { addToast } = useUIStore();
addToast('Success!', 'success', 3000);
```

**Toast Types:**
- `success`: Green with checkmark
- `error`: Red with X
- `warning`: Yellow with warning icon
- `info`: Blue with info icon

#### ConfirmDialog
Modal dialog for confirming destructive actions.

```tsx
import { ConfirmDialog } from './components/shared';

<ConfirmDialog
  isOpen={isOpen}
  title="Delete Item"
  message="Are you sure? This cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  confirmButtonColor="red"
  onConfirm={handleDelete}
  onCancel={() => setIsOpen(false)}
/>
```

**Props:**
- `isOpen`: boolean (required)
- `title`: string (required)
- `message`: string (required)
- `confirmText`: string (default: 'Confirm')
- `cancelText`: string (default: 'Cancel')
- `confirmButtonColor`: 'red' | 'blue' | 'green' (default: 'red')
- `onConfirm`: () => void (required)
- `onCancel`: () => void (required)

#### ErrorBoundary
Catches and displays React errors gracefully.

```tsx
import { ErrorBoundary } from './components/shared';

// Wrap your app or specific components
<ErrorBoundary>
  <YourApp />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>
```

## Usage Patterns

### Protected Routes with Layout

```tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Layout>
        <DashboardPage />
      </Layout>
    </ProtectedRoute>
  }
/>
```

### Loading States

```tsx
const MyComponent = () => {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading data..." />;
  }

  return <div>Content</div>;
};
```

### Confirmation Dialogs

```tsx
const MyComponent = () => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    await deleteItem();
    setShowConfirm(false);
    addToast('Item deleted', 'success');
  };

  return (
    <>
      <button onClick={() => setShowConfirm(true)}>Delete</button>
      
      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete Item"
        message="This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};
```

### Toast Notifications

```tsx
import { useUIStore } from '../store/uiStore';

const MyComponent = () => {
  const { addToast } = useUIStore();

  const handleSuccess = () => {
    addToast('Operation completed successfully!', 'success', 3000);
  };

  const handleError = () => {
    addToast('Something went wrong', 'error', 5000);
  };

  return (
    <div>
      <button onClick={handleSuccess}>Success</button>
      <button onClick={handleError}>Error</button>
    </div>
  );
};
```

## Accessibility

All components follow WCAG 2.1 Level AA guidelines:
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader friendly
- Sufficient color contrast

## Responsive Design

All components are mobile-first and fully responsive:
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly tap targets (minimum 44x44px)
- Collapsible navigation on mobile
- Optimized layouts for all screen sizes

## Testing

Unit tests are located in `__tests__/` directory. Run tests with:

```bash
npm test
```

## Styling

Components use Tailwind CSS for styling with custom animations defined in `tailwind.config.js`:
- `animate-slide-in-right`: Toast notifications
- `animate-scale-in`: Modal dialogs
- `animate-spin`: Loading spinners
