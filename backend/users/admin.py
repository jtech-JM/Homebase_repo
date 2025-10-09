from django.contrib import admin
from .models import User, Student, Landlord, Agent

admin.site.register(User)
admin.site.register(Student)
admin.site.register(Landlord)
admin.site.register(Agent)
