from django.contrib import admin
from .models import User, Student, Landlord, Agent

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-date_joined',)

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('user', 'university', 'student_id')
    search_fields = ('user__email', 'university', 'student_id')

@admin.register(Landlord)
class LandlordAdmin(admin.ModelAdmin):
    list_display = ('user', 'national_id')
    search_fields = ('user__email', 'national_id')

@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = ('user', 'national_id', 'campus_region')
    search_fields = ('user__email', 'national_id', 'campus_region')
