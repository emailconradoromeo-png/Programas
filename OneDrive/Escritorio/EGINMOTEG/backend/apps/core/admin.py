from django.contrib import admin

from .models import CurrencyRate


@admin.register(CurrencyRate)
class CurrencyRateAdmin(admin.ModelAdmin):
    list_display = ("from_currency", "to_currency", "rate", "updated_at")
    list_filter = ("from_currency", "to_currency")
