from djoser.email import PasswordResetEmail as BasePasswordResetEmail


class PasswordResetEmail(BasePasswordResetEmail):
    template_name = 'email/password_reset.html'
    
    def get_context_data(self):
        context = super().get_context_data()
        # Override the URL to point to frontend
        user = context.get('user')
        context['url'] = f"http://localhost:3000/reset-password?uid={context['uid']}&token={context['token']}"
        context['domain'] = 'localhost:3000'
        context['site_name'] = 'Homebase'
        return context
