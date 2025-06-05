cmake_minimum_required(VERSION 2.8)
project(BADVPN C)

# Rutas de módulos personalizados
set(CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/cmake/modules")

# Inclusión de módulos de CMake
include(GNUInstallDirs)
include(TestBigEndian)
include(CheckIncludeFiles)
include(CheckSymbolExists)
include(CheckTypeSize)

# Opciones generales
option(WITH_PLUGIN_LIBS "Compilar versiones PIC de todas las bibliotecas para uso en plugins" OFF)

# Inicialización de componentes a compilar
set(BUILD_COMPONENTS)

# Macro para definir interruptores de compilación
macro(build_switch name text default)
    if (BUILD_NOTHING_BY_DEFAULT)
        option(BUILD_${name} "${text}" OFF)
    else ()
        option(BUILD_${name} "${text}" "${default}")
    endif ()
    list(APPEND BUILD_COMPONENTS "${name}")
endmacro ()

# Detectar Emscripten
if (CMAKE_C_COMPILER MATCHES "/emcc$")
    set(EMSCRIPTEN ON)
else ()
    set(EMSCRIPTEN OFF)
endif ()

# Flags según entorno
set(ON_IF_NOT_EMSCRIPTEN OFF)
set(ON_IF_LINUX OFF)
set(ON_IF_LINUX_OR_EMSCRIPTEN OFF)

if (NOT EMSCRIPTEN)
    set(ON_IF_NOT_EMSCRIPTEN ON)
endif ()

if (CMAKE_SYSTEM_NAME STREQUAL "Linux")
    set(ON_IF_LINUX ON)
endif ()

if (CMAKE_SYSTEM_NAME STREQUAL "Linux" OR EMSCRIPTEN)
    set(ON_IF_LINUX_OR_EMSCRIPTEN ON)
endif ()

# Definición de componentes a compilar
build_switch(EXAMPLES    "Compilar programas de ejemplo" ON)
build_switch(TESTS       "Compilar programas de prueba" ON)
build_switch(SERVER      "Compilar badvpn-server"       ${ON_IF_NOT_EMSCRIPTEN})
build_switch(CLIENT      "Compilar badvpn-client"       ${ON_IF_NOT_EMSCRIPTEN})
build_switch(FLOODER     "Compilar badvpn-flooder"      ${ON_IF_NOT_EMSCRIPTEN})
build_switch(TUN2SOCKS   "Compilar badvpn-tun2socks"    ${ON_IF_NOT_EMSCRIPTEN})
build_switch(UDPGW       "Compilar badvpn-udpgw"        ${ON_IF_NOT_EMSCRIPTEN})
build_switch(NCD         "Compilar badvpn-ncd"          ${ON_IF_LINUX_OR_EMSCRIPTEN})
build_switch(DOSTEST     "Compilar dostest-server y dostest-attacker" OFF)

# Restricciones de plataforma
if (BUILD_NCD AND NOT (CMAKE_SYSTEM_NAME STREQUAL "Linux"))
    message(FATAL_ERROR "NCD solo está disponible en Linux")
endif ()

# Dependencias externas
if (BUILD_CLIENT OR BUILD_SERVER)
    find_package(OpenSSL REQUIRED)
    set(LIBCRYPTO_INCLUDE_DIRS "${OpenSSL_INCLUDE_DIRS}")
    set(LIBCRYPTO_LIBRARY_DIRS "${OpenSSL_LIBRARY_DIRS}")
    set(LIBCRYPTO_LIBRARIES    "${OpenSSL_LIBRARIES}")
endif ()

if (BUILD_SERVER OR BUILD_CLIENT OR BUILD_FLOODER)
    find_package(NSPR REQUIRED)
    find_package(NSS REQUIRED)
endif ()

# Selección del backend del reactor
if (DEFINED BREACTOR_BACKEND)
    if (NOT (BREACTOR_BACKEND STREQUAL "badvpn" OR BREACTOR_BACKEND STREQUAL "glib"))
        message(FATAL_ERROR "Backend del reactor desconocido")
    endif ()
else ()
    if (EMSCRIPTEN)
        set(BREACTOR_BACKEND "emscripten")
    else ()
        set(BREACTOR_BACKEND "badvpn")
    endif ()
endif ()

# Definiciones según el backend del reactor
if (BREACTOR_BACKEND STREQUAL "badvpn")
    add_definitions(-DBADVPN_BREACTOR_BADVPN)
elseif (BREACTOR_BACKEND STREQUAL "glib")
    if (NOT (CMAKE_SYSTEM_NAME STREQUAL "Linux"))
        message(FATAL_ERROR "El backend GLib solo está disponible en Linux")
    endif ()
    find_package(GLIB2 REQUIRED)
    add_definitions(-DBADVPN_BREACTOR_GLIB)
elseif (BREACTOR_BACKEND STREQUAL "emscripten")
    add_definitions(-DBADVPN_BREACTOR_EMSCRIPTEN)
endif ()

# Rutas de inclusión y enlace
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${LIBCRYPTO_INCLUDE_DIRS}
    ${NSPR_INCLUDE_DIRS}
    ${NSS_INCLUDE_DIRS}
    ${GLIB2_INCLUDE_DIR}
    lwip/custom
    lwip/src/include
    lwip/src/include/ipv4
    lwip/src/include/ipv6
)

