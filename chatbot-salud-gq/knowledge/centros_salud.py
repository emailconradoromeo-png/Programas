"""
Directorio de centros de salud de Guinea Ecuatorial por región.
Datos basados en la estructura del sistema sanitario nacional.
"""

CENTROS_SALUD = {
    # ===================== REGIÓN INSULAR =====================
    "malabo": {
        "region": "Bioko Norte (Malabo)",
        "nombre_fang": "Malabo - Bioko Norte",
        "centros": [
            {
                "nombre": "Hospital Regional de Malabo",
                "tipo": "Hospital Regional",
                "direccion": "Malabo Centro, Bioko Norte",
                "telefono": "+240 333 09 24 00",
                "servicios": [
                    "Urgencias 24h", "Medicina Interna", "Cirugía",
                    "Pediatría", "Maternidad", "Laboratorio",
                    "Radiología", "Farmacia",
                ],
                "horario": "24 horas (Urgencias), 8:00-15:00 (Consultas)",
                "notas": "Principal hospital de referencia de la región insular",
            },
            {
                "nombre": "Hospital La Paz",
                "tipo": "Hospital Privado",
                "direccion": "Barrio de Ela Nguema, Malabo",
                "telefono": "+240 333 09 33 50",
                "servicios": [
                    "Consulta General", "Especialidades",
                    "Laboratorio", "Farmacia", "Maternidad",
                ],
                "horario": "8:00-20:00 (Lunes a Sábado)",
                "notas": "Hospital privado con buena atención",
            },
            {
                "nombre": "Centro de Salud de Ela Nguema",
                "tipo": "Centro de Salud",
                "direccion": "Barrio Ela Nguema, Malabo",
                "telefono": "+240 222 XXX XXX",
                "servicios": [
                    "Consulta General", "Vacunación",
                    "Control Prenatal", "Planificación Familiar",
                    "Tratamiento de Malaria",
                ],
                "horario": "8:00-15:00 (Lunes a Viernes)",
                "notas": "Centro de atención primaria",
            },
            {
                "nombre": "Centro de Salud de Semu",
                "tipo": "Centro de Salud",
                "direccion": "Barrio Semu, Malabo",
                "telefono": "+240 222 XXX XXX",
                "servicios": [
                    "Consulta General", "Vacunación",
                    "Control Prenatal", "Farmacia básica",
                ],
                "horario": "8:00-15:00 (Lunes a Viernes)",
                "notas": "Atención primaria comunitaria",
            },
            {
                "nombre": "Centro de Salud de New Building",
                "tipo": "Centro de Salud",
                "direccion": "Barrio New Building, Malabo",
                "telefono": "+240 222 XXX XXX",
                "servicios": [
                    "Consulta General", "Vacunación",
                    "Tratamiento de Malaria", "Control Prenatal",
                ],
                "horario": "8:00-15:00 (Lunes a Viernes)",
                "notas": "Atención primaria",
            },
            {
                "nombre": "Centro de Control del VIH/SIDA",
                "tipo": "Centro Especializado",
                "direccion": "Malabo Centro",
                "telefono": "+240 333 09 XX XX",
                "servicios": [
                    "Pruebas de VIH (confidencial y gratuito)",
                    "Tratamiento Antirretroviral",
                    "Consejería", "Prevención de transmisión madre-hijo",
                ],
                "horario": "8:00-15:00 (Lunes a Viernes)",
                "notas": "Pruebas gratuitas y confidenciales",
            },
        ],
    },
    "luba": {
        "region": "Bioko Sur (Luba)",
        "nombre_fang": "Luba - Bioko Sur",
        "centros": [
            {
                "nombre": "Hospital Distrital de Luba",
                "tipo": "Hospital Distrital",
                "direccion": "Luba, Bioko Sur",
                "telefono": "+240 333 XX XX XX",
                "servicios": [
                    "Urgencias", "Consulta General", "Maternidad",
                    "Laboratorio básico", "Farmacia",
                ],
                "horario": "24 horas (Urgencias), 8:00-15:00 (Consultas)",
                "notas": "Hospital de referencia para Bioko Sur",
            },
        ],
    },
    # ===================== REGIÓN CONTINENTAL =====================
    "bata": {
        "region": "Litoral (Bata)",
        "nombre_fang": "Bata - Litoral",
        "centros": [
            {
                "nombre": "Hospital Regional de Bata",
                "tipo": "Hospital Regional",
                "direccion": "Bata Centro, Litoral",
                "telefono": "+240 333 08 22 00",
                "servicios": [
                    "Urgencias 24h", "Medicina Interna", "Cirugía",
                    "Pediatría", "Maternidad", "Laboratorio",
                    "Radiología", "Banco de Sangre", "Farmacia",
                ],
                "horario": "24 horas (Urgencias), 8:00-15:00 (Consultas)",
                "notas": "Principal hospital de referencia de la región continental",
            },
            {
                "nombre": "Hospital Virgen de Guadalupe",
                "tipo": "Hospital Misionero",
                "direccion": "Bata, Litoral",
                "telefono": "+240 333 08 XX XX",
                "servicios": [
                    "Consulta General", "Maternidad",
                    "Pediatría", "Laboratorio", "Farmacia",
                ],
                "horario": "8:00-17:00 (Lunes a Viernes), 8:00-13:00 (Sábados)",
                "notas": "Hospital misionero con buena atención y precios accesibles",
            },
            {
                "nombre": "Centro de Salud de Bata Comandachina",
                "tipo": "Centro de Salud",
                "direccion": "Barrio Comandachina, Bata",
                "telefono": "+240 222 XXX XXX",
                "servicios": [
                    "Consulta General", "Vacunación",
                    "Control Prenatal", "Planificación Familiar",
                    "Tratamiento de Malaria",
                ],
                "horario": "8:00-15:00 (Lunes a Viernes)",
                "notas": "Centro de atención primaria",
            },
            {
                "nombre": "Centro de Salud de Bata Mondoasi",
                "tipo": "Centro de Salud",
                "direccion": "Barrio Mondoasi, Bata",
                "telefono": "+240 222 XXX XXX",
                "servicios": [
                    "Consulta General", "Vacunación",
                    "Control Prenatal", "Farmacia básica",
                ],
                "horario": "8:00-15:00 (Lunes a Viernes)",
                "notas": "Atención primaria comunitaria",
            },
            {
                "nombre": "Centro de Control del VIH/SIDA Bata",
                "tipo": "Centro Especializado",
                "direccion": "Bata Centro",
                "telefono": "+240 333 08 XX XX",
                "servicios": [
                    "Pruebas de VIH (confidencial y gratuito)",
                    "Tratamiento Antirretroviral",
                    "Consejería",
                ],
                "horario": "8:00-15:00 (Lunes a Viernes)",
                "notas": "Pruebas gratuitas y confidenciales",
            },
        ],
    },
    "ebebiyin": {
        "region": "Kie-Ntem (Ebebiyín)",
        "nombre_fang": "Ebebiyín - Kie-Ntem",
        "centros": [
            {
                "nombre": "Hospital Distrital de Ebebiyín",
                "tipo": "Hospital Distrital",
                "direccion": "Ebebiyín, Kie-Ntem",
                "telefono": "+240 333 XX XX XX",
                "servicios": [
                    "Urgencias", "Consulta General", "Maternidad",
                    "Pediatría", "Laboratorio", "Farmacia",
                ],
                "horario": "24 horas (Urgencias), 8:00-15:00 (Consultas)",
                "notas": "Hospital de referencia para la provincia de Kie-Ntem",
            },
            {
                "nombre": "Centro de Salud de Ebebiyín",
                "tipo": "Centro de Salud",
                "direccion": "Ebebiyín Centro",
                "telefono": "+240 222 XXX XXX",
                "servicios": [
                    "Consulta General", "Vacunación",
                    "Control Prenatal", "Tratamiento de Malaria",
                ],
                "horario": "8:00-15:00 (Lunes a Viernes)",
                "notas": "Atención primaria",
            },
        ],
    },
    "mongomo": {
        "region": "Wele-Nzas (Mongomo)",
        "nombre_fang": "Mongomo - Wele-Nzas",
        "centros": [
            {
                "nombre": "Hospital Distrital de Mongomo",
                "tipo": "Hospital Distrital",
                "direccion": "Mongomo, Wele-Nzas",
                "telefono": "+240 333 XX XX XX",
                "servicios": [
                    "Urgencias", "Consulta General", "Maternidad",
                    "Laboratorio", "Farmacia",
                ],
                "horario": "24 horas (Urgencias), 8:00-15:00 (Consultas)",
                "notas": "Hospital de referencia para Wele-Nzas",
            },
        ],
    },
    "evinayong": {
        "region": "Centro-Sur (Evinayong)",
        "nombre_fang": "Evinayong - Centro-Sur",
        "centros": [
            {
                "nombre": "Hospital Distrital de Evinayong",
                "tipo": "Hospital Distrital",
                "direccion": "Evinayong, Centro-Sur",
                "telefono": "+240 333 XX XX XX",
                "servicios": [
                    "Urgencias", "Consulta General", "Maternidad",
                    "Laboratorio básico", "Farmacia",
                ],
                "horario": "24 horas (Urgencias), 8:00-15:00 (Consultas)",
                "notas": "Hospital de referencia para la provincia Centro-Sur",
            },
        ],
    },
    "aconibe": {
        "region": "Wele-Nzas (Aconibe)",
        "nombre_fang": "Aconibe - Wele-Nzas",
        "centros": [
            {
                "nombre": "Centro de Salud de Aconibe",
                "tipo": "Centro de Salud",
                "direccion": "Aconibe, Wele-Nzas",
                "telefono": "+240 222 XXX XXX",
                "servicios": [
                    "Consulta General", "Vacunación",
                    "Maternidad básica", "Farmacia básica",
                ],
                "horario": "8:00-15:00 (Lunes a Viernes)",
                "notas": "Centro rural con servicios básicos",
            },
        ],
    },
    "annobon": {
        "region": "Annobón",
        "nombre_fang": "Annobón (Pagalu)",
        "centros": [
            {
                "nombre": "Centro de Salud de Annobón",
                "tipo": "Centro de Salud",
                "direccion": "San Antonio de Palé, Annobón",
                "telefono": "+240 222 XXX XXX",
                "servicios": [
                    "Consulta General", "Maternidad básica",
                    "Vacunación", "Farmacia básica",
                ],
                "horario": "8:00-15:00 (Lunes a Viernes)",
                "notas": "Único centro de salud en la isla. Casos graves se evacúan a Malabo.",
            },
        ],
    },
    # ===================== ZONAS RURALES =====================
    "zonas_rurales": {
        "region": "Zonas Rurales (Poblados)",
        "nombre_fang": "Bibuan (Poblados)",
        "centros": [
            {
                "nombre": "Puestos de Salud Rurales",
                "tipo": "Puesto de Salud",
                "direccion": "Distribuidos en poblados de la región continental",
                "telefono": "Contactar al jefe del poblado",
                "servicios": [
                    "Primeros auxilios", "Distribución de mosquiteros",
                    "Vacunación (campañas)", "Desparasitación",
                    "Derivación a hospital",
                ],
                "horario": "Variable - generalmente mañanas",
                "notas": (
                    "Los puestos de salud rurales tienen recursos limitados. "
                    "Para emergencias, trasladarse al hospital distrital más cercano. "
                    "Algunos poblados cuentan con agentes comunitarios de salud."
                ),
            },
            {
                "nombre": "Agentes Comunitarios de Salud",
                "tipo": "Servicio Comunitario",
                "direccion": "Poblados de las provincias continentales",
                "telefono": "Contactar al jefe del poblado o delegación sanitaria",
                "servicios": [
                    "Pruebas rápidas de malaria",
                    "Distribución de tratamiento antimalárico",
                    "Educación sanitaria",
                    "Derivación a centros de salud",
                ],
                "horario": "Disponible en la comunidad",
                "notas": (
                    "Los agentes comunitarios son vecinos del poblado formados "
                    "para dar atención básica. Pueden hacer pruebas de malaria "
                    "y dar el primer tratamiento."
                ),
            },
        ],
    },
}

