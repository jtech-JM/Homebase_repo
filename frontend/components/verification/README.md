# Verification Gate Components

Comprehensive React components for implementing verification-based access control in the frontend.

## Components

### 1. VerificationGate

Main component that wraps content requiring verification and shows appropriate fallback.

```jsx
import { VerificationGate } from '@/components/verification';

// Basic usage
<VerificationGate
  requiredScore={70}
  featureName="student housing booking"
>
  <BookingForm />
</VerificationGate>

// With custom fallback
<VerificationGate
  requiredScore={70}
  featureName="premium features"
  fallback={<CustomFallback />}
>
  <PremiumContent />
</VerificationGate>

// With callback
<VerificationGate
  requiredScore={70}
  onAccessDenied={(data) => {
    console.log('Access denied:', data);
    trackEvent('verification_required', { score: data.score });
  }}
>
  <ProtectedContent />
</VerificationGate>
```

**Props:**
- `children` (ReactNode) - Content to show when verified
- `requiredScore` (number) - Minimum verification score (0-100)
- `requiredLevel` (string) - Required level (basic, verified, premium)
- `featureName` (string) - Name of the feature being gated
- `fallback` (ReactNode) - Custom fallback content
- `showPrompt` (boolean) - Show verification prompt (default: true)
- `onAccessDenied` (function) - Callback when access is denied

### 2. VerificationPrompt

Shows a clear, actionable prompt when verification is required.

```jsx
import { VerificationPrompt } from '@/components/verification';

<VerificationPrompt
  featureName="student discounts"
  requiredScore={70}
  currentScore={45}
  currentLevel="basic"
/>
```

**Props:**
- `featureName` (string) - Name of the feature
- `requiredScore` (number) - Required verification score
- `requiredLevel` (string) - Required verification level
- `currentScore` (number) - User's current score
- `currentLevel` (string) - User's current level
- `reason` (string) - Blocking reason message

### 3. VerificationBadge

Displays verification status as a styled badge.

```jsx
import { VerificationBadge } from '@/components/verification';

// Basic badge
<VerificationBadge score={70} level="verified" />

// With score display
<VerificationBadge 
  score={70} 
  level="verified" 
  showScore={true}
  size="large"
/>

// Compact badge
<VerificationBadge 
  score={45} 
  level="basic" 
  size="small"
  showLabel={false}
/>
```

**Props:**
- `score` (number) - Verification score (0-100)
- `level` (string) - Verification level
- `size` (string) - Badge size (small, medium, large)
- `showScore` (boolean) - Show score percentage
- `showLabel` (boolean) - Show level label
- `className` (string) - Additional CSS classes

### 4. FeatureLock

Compact component indicating a locked feature.

```jsx
import { FeatureLock } from '@/components/verification';

// Full lock display
<FeatureLock
  featureName="priority booking"
  requiredScore={70}
  currentScore={45}
/>

// Compact version
<FeatureLock
  featureName="student rates"
  requiredScore={70}
  currentScore={45}
  compact={true}
/>

// Inline version
<FeatureLock
  featureName="this feature"
  requiredScore={70}
  currentScore={45}
  inline={true}
/>
```

**Props:**
- `featureName` (string) - Name of the feature
- `requiredScore` (number) - Required verification score
- `currentScore` (number) - User's current score
- `compact` (boolean) - Use compact display
- `inline` (boolean) - Use inline display

### 5. VerificationProgress

Shows user's verification progress with milestones.

```jsx
import { VerificationProgress } from '@/components/verification';

// Full progress display
<VerificationProgress
  showMilestones={true}
  showNextSteps={true}
/>

// Compact version
<VerificationProgress compact={true} />
```

**Props:**
- `showMilestones` (boolean) - Show milestone cards
- `showNextSteps` (boolean) - Show next verification steps
- `compact` (boolean) - Use compact display

### 6. MilestoneCelebration

Animated celebration when reaching a milestone.

```jsx
import { MilestoneCelebration } from '@/components/verification';

const [milestone, setMilestone] = useState(null);

// Trigger celebration
setMilestone({
  level: 'verified',
  score: 70,
});

<MilestoneCelebration
  milestone={milestone}
  onClose={() => setMilestone(null)}
  autoClose={true}
  autoCloseDelay={5000}
/>
```

