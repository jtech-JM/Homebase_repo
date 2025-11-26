"""
Access Control Engine for Verification Enforcement System

This module implements the core access control logic that determines
user permissions based on verification status and scores.
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from django.core.cache import cache
from django.utils import timezone
from django.conf import settings
import logging

from .enforcement_models import FeatureAccessConfig, VerificationGateLog
from .enhanced_models import StudentVerification

logger = logging.getLogger(__name__)


@dataclass
class AccessDecision:
    """Result of an access control evaluation"""
    granted: bool
    verification_score: int
    required_score: int
    user_level: str
    required_level: str
    blocking_reason: str = ""
    missing_methods: List[str] = None
    
    def __post_init__(self):
        if self.missing_methods is None:
            self.missing_methods = []


@dataclass
class FeaturePermissions:
    """User's permissions for various features"""
    can_book_student_housing: bool
    can_book_premium_housing: bool
    can_access_student_discounts: bool
    can_access_community: bool
    can_peer_verify: bool
    can_access_priority_features: bool
    verification_score: int
    verification_level: str


class AccessControlEngine:
    """
    Central service for evaluating verification requirements and access permissions.
    
    Implements graduated access control based on verification scores:
    - 0-30%: Unverified (basic platform access only)
    - 31-69%: Basic verification (partial student features)
    - 70%+: Verified (full access to all student features)
    """
    
    # Verification level thresholds
    UNVERIFIED_MAX = 30
    BASIC_MIN = 31
    BASIC_MAX = 69
    VERIFIED_MIN = 70
    
    # Cache settings
    CACHE_TTL = 300  # 5 minutes
    
    def __init__(self):
        self.logger = logger
    
    def get_verification_level(self, score: int) -> str:
        """
        Map verification score to access level.
        
        Args:
            score: Verification score (0-100)
            
        Returns:
            Access level: 'unverified', 'basic', or 'verified'
        """
        if score >= self.VERIFIED_MIN:
            return 'verified'
        elif score >= self.BASIC_MIN:
            return 'basic'
        else:
            return 'unverified'
    
    def get_user_verification_score(self, user) -> int:
        """
        Get the current verification score for a user.
        
        Args:
            user: User instance
            
        Returns:
            Verification score (0-100)
        """
        # Check cache first
        cache_key = f'verification_score_{user.id}'
        cached_score = cache.get(cache_key)
        
        if cached_score is not None:
            return cached_score
        
        # Get from StudentVerification model
        try:
            verification = StudentVerification.objects.filter(
                user=user
            ).exclude(
                overall_status='rejected'
            ).first()
            
            if verification:
                score = verification.verification_score
            else:
                score = 0
            
            # Cache the score
            cache.set(cache_key, score, self.CACHE_TTL)
            return score
            
        except Exception as e:
            self.logger.error(f"Error getting verification score for user {user.id}: {e}")
            return 0
    
    def evaluate_access(
        self,
        user,
        feature_name: str,
        required_score: Optional[int] = None,
        required_methods: Optional[List[str]] = None
    ) -> AccessDecision:
        """
        Evaluate whether a user has access to a specific feature.
        
        Args:
            user: User instance
            feature_name: Name of the feature being accessed
            required_score: Minimum verification score required (optional)
            required_methods: List of required verification methods (optional)
            
        Returns:
            AccessDecision with evaluation results
        """
        # Get user's current verification score
        user_score = self.get_user_verification_score(user)
        user_level = self.get_verification_level(user_score)
        
        # Get feature configuration if not provided
        if required_score is None or required_methods is None:
            config = self._get_feature_config(feature_name)
            if config:
                required_score = config.minimum_verification_score
                required_methods = config.required_verification_methods or []
            else:
                # No config found, allow access by default
                return AccessDecision(
                    granted=True,
                    verification_score=user_score,
                    required_score=0,
                    user_level=user_level,
                    required_level='unverified'
                )
        
        # Determine required level
        required_level = self.get_verification_level(required_score)
        
        # Check score requirement
        if user_score < required_score:
            return AccessDecision(
                granted=False,
                verification_score=user_score,
                required_score=required_score,
                user_level=user_level,
                required_level=required_level,
                blocking_reason=f"Verification score {user_score}% is below required {required_score}%"
            )
        
        # Check required methods
        if required_methods:
            missing = self._check_required_methods(user, required_methods)
            if missing:
                return AccessDecision(
                    granted=False,
                    verification_score=user_score,
                    required_score=required_score,
                    user_level=user_level,
                    required_level=required_level,
                    blocking_reason=f"Missing required verification methods: {', '.join(missing)}",
                    missing_methods=missing
                )
        
        # Access granted
        return AccessDecision(
            granted=True,
            verification_score=user_score,
            required_score=required_score,
            user_level=user_level,
            required_level=required_level
        )
    
    def calculate_feature_permissions(self, user) -> FeaturePermissions:
        """
        Calculate all feature permissions for a user based on verification status.
        
        Args:
            user: User instance
            
        Returns:
            FeaturePermissions object with all permission flags
        """
        # Check cache first
        cache_key = f'feature_permissions_{user.id}'
        cached_permissions = cache.get(cache_key)
        
        if cached_permissions is not None:
            return cached_permissions
        
        # Get verification score and level
        score = self.get_user_verification_score(user)
        level = self.get_verification_level(score)
        
        # Calculate permissions based on score thresholds
        permissions = FeaturePermissions(
            can_book_student_housing=score >= self.VERIFIED_MIN,
            can_book_premium_housing=score >= self.VERIFIED_MIN,
            can_access_student_discounts=score >= self.VERIFIED_MIN,
            can_access_community=score >= self.BASIC_MIN,  # Basic verification required
            can_peer_verify=score >= self.VERIFIED_MIN,
            can_access_priority_features=score >= self.VERIFIED_MIN,
            verification_score=score,
            verification_level=level
        )
        
        # Cache the permissions
        cache.set(cache_key, permissions, self.CACHE_TTL)
        
        return permissions
    
    def update_user_access_level(self, user) -> str:
        """
        Update user's verification_level field based on current score.
        
        Args:
            user: User instance
            
        Returns:
            Updated verification level
        """
        score = self.get_user_verification_score(user)
        new_level = self.get_verification_level(score)
        
        if user.verification_level != new_level:
            user.verification_level = new_level
            user.last_verification_check = timezone.now()
            user.save(update_fields=['verification_level', 'last_verification_check'])
            
            # Invalidate caches
            self._invalidate_user_caches(user)
            
            self.logger.info(
                f"Updated user {user.id} verification level to {new_level} (score: {score})"
            )
        
        return new_level
    
    def update_permissions_cache(self, user) -> Dict:
        """
        Update the user's cached permissions in the database.
        
        Args:
            user: User instance
            
        Returns:
            Dictionary of permissions
        """
        permissions = self.calculate_feature_permissions(user)
        
        # Convert to dict for JSON storage
        permissions_dict = {
            'can_book_student_housing': permissions.can_book_student_housing,
            'can_book_premium_housing': permissions.can_book_premium_housing,
            'can_access_student_discounts': permissions.can_access_student_discounts,
            'can_access_community': permissions.can_access_community,
            'can_peer_verify': permissions.can_peer_verify,
            'can_access_priority_features': permissions.can_access_priority_features,
            'verification_score': permissions.verification_score,
            'verification_level': permissions.verification_level,
            'updated_at': timezone.now().isoformat()
        }
        
        user.access_permissions_cache = permissions_dict
        user.save(update_fields=['access_permissions_cache'])
        
        return permissions_dict
    
    def log_access_attempt(
        self,
        user,
        feature: str,
        decision: AccessDecision,
        request=None
    ) -> VerificationGateLog:
        """
        Log an access attempt for audit purposes.
        
        Args:
            user: User instance
            feature: Feature name
            decision: AccessDecision result
            request: HTTP request object (optional)
            
        Returns:
            Created VerificationGateLog instance
        """
        # Extract request metadata
        user_agent = ''
        ip_address = None
        
        if request:
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:255]
            ip_address = self._get_client_ip(request)
        
        # Get completed verification methods
        completed_methods = []
        try:
            verification = StudentVerification.objects.filter(user=user).first()
            if verification:
                completed_methods = verification.verification_methods or []
        except Exception as e:
            self.logger.error(f"Error getting verification methods: {e}")
        
        # Create log entry
        log = VerificationGateLog.objects.create(
            user=user,
            feature=feature,
            access_granted=decision.granted,
            verification_score_at_time=decision.verification_score,
            required_score=decision.required_score,
            blocking_reason=decision.blocking_reason,
            verification_methods_completed=completed_methods,
            user_agent=user_agent,
            ip_address=ip_address
        )
        
        return log
    
    def _get_feature_config(self, feature_name: str) -> Optional[FeatureAccessConfig]:
        """Get feature configuration from database with caching."""
        cache_key = f'feature_config_{feature_name}'
        config = cache.get(cache_key)
        
        if config is None:
            try:
                config = FeatureAccessConfig.objects.filter(
                    feature_name=feature_name,
                    is_active=True
                ).first()
                
                if config:
                    cache.set(cache_key, config, self.CACHE_TTL)
            except Exception as e:
                self.logger.error(f"Error getting feature config for {feature_name}: {e}")
                return None
        
        return config
    
    def _check_required_methods(self, user, required_methods: List[str]) -> List[str]:
        """Check which required verification methods are missing."""
        try:
            verification = StudentVerification.objects.filter(user=user).first()
            if not verification:
                return required_methods
            
            completed = set(verification.verification_methods or [])
            required = set(required_methods)
            missing = required - completed
            
            return list(missing)
        except Exception as e:
            self.logger.error(f"Error checking required methods: {e}")
            return required_methods
    
    def _invalidate_user_caches(self, user):
        """Invalidate all caches for a user."""
        cache.delete(f'verification_score_{user.id}')
        cache.delete(f'feature_permissions_{user.id}')
    
    def _get_client_ip(self, request) -> Optional[str]:
        """Extract client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


# Singleton instance
access_control_engine = AccessControlEngine()