# Números de emergencia
EMERGENCIAS = {
    "policia": {"numero": "113", "descripcion": "Policía Nacional"},
    "bomberos": {"numero": "115", "descripcion": "Bomberos"},
    "emergencias_medicas": {
        "numero": "114",
        "descripcion": "Emergencias Médicas",
    },
    "hospital_malabo": {
        "numero": "+240 333 09 24 00",
        "descripcion": "Hospital Regional de Malabo",
    },
    "hospital_bata": {
        "numero": "+240 333 08 22 00",
        "descripcion": "Hospital Regional de Bata",
    },
}


def buscar_centros(ubicacion):
    """Busca centros de salud por ubicación."""
    ubicacion = ubicacion.lower().strip()
    resultados = []

    for clave, zona in CENTROS_SALUD.items():
        if (
            ubicacion in clave
            or ubicacion in zona["region"].lower()
            or ubicacion in zona["nombre_fang"].lower()
        ):
            resultados.append((clave, zona))

    return resultados


def obtener_centro_mas_cercano(ubicacion):
    """Retorna los centros de salud de una ubicación específica."""
    resultados = buscar_centros(ubicacion)
    if resultados:
        return resultados[0]
    # Si no encuentra, buscar en zonas rurales
    return ("zonas_rurales", CENTROS_SALUD["zonas_rurales"])


def listar_regiones():
    """Lista todas las regiones disponibles."""
    regiones = []
    for clave, zona in CENTROS_SALUD.items():
        if clave != "zonas_rurales":
            regiones.append(f"- {zona['region']}")
    return "\n".join(regiones)


def formatear_centro(centro):
    """Formatea la información de un centro de salud."""
    texto = f"*{centro['nombre']}*\n"
    texto += f"Tipo: {centro['tipo']}\n"
    texto += f"Dirección: {centro['direccion']}\n"
    texto += f"Teléfono: {centro['telefono']}\n"
    texto += f"Horario: {centro['horario']}\n"
    texto += f"Servicios: {', '.join(centro['servicios'])}\n"
    if centro.get("notas"):
        texto += f"Nota: {centro['notas']}\n"
    return texto


def formatear_emergencias():
    """Retorna los números de emergencia formateados."""
    texto = "*NÚMEROS DE EMERGENCIA*\n\n"
    for clave, info in EMERGENCIAS.items():
        texto += f"- {info['descripcion']}: {info['numero']}\n"
    return texto
