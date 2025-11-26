from django.contrib import admin
from .models import Verification
from .enforcement_models import VerificationGateLog, FeatureAccessConfig, VerificationBenefit


@admin.register(VerificationGateLog)
class VerificationGateLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'feature', 'access_granted', 'verification_score_at_time', 'required_score', 'timestamp']
    list_filter = ['access_granted', 'feature', 'timestamp']
    search_fields = ['user__email', 'feature', 'ip_address']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'


@admin.register(FeatureAccessConfig)
class FeatureAccessConfigAdmin(admin.ModelAdmin):
    list_display = ['feature_name', 'minimum_verification_score', 'access_level', 'is_active', 'updated_at']
    list_filter = ['access_level', 'is_active']
    search_fields = ['feature_name', 'feature_description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(VerificationBenefit)
class VerificationBenefitAdmin(admin.ModelAdmin):
    list_display = ['name', 'verification_level_required', 'feature_category', 'is_active', 'display_order']
    list_filter = ['verification_level_required', 'feature_category', 'is_active']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['display_order', 'name']


admin.site.register(Verification)