**Props:**
- `milestone` (object) - Milestone data ({ level, score })
- `onClose` (function) - Callback when closed
- `autoClose` (boolean) - Auto-close after delay
- `autoCloseDelay` (number) - Delay in milliseconds

## Usage Examples

### Protecting a Page

```jsx
// app/bookings/page.js
import { VerificationGate } from '@/components/verification';

export default function BookingsPage() {
  return (
    <VerificationGate
      requiredScore={70}
      featureName="student housing bookings"
    >
      <div>
        <h1>Book Student Housing</h1>
        <BookingForm />
      </div>
    </VerificationGate>
  );
}
```

### Protecting a Component

```jsx
// components/StudentDiscountBanner.js
import { VerificationGate, FeatureLock } from '@/components/verification';

export default function StudentDiscountBanner() {
  return (
    <VerificationGate
      requiredScore={70}
      featureName="student discounts"
      fallback={
        <FeatureLock
          featureName="student discounts"
          requiredScore={70}
          currentScore={45}
          compact={true}
        />
      }
    >
      <div className="bg-green-100 p-4 rounded">
        <h3>15% Student Discount Applied!</h3>
        <p>Save on all bookings</p>
      </div>
    </VerificationGate>
  );
}
```

### Dashboard with Progress

```jsx
// app/dashboard/page.js
import { VerificationProgress, VerificationBadge } from '@/components/verification';

export default function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <h1>Dashboard</h1>
        {/* Main content */}
      </div>
      <div>
        <VerificationProgress
          showMilestones={true}
          showNextSteps={true}
        />
      </div>
    </div>
  );
}
```

### Inline Feature Lock

```jsx
// components/PricingCard.js
import { FeatureLock } from '@/components/verification';

export default function PricingCard({ price, hasAccess }) {
  return (
    <div className="border rounded p-4">
      <div className="text-2xl font-bold">
        {hasAccess ? (
          <>${price}</>
        ) : (
          <>
            <s>${price}</s>
            <FeatureLock
              featureName="student rates"
              requiredScore={70}
              inline={true}
            />
          </>
        )}
      </div>
    </div>
  );
}
```

### Milestone Celebration on Verification Complete

```jsx
// app/verify-student/page.js
import { useState } from 'react';
import { MilestoneCelebration } from '@/components/verification';

export default function VerifyStudentPage() {
  const [milestone, setMilestone] = useState(null);

  const handleVerificationComplete = (newScore) => {
    if (newScore >= 70) {
      setMilestone({ level: 'verified', score: 70 });
    } else if (newScore >= 31) {
      setMilestone({ level: 'basic', score: 31 });
    }
  };

  return (
    <>
      <VerificationForm onComplete={handleVerificationComplete} />
      <MilestoneCelebration
        milestone={milestone}
        onClose={() => setMilestone(null)}
      />
    </>
  );
}
```

## Verification Levels

- **Guest (0%)**: Not logged in
- **Unverified (1-30%)**: Logged in but not verified
- **Basic (31-69%)**: University email verified
- **Verified (70-99%)**: Full student verification
- **Premium (100%)**: Fully verified with all methods

## Styling

All components use Tailwind CSS and are fully customizable. You can:

1. Pass custom `className` props
2. Override styles using Tailwind's utility classes
3. Customize colors in the component files
4. Use the `compact` and `inline` props for different layouts

## API Integration

Components automatically fetch verification status from:
- `GET /api/verification/status` - Get user's verification status

Expected response format:
```json
{
  "score": 70,
  "level": "verified",
  "methods": ["university_email", "student_id"]
}
```

## Best Practices

1. **Use VerificationGate for pages/sections** - Wrap entire features
2. **Use FeatureLock for inline elements** - Show locks on buttons, cards
3. **Show VerificationProgress in dashboards** - Help users understand their status
4. **Celebrate milestones** - Use MilestoneCelebration for positive reinforcement
5. **Provide clear messaging** - Always explain why verification is needed
6. **Track analytics** - Use onAccessDenied callbacks to track blocked access

## Accessibility

All components include:
- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly text
- High contrast colors
- Focus indicators
