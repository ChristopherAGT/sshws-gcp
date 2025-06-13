# 🐳 Imagen base mínima
FROM alpine:latest

# 📦 Actualización e instalación de paquetes necesarios
RUN apk update && apk add --no-cache \
    nodejs \
    gcc \
    g++ \
    cmake \
    make \
    tmux \
    dropbear \
    bash \
    linux-headers

# 🏗️ Definición de directorio de trabajo
WORKDIR /workdir

# 📁 Copia de archivos necesarios
COPY badvpn-src/ ./badvpn-src
COPY proxy3.js ./
COPY run.sh ./

# 🔧 Compilación de badvpn
WORKDIR /workdir/badvpn-src/build
RUN cmake .. \
    -DBUILD_NOTHING_BY_DEFAULT=1 \
    -DBUILD_TUN2SOCKS=1 \
    -DBUILD_UDPGW=1 \
    -DCMAKE_BUILD_TYPE=Release && \
    make -j$(nproc) install

# 🧹 Limpieza
WORKDIR /workdir
RUN rm -rf badvpn-src && \
    echo -e "/bin/false\n/usr/sbin/nologin\n" >> /etc/shells && \
    adduser -DH toji -s /bin/false && \
    echo "toji:fushiguro" | chpasswd && \
    chmod +x /workdir/run.sh

# 📤 Puerto expuesto
EXPOSE 8080

# 🚀 Comando de inicio
CMD ["./run.sh"]