link_directories(
    ${LIBCRYPTO_LIBRARY_DIRS}
    ${NSPR_LIBRARY_DIRS}
    ${NSS_LIBRARY_DIRS}
)

# Comprobaciones de arquitectura
test_big_endian(BIG_ENDIAN)

check_type_size(int INT_SIZE)
if (NOT (INT_SIZE GREATER "3"))
    message(FATAL_ERROR "int debe tener al menos 32 bits")
endif ()

check_type_size(size_t SIZE_SIZE)
if (NOT (SIZE_SIZE GREATER INT_SIZE OR SIZE_SIZE EQUAL INT_SIZE))
    message(FATAL_ERROR "size_t debe ser mayor o igual a int")
endif ()

# Configuración de compilación según compilador
if (MSVC)
    add_definitions(-D_CRT_SECURE_NO_WARNINGS /wd4065 /wd4018 /wd4533 /wd4244 /wd4102 /wd4098 /wd4267 /wd4116)
    add_definitions(-D_WINSOCK_DEPRECATED_NO_WARNINGS)
else ()
    add_definitions(-std=gnu99 -Wall -Wno-unused-value -Wno-parentheses -Wno-switch -Wredundant-decls -Wshadow)
    if (NOT CMAKE_C_COMPILER_ID STREQUAL "PathScale")
        add_definitions(-Werror=implicit-function-declaration -Wno-switch-enum -Wno-unused-function -Wstrict-aliasing)
    endif ()
    if (CMAKE_C_COMPILER_ID MATCHES "^Clang")
        add_definitions(-Wno-initializer-overrides -Wno-tautological-constant-out-of-range-compare)
    endif ()
endif ()

# Configuración específica de plataforma
# (esta sección continúa igual, incluye Windows, Linux, FreeBSD, etc.)

# Definiciones por plataforma
# ... (continúa desde "if (WIN32)" en tu script original) ...

# Verificar syslog
check_include_files(syslog.h HAVE_SYSLOG_H)
if (HAVE_SYSLOG_H)
    add_definitions(-DBADVPN_USE_SYSLOG)
endif ()

# Endianness
if (BIG_ENDIAN)
    add_definitions(-DBADVPN_BIG_ENDIAN)
else ()
    add_definitions(-DBADVPN_LITTLE_ENDIAN)
endif ()

# Instalación de páginas de manual
install(
    FILES badvpn.7
    DESTINATION ${CMAKE_INSTALL_MANDIR}/man7
)

# Variables para construcción interna
set(BUILDING_SECURITY 0)
set(BUILDING_DHCPCLIENT 0)
set(BUILDING_ARPPROBE 0)
set(BUILDING_BKIO 0)
set(BUILDING_PREDICATE 0)
set(BUILDING_UDEVMONITOR 0)
set(BUILDING_THREADWORK 0)
set(BUILDING_RANDOM 0)

