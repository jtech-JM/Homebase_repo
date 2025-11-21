"use client";
import { useState, useEffect } from 'react';
import { User } from 'lucide-react';

export default function UserAvatar({ 
  user, 
  size = 'md', 
  className = '',
  showOnlineStatus = false 
}) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (user?.avatar) {
      // Handle both full URLs and relative paths
      const url = user.avatar.startsWith('http') 
        ? user.avatar 
        : `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}`;
      setAvatarUrl(url);
      setImageError(false);
    } else {
      setAvatarUrl(null);
    }
  }, [user?.avatar]);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
    '2xl': 'w-16 h-16',
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const iconSize = iconSizes[size] || iconSizes.md;

  return (
    <div className={`relative ${sizeClass} ${className}`}>
      <div className={`${sizeClass} rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-gray-200`}>
        {avatarUrl && !imageError ? (
          <img
            src={avatarUrl}
            alt={user?.name || user?.email || 'User'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <User className={`${iconSize} text-blue-600`} />
        )}
      </div>
      {showOnlineStatus && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      )}
    </div>
  );
}
