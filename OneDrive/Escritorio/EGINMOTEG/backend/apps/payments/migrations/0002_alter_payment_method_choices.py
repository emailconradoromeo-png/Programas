# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="payment",
            name="payment_method",
            field=models.CharField(
                choices=[
                    ("bange_mobil", "Bange Mobil"),
                    ("rosa_money", "Rosa Money"),
                    ("muni_dinero", "Muni Dinero"),
                    ("tarjeta", "Tarjeta"),
                    ("transferencia", "Transferencia"),
                ],
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="historicalpayment",
            name="payment_method",
            field=models.CharField(
                choices=[
                    ("bange_mobil", "Bange Mobil"),
                    ("rosa_money", "Rosa Money"),
                    ("muni_dinero", "Muni Dinero"),
                    ("tarjeta", "Tarjeta"),
                    ("transferencia", "Transferencia"),
                ],
                max_length=20,
            ),
        ),
    ]
