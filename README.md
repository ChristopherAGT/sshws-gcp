# SSH WebSocket en Google Cloud con Docker

Este repositorio permite empaquetar y desplegar una imagen Docker que contiene un servidor SSH sobre WebSocket, ideal para túneles seguros y conexiones optimizadas.

---

## 📦 Requisitos previos

- Cuenta en Google Cloud Platform (GCP)
- Tener Docker y `gcloud` instalados y configurados
- Un proyecto en GCP con Artifact Registry habilitado

---

## 🔐 Autenticación con Artifact Registry

Antes de trabajar con Artifact Registry (repositorio de imágenes), debes autenticar Docker con tu región:

```bash
gcloud auth configure-docker [REGION]-docker.pkg.dev
```

> 📌 **NOTA:** Reemplaza `[REGION]` por tu región real, por ejemplo: `us-central1`.

---

## 📥 Clonar el repositorio

```bash
git clone https://github.com/ChristopherAGT/sshws-gcp.git
cd sshws-gcp
```

---

## 🛠️ Construir la imagen Docker

Usa el siguiente comando para construir tu imagen personalizada:

```bash
docker build -t [REGION]-docker.pkg.dev/[Nombre_del_Proyecto]/[Nombre_del_Repositorio]/[Nombre_de_la_Imagen]:[Version] .
```

> 📌 Reemplaza los campos entre corchetes:
> - `[REGION]`: Región de tu repositorio (ej. `us-central1`)
> - `[Nombre_del_Proyecto]`: Nombre de tu proyecto GCP
> - `[Nombre_del_Repositorio]`: Nombre de tu repositorio Artifact Registry
> - `[Nombre_de_la_Imagen]`: Cualquier nombre que elijas (ej. `sshws`)
> - `[Version]`: Versión de la imagen (ej. `1.0`, `latest`)

---

## ⬆️ Subir la imagen a Google Artifact Registry

```bash
docker push [REGION]-docker.pkg.dev/[Nombre_del_Proyecto]/[Nombre_del_Repositorio]/[Nombre_de_la_Imagen]:[Version]
```

> 📌 Asegúrate de que los campos coincidan con los usados en `docker build`.

---

## 🔑 Credenciales de acceso (Ejemplo)

**Usuario:** `Toji`  
**Contraseña:** `Fushiguro`

> ℹ️ Estas credenciales son solo un ejemplo. Cambia o protege estas credenciales si las usas en producción.

---

## 📄 Estructura del proyecto

```bash
sshws-gcp/
├── Dockerfile
├── proxy3.js
├── run.sh
├── stunnel.conf
├── README.md
└── ...
```

---

## ✅ Autor

- **ChristopherAGT** – Guatemalteco 🇬🇹

---
