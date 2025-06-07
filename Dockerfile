FROM alpine

# Instalar dependencias necesarias para badvpn, dropbear, etc.
RUN apk update && \
    apk add --no-cache nodejs gcc g++ cmake make tmux dropbear bash linux-headers && \
    echo -e "/bin/false\n/usr/sbin/nologin\n" >> /etc/shells && \
    adduser -DH toji -s /bin/false && \
    echo "Toji:Fushiguro" | chpasswd

# Crear directorio de trabajo
WORKDIR /workdir

# Copiar archivos fuente
COPY badvpn-src/ ./badvpn-src
COPY proxy3.js ./
COPY run.sh ./

# Compilar badvpn
WORKDIR /workdir/badvpn-src
RUN mkdir -p build

WORKDIR /workdir/badvpn-src/build
RUN cmake .. -DBUILD_NOTHING_BY_DEFAULT=1 -DBUILD_TUN2SOCKS=1 -DBUILD_UDPGW=1 -DCMAKE_BUILD_TYPE=Release && \
    make -j2 install && \
    cd /workdir && rm -rf badvpn-src && \
    apk del gcc g++ cmake make linux-headers  # Limpiar herramientas de compilación

# Permisos
WORKDIR /workdir
RUN chmod +x run.sh

EXPOSE 8080
CMD ["./run.sh"]
