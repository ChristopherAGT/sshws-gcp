> **⚠️ Este repositorio ha sido archivado y ya no está siendo mantenido por el autor.**

# 📡 BadVPN

---

## 📘 Introducción

En este proyecto alojo parte de mi software de red de código abierto.  
Todo el software está escrito en C y utiliza un *framework* desarrollado a medida para programación basada en eventos.  
El amplio uso compartido de código es la razón por la que todo el software se empaqueta junto.  
Sin embargo, es posible compilar solo los componentes necesarios para evitar dependencias adicionales.

---

## 🧩 Lenguaje de programación NCD

**NCD (Network Configuration Daemon)** es un demonio y lenguaje de programación/script para la configuración de interfaces de red y otros aspectos del sistema operativo.  
Implementa diversas funcionalidades como módulos integrados, que pueden ser usados desde un programa NCD donde y para lo que el usuario los necesite.  

Esta modularidad hace que NCD sea extremadamente flexible y extensible.  
Hace un muy buen trabajo con dispositivos *hotplug* como interfaces de red USB y detección de enlaces en dispositivos cableados.  
Se pueden añadir nuevas funcionalidades implementando sentencias como módulos en C usando una interfaz sencilla.

---

## 🔀 Proxificador a nivel de red Tun2socks

El programa **tun2socks** "socksifica" conexiones TCP a nivel de red.  
Implementa un dispositivo TUN que acepta todas las conexiones TCP entrantes (sin importar la IP de destino), y las redirige a través de un servidor SOCKS.  

Esto permite redirigir todas las conexiones a través de SOCKS, sin necesidad de soporte en las aplicaciones.  
Puede usarse, por ejemplo, para reenviar conexiones a través de un servidor SSH remoto.

---

## 🔗 VPN entre pares (Peer-to-peer)

La parte VPN de este proyecto implementa una red de **Capa 2 (Ethernet)** entre los pares (nodos VPN).  
Los pares se conectan a un servidor central que actúa como proxy de comunicación permitiendo que los pares establezcan conexiones directas entre sí (conexiones de datos).

Estas conexiones se usan para transferir datos de red (tramas Ethernet) y pueden asegurarse con diversos mecanismos.  
Algunas características destacadas son:

- Transporte por UDP y TCP
- Convergencia rápida cuando un nuevo par se une
- IGMP snooping para entregar multidifusión eficientemente (por ejemplo, IPTV)
- **Doble SSL**: si se habilita SSL, no solo los pares se conectan al servidor usando SSL, sino que también usan una capa adicional de SSL al intercambiar mensajes a través del servidor
- Funcionalidades relacionadas con el problema del NAT:
  - Puede funcionar con múltiples capas de NAT (requiere configuración)
  - Los pares locales dentro de un mismo NAT pueden comunicarse directamente
  - Retransmisión como respaldo (requiere configuración)

---

## ⚙️ Requisitos

- **NCD** solo funciona en **Linux**.  
- **Tun2socks** funciona en **Linux y Windows**.  
- La **VPN P2P** funciona en **Linux, Windows y FreeBSD** (aunque no se prueba con frecuencia).

---

## 🛠️ Instalación

El sistema de compilación está basado en **CMake**.  
En Linux, se pueden usar los siguientes comandos para compilar:

```bash
cd <directorio-fuente-badvpn>
mkdir build
cd build
cmake .. -DCMAKE_INSTALL_PREFIX=<directorio-instalación>
make install
```

Si solo necesitas `tun2socks` o `udpgw`, añade los siguientes argumentos al comando `cmake`:

```bash
-DBUILD_NOTHING_BY_DEFAULT=1 -DBUILD_TUN2SOCKS=1 -DBUILD_UDPGW=1
```

En caso contrario (si quieres el software VPN), primero deberás instalar las bibliotecas **OpenSSL y NSS** y asegurarte de que **CMake** pueda encontrarlas.

🔸 Las compilaciones para Windows no se proporcionan.  
Puedes compilar desde el código fuente usando **Visual Studio**, siguiendo las instrucciones en el archivo `BUILD-WINDOWS-VisualStudio.md`.

---

## 📄 Licencia

La mayoría del código está bajo la licencia **BSD de 3 cláusulas**, como se muestra a continuación:

```
Copyright (c) 2009, Ambroz Bizjak <ambrop7@gmail.com>
Todos los derechos reservados.

La redistribución y el uso en formas de código fuente y binario, con o sin
modificación, están permitidos siempre que se cumplan las siguientes condiciones:
1. Las redistribuciones de código fuente deben conservar el aviso de copyright
   anterior, esta lista de condiciones y el siguiente descargo de responsabilidad.
2. Las redistribuciones en forma binaria deben reproducir el aviso de copyright
   anterior, esta lista de condiciones y el siguiente descargo de responsabilidad
   en la documentación u otros materiales proporcionados con la distribución.
3. Ni el nombre del autor ni los nombres de sus colaboradores pueden usarse para
   respaldar o promocionar productos derivados de este software sin un permiso
   específico previo por escrito.

ESTE SOFTWARE SE PROPORCIONA POR LOS TITULARES DE DERECHOS DE AUTOR Y
COLABORADORES "TAL CUAL" Y CUALQUIER GARANTÍA EXPRESA O IMPLÍCITA, INCLUYENDO,
PERO NO LIMITÁNDOSE A, LAS GARANTÍAS IMPLÍCITAS DE COMERCIALIZACIÓN Y ADECUACIÓN
PARA UN PROPÓSITO PARTICULAR SON RECHAZADAS. EN NINGÚN CASO EL AUTOR SERÁ
RESPONSABLE POR NINGÚN DAÑO DIRECTO, INDIRECTO, INCIDENTAL, ESPECIAL, EJEMPLAR O
CONSECUENTE (INCLUYENDO, PERO NO LIMITADO A, LA ADQUISICIÓN DE BIENES O SERVICIOS
SUSTITUTOS; PÉRDIDA DE USO, DATOS O BENEFICIOS; O INTERRUPCIÓN DE NEGOCIO) SEA
CUAL FUERE LA CAUSA Y BAJO CUALQUIER TEORÍA DE RESPONSABILIDAD, YA SEA EN CONTRATO,
RESPONSABILIDAD ESTRICTA O AGRAVIO (INCLUYENDO NEGLIGENCIA O DE OTRA MANERA) QUE
SURJA DE CUALQUIER MANERA DEL USO DE ESTE SOFTWARE, INCLUSO SI SE HA ADVERTIDO DE
LA POSIBILIDAD DE TALES DAÑOS.
```

---

## 🧾 Código de terceros

- **lwIP** – Una pila TCP/IP liviana.  
  📄 Licencia: `lwip/COPYING`
