"""Community access control with verification enforcement."""

from dataclasses import dataclass
from typing import Optional

from verification.access_control import access_control_engine


@dataclass
class CommunityAccessLevel:
    """Defines access level for community features."""
    can_view_posts: bool = False
    can_create_posts: bool = False
    can_comment: bool = False
    can_like: bool = False
    can_participate_peer_verification: bool = False
    can_access_verified_only_content: bool = False
    access_level: str = 'none'  # none, basic, verified, premium
    blocking_reason: Optional[str] = None


class CommunityAccessController:
    """Controls access to community features based on verification status."""
    
    # Access level thresholds
    BASIC_ACCESS_SCORE = 31  # University email verified
    VERIFIED_ACCESS_SCORE = 70  # Full verification
    
    # Feature-specific requirements
    PEER_VERIFICATION_SCORE = 70  # Must be fully verified to verify others
    
    def __init__(self):
        self.access_engine = access_control_engine
    
    def evaluate_community_access(self, user) -> CommunityAccessLevel:
        """
        Evaluate user's access level to community features.
        
        Args:
            user: User object
            
        Returns:
            CommunityAccessLevel with detailed access permissions
        """
        if not user or not user.is_authenticated:
            return CommunityAccessLevel(
                can_view_posts=True,  # Allow viewing for engagement
                can_create_posts=False,
                can_comment=False,
                can_like=False,
                can_participate_peer_verification=False,
                access_level='guest',
                blocking_reason='Login required to participate in community'
            )
        
        # Get user's verification status
        score = self.access_engine.get_user_verification_score(user)
        permissions = self.access_engine.calculate_feature_permissions(user)
        
        # Check if user has university email verified (minimum requirement)
        has_university_email = self._has_university_email_verified(user)
        
        if not has_university_email:
            return CommunityAccessLevel(
                can_view_posts=True,
                can_create_posts=False,
                can_comment=False,
                can_like=False,
                can_participate_peer_verification=False,
                access_level='unverified',
                blocking_reason='University email verification required for community access'
            )
        
        # Basic access (31%+) - university email verified
        if score >= self.BASIC_ACCESS_SCORE and score < self.VERIFIED_ACCESS_SCORE:
            return CommunityAccessLevel(
                can_view_posts=True,
                can_create_posts=True,
                can_comment=True,
                can_like=True,
                can_participate_peer_verification=False,
                can_access_verified_only_content=False,
                access_level='basic',
                blocking_reason=None
            )
        
        # Verified access (70%+) - full verification
        if score >= self.VERIFIED_ACCESS_SCORE:
            return CommunityAccessLevel(
                can_view_posts=True,
                can_create_posts=True,
                can_comment=True,
                can_like=True,
                can_participate_peer_verification=True,
                can_access_verified_only_content=True,
                access_level='verified'
            )
        
        # Unverified but has account
        return CommunityAccessLevel(
            can_view_posts=True,
            can_create_posts=False,
            can_comment=False,
            can_like=False,
            can_participate_peer_verification=False,
            access_level='unverified',
            blocking_reason='Complete university email verification to participate'
        )
    
    def can_create_post(self, user) -> tuple[bool, Optional[str]]:
        """
        Check if user can create posts.
        
        Returns:
            Tuple of (can_create, blocking_reason)
        """
        access = self.evaluate_community_access(user)
        return access.can_create_posts, access.blocking_reason
    
    def can_comment(self, user) -> tuple[bool, Optional[str]]:
        """
        Check if user can comment on posts.
        
        Returns:
            Tuple of (can_comment, blocking_reason)
        """
        access = self.evaluate_community_access(user)
        return access.can_comment, access.blocking_reason
    
    def can_like(self, user) -> tuple[bool, Optional[str]]:
        """
        Check if user can like posts.
        
        Returns:
            Tuple of (can_like, blocking_reason)
        """
        access = self.evaluate_community_access(user)
        return access.can_like, access.blocking_reason
    
    def can_participate_peer_verification(self, user) -> tuple[bool, Optional[str]]:
        """
        Check if user can participate in peer verification.
        
        Requires 70%+ verification score.
        
        Returns:
            Tuple of (can_participate, blocking_reason)
        """
        if not user or not user.is_authenticated:
            return False, 'Login required'
        
        score = self.access_engine.get_user_verification_score(user)
        
        if score < self.PEER_VERIFICATION_SCORE:
            return False, f'Peer verification requires {self.PEER_VERIFICATION_SCORE}% verification score'
        
        return True, None
    
    def _has_university_email_verified(self, user) -> bool:
        """Check if user has verified university email."""
        try:
            from verification.enhanced_models import StudentVerification
            verification = StudentVerification.objects.filter(
                user=user,
                university_email_verified=True
            ).first()
            return verification is not None
        except Exception:
            # Fallback: check if user has any verification
            score = self.access_engine.get_user_verification_score(user)
            return score >= self.BASIC_ACCESS_SCORE
    
    def get_community_requirements(self) -> dict:
        """Get verification requirements for community access."""
        return {
            'basic_access': {
                'required_score': self.BASIC_ACCESS_SCORE,
                'required_level': 'basic',
                'required_methods': ['university_email'],
                'features': [
                    'Create posts',
                    'Comment on posts',
                    'Like posts',
                    'Join discussions'
                ]
            },
            'verified_access': {
                'required_score': self.VERIFIED_ACCESS_SCORE,
                'required_level': 'verified',
                'required_methods': ['university_email', 'student_id_upload'],
                'features': [
                    'All basic features',
                    'Participate in peer verification',
                    'Access verified-only content',
                    'Verified student badge'
                ]
            }
        }
    
    def get_verification_benefits(self, user) -> list[str]:
        """
        Get list of benefits user would gain by verifying.
        
        Args:
            user: User object
            
        Returns:
            List of benefit descriptions
        """
        if not user or not user.is_authenticated:
            return [
                'Login to access community features',
                'Verify university email to participate',
                'Complete full verification for peer verification'
            ]
        
        current_access = self.evaluate_community_access(user)
        score = self.access_engine.get_user_verification_score(user)
        
        benefits = []
        
        # Benefits they don't have yet
        if not current_access.can_create_posts:
            benefits.append('Create and share posts')
        
        if not current_access.can_comment:
            benefits.append('Comment on discussions')
        
        if not current_access.can_like:
            benefits.append('Like and engage with content')
        
        if not current_access.can_participate_peer_verification:
            benefits.append('Participate in peer verification')
        
        if not current_access.can_access_verified_only_content:
            benefits.append('Access verified-only content')
        
        # Additional benefits for higher verification
        if score < self.VERIFIED_ACCESS_SCORE:
            benefits.extend([
                'Verified student badge',
                'Enhanced community reputation',
                'Priority support'
            ])
        
        return benefits if benefits else ['You have full community access!']


# Global instance
community_access_controller = CommunityAccessController()
