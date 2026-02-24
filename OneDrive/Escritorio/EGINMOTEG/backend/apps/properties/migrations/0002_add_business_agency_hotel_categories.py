from django.db import migrations


def create_categories(apps, schema_editor):
    Category = apps.get_model("properties", "Category")

    Category.objects.get_or_create(
        slug="negocio",
        defaults={
            "name": "Negocio",
            "icon": "BuildingStorefrontIcon",
            "fields_schema": {
                "business_type": {
                    "type": "select",
                    "label": "Tipo de negocio",
                    "required": True,
                    "options": [
                        "restaurante",
                        "tienda",
                        "supermercado",
                        "farmacia",
                        "peluqueria",
                        "taller",
                        "oficina",
                        "bar",
                        "otro",
                    ],
                },
                "phone": {
                    "type": "text",
                    "label": "Telefono",
                    "required": False,
                },
                "email": {
                    "type": "email",
                    "label": "Email",
                    "required": False,
                },
                "website": {
                    "type": "url",
                    "label": "Sitio web",
                    "required": False,
                },
                "opening_hours": {
                    "type": "text",
                    "label": "Horario de apertura",
                    "required": False,
                },
                "year_established": {
                    "type": "number",
                    "label": "Ano de fundacion",
                    "required": False,
                },
            },
        },
    )

    Category.objects.get_or_create(
        slug="agencia-inmobiliaria",
        defaults={
            "name": "Agencia Inmobiliaria",
            "icon": "BuildingOfficeIcon",
            "fields_schema": {
                "specialization": {
                    "type": "select",
                    "label": "Especializacion",
                    "required": True,
                    "options": [
                        "residencial",
                        "comercial",
                        "industrial",
                        "terrenos",
                        "mixta",
                    ],
                },
                "num_agents": {
                    "type": "number",
                    "label": "Numero de agentes",
                    "required": False,
                },
                "license_number": {
                    "type": "text",
                    "label": "Numero de licencia",
                    "required": False,
                },
                "services": {
                    "type": "multiselect",
                    "label": "Servicios",
                    "required": False,
                    "options": [
                        "venta",
                        "alquiler",
                        "gestion",
                        "tasacion",
                        "asesoria_legal",
                        "reformas",
                    ],
                },
                "phone": {
                    "type": "text",
                    "label": "Telefono",
                    "required": False,
                },
                "email": {
                    "type": "email",
                    "label": "Email",
                    "required": False,
                },
                "website": {
                    "type": "url",
                    "label": "Sitio web",
                    "required": False,
                },
            },
        },
    )

    Category.objects.get_or_create(
        slug="hotel",
        defaults={
            "name": "Hotel",
            "icon": "BuildingOffice2Icon",
            "fields_schema": {
                "star_rating": {
                    "type": "select",
                    "label": "Estrellas",
                    "required": True,
                    "options": ["1", "2", "3", "4", "5"],
                },
                "num_rooms": {
                    "type": "number",
                    "label": "Numero de habitaciones",
                    "required": False,
                },
                "amenities": {
                    "type": "multiselect",
                    "label": "Amenidades",
                    "required": False,
                    "options": [
                        "piscina",
                        "wifi",
                        "restaurante",
                        "gimnasio",
                        "spa",
                        "parking",
                        "aire_acondicionado",
                        "lavanderia",
                        "sala_conferencias",
                    ],
                },
                "check_in_time": {
                    "type": "text",
                    "label": "Hora de check-in",
                    "required": False,
                },
                "check_out_time": {
                    "type": "text",
                    "label": "Hora de check-out",
                    "required": False,
                },
                "phone": {
                    "type": "text",
                    "label": "Telefono",
                    "required": False,
                },
                "email": {
                    "type": "email",
                    "label": "Email",
                    "required": False,
                },
                "website": {
                    "type": "url",
                    "label": "Sitio web",
                    "required": False,
                },
            },
        },
    )


def remove_categories(apps, schema_editor):
    Category = apps.get_model("properties", "Category")
    Category.objects.filter(
        slug__in=["negocio", "agencia-inmobiliaria", "hotel"]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("properties", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_categories, remove_categories),
    ]
