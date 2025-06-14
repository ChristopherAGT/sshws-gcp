# ╔══════════════════════════════════════════════╗
# ║ 🛠️ ETAPA 1: Compilación (builder)            ║
# ╚══════════════════════════════════════════════╝
FROM alpine:latest AS builder

# 📦 Instala solo lo necesario para compilar
RUN apk update && apk add --no-cache \
    gcc g++ cmake make linux-headers

# 📁 Copia los archivos fuente de BadVPN
WORKDIR /build
COPY badvpn-src/ ./badvpn-src

# 🏗️ Prepara y compila badvpn con tun2socks y udpgw
WORKDIR /build/badvpn-src
RUN mkdir build
WORKDIR /build/badvpn-src/build
RUN cmake .. \
    -DBUILD_NOTHING_BY_DEFAULT=1 \
    -DBUILD_TUN2SOCKS=1 \
    -DBUILD_UDPGW=1 \
    -DBADVPN_THREAD_SAFE=1 \
    -DCMAKE_BUILD_TYPE=Release && \
    make -j$(nproc)

# 🧹 Limpieza opcional del código fuente para reducir espacio en el builder
RUN rm -rf /build/badvpn-src/*/CMakeFiles \
           /build/badvpn-src/*/Makefile \
           /build/badvpn-src/CMakeCache.txt \
           /build/badvpn-src/build/CMake* \
           /build/badvpn-src/build/*.cmake \
           /build/badvpn-src/build/base/*.o

# ╔══════════════════════════════════════════════╗
# ║ 🚀 ETAPA 2: Imagen final (ligera)            ║
# ╚══════════════════════════════════════════════╝
FROM alpine:latest

# 📦 Instala solo lo necesario para ejecutar
RUN apk add --no-cache \
    nodejs \
    tmux \
    dropbear \
    bash

# 📂 Copia los binarios compilados desde el builder
COPY --from=builder /build/badvpn-src/build/badvpn-tun2socks /usr/local/bin/
COPY --from=builder /build/badvpn-src/build/badvpn-udpgw /usr/local/bin/

# 📁 Copia tus archivos adicionales al contenedor
WORKDIR /workdir
COPY proxy3.js ./
COPY run.sh ./

# 👤 Configura el usuario y permisos
RUN adduser -DH toji -s /bin/false && \
    echo "toji:fushiguro" | chpasswd && \
    chmod +x /workdir/run.sh

# 🌐 Expone el puerto para el servicio
EXPOSE 8080

# 🏁 Comando principal de ejecución
CMD ["/bin/bash", "./run.sh"]
