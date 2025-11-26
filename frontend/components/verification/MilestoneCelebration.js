'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MilestoneCelebration Component
 * 
 * Shows a celebration animation when user reaches a verification milestone.
 */
export default function MilestoneCelebration({
  milestone = null,
  onClose = null,
  autoClose = true,
  autoCloseDelay = 5000,
}) {
  const [isVisible, setIsVisible] = useState(!!milestone);

  useEffect(() => {
    if (milestone && autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [milestone, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(onClose, 300); // Wait for animation to complete
    }
  };

  if (!milestone) return null;

  const getMilestoneConfig = (level) => {
    const configs = {
      basic: {
        icon: '📧',
        title: 'Basic Verification Complete!',
        color: 'from-blue-400 to-indigo-500',
        emoji: '🎉',
        benefits: [
          'Access community features',
          'Make bookings',
          'Contact landlords',
        ],
      },
      verified: {
        icon: '✓',
        title: 'Verified Student!',
        color: 'from-green-400 to-emerald-500',
        emoji: '🌟',
        benefits: [
          'Student discounts (15-20%)',
          'Priority booking',
          'Peer verification',
          'Verified badge',
        ],
      },
      premium: {
        icon: '⭐',
        title: 'Fully Verified!',
        color: 'from-purple-400 to-pink-500',
        emoji: '🎊',
        benefits: [
          'Maximum discounts',
          'Premium features',
          'Exclusive listings',
          'Priority support',
        ],
      },
    };

    return configs[level] || configs.basic;
  };

  const config = getMilestoneConfig(milestone.level);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Confetti Animation */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                  className="text-6xl mb-4"
                >
                  {config.emoji}
                </motion.div>

                {/* Icon with gradient background */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${config.color} text-white text-3xl mb-4`}
                >
                  {config.icon}
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-gray-900 mb-2"
                >
                  {config.title}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600"
                >
                  You've reached {milestone.score}% verification!
                </motion.p>
              </div>

              {/* Benefits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 mb-6"
              >
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  🎁 New Benefits Unlocked
                </h3>
                <ul className="space-y-2">
                  {config.benefits.map((benefit, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{benefit}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {/* Action Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                onClick={handleClose}
                className={`w-full py-3 rounded-lg bg-gradient-to-r ${config.color} text-white font-semibold hover:shadow-lg transition-shadow`}
              >
                Continue
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