# Función para agregar bibliotecas internas
function(badvpn_add_library LIB_NAME LINK_BADVPN_LIBS LINK_SYS_LIBS LIB_SOURCES)
    set(BADVPN_LIBS_EXEC)
    set(BADVPN_LIBS_PLUGIN)

    foreach(LIB ${LINK_BADVPN_LIBS})
        list(APPEND BADVPN_LIBS_EXEC "${LIB}")
        list(APPEND BADVPN_LIBS_PLUGIN "${LIB}-plugin")
    endforeach()

    add_library("${LIB_NAME}" ${LIB_SOURCES})
    target_link_libraries("${LIB_NAME}" ${BADVPN_LIBS_EXEC} ${LINK_SYS_LIBS})
    set_target_properties("${LIB_NAME}" PROPERTIES OUTPUT_NAME "badvpn-${LIB_NAME}")

    if(WITH_PLUGIN_LIBS)
        if(BUILD_SHARED_LIBS)
            add_library("${LIB_NAME}-plugin" ALIAS "${LIB_NAME}")
        else()
            add_library("${LIB_NAME}-plugin" STATIC ${LIB_SOURCES})
            target_link_libraries("${LIB_NAME}-plugin" ${BADVPN_LIBS_PLUGIN} ${LINK_SYS_LIBS})
            set_target_properties("${LIB_NAME}-plugin" PROPERTIES OUTPUT_NAME "badvpn-${LIB_NAME}-plugin")
            set_target_properties("${LIB_NAME}-plugin" PROPERTIES POSITION_INDEPENDENT_CODE YES)
            set_target_properties("${LIB_NAME}-plugin" PROPERTIES COMPILE_FLAGS "-fvisibility=hidden -DBADVPN_PLUGIN")
        endif()
    endif()
endfunction()

# Subdirectorios de componentes internos
add_subdirectory(base)
add_subdirectory(system)
add_subdirectory(flow)
add_subdirectory(flowextra)

# Condicionales por dependencias
if (OpenSSL_FOUND)
    set(BUILDING_SECURITY 1)
    add_subdirectory(security)
endif ()

if (NSS_FOUND)
    add_subdirectory(nspr_support)
endif ()

if (BUILD_CLIENT OR BUILDING_SECURITY)
    set(BUILDING_THREADWORK 1)
    add_subdirectory(threadwork)
endif ()

if (BUILD_CLIENT OR BUILD_TUN2SOCKS)
    add_subdirectory(tuntap)
endif ()

if (BUILD_SERVER)
    set(BUILDING_PREDICATE 1)
    add_subdirectory(predicate)
endif ()

if (BUILD_CLIENT OR BUILD_FLOODER)
    add_subdirectory(server_connection)
endif ()

if (BUILD_NCD AND NOT EMSCRIPTEN)
    set(BUILDING_DHCPCLIENT 1)
    set(BUILDING_ARPPROBE 1)
    set(BUILDING_UDEVMONITOR 1)
    set(BUILDING_RANDOM 1)
    add_subdirectory(stringmap)
    add_subdirectory(udevmonitor)
    add_subdirectory(dhcpclient)
    add_subdirectory(arpprobe)
    add_subdirectory(random)
endif ()

if (BUILD_TUN2SOCKS)
    add_subdirectory(socksclient)
    add_subdirectory(udpgw_client)
    add_subdirectory(socks_udp_client)
    add_subdirectory(lwip)
endif ()

# Subdirectorios de ejemplos, tests y ejecutables
if (BUILD_EXAMPLES)
    add_subdirectory(examples)
endif ()

if (BUILD_TESTS)
    add_subdirectory(tests)
endif ()

if (BUILD_SERVER)
    add_subdirectory(server)
endif ()

if (BUILD_CLIENT)
    add_subdirectory(client)
endif ()

if (BUILD_FLOODER)
    add_subdirectory(flooder)
endif ()

if (BUILD_TUN2SOCKS)
    add_subdirectory(tun2socks)
endif ()

if (BUILD_UDPGW)
    add_subdirectory(udpgw)
endif ()

if (BUILD_NCD)
    add_subdirectory(ncd)
    if (NOT EMSCRIPTEN)
        add_subdirectory(ncd-request)
    endif ()
endif ()

if (BUILD_DOSTEST)
    add_subdirectory(dostest)
endif ()

# Mostrar resumen de compilación
message(STATUS "Componentes a compilar:")
foreach (name ${BUILD_COMPONENTS})
    string(TOLOWER "${name}" name_lc)
    if (BUILD_${name})
        set(building "yes")
    else ()
        set(building "no")
    endif ()
    message(STATUS "    ${name_lc} ${building}")
endforeach ()
