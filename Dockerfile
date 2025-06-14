# ╔══════════════════════════════════════════════╗
# ║ 🐧 BASE DE LA IMAGEN                         ║
# ╚══════════════════════════════════════════════╝
FROM alpine

# ╔══════════════════════════════════════════════╗
# ║ 🔧 INSTALACIÓN Y CONFIGURACIÓN               ║
# ╚══════════════════════════════════════════════╝
RUN apk update && apk add --no-cache \
    nodejs gcc g++ cmake make tmux dropbear bash linux-headers && \
    echo -e "/bin/false\n/usr/sbin/nologin\n" >> /etc/shells && \
    adduser -DH toji -s /bin/false && \
    echo -e "toji:fushiguro" | chpasswd

# ╔════════════════════════════════════════════════════════╗
# ║ 📦 OPCIONAL: SOPORTE PARA STUNNEL (comentado)         ║
# ╚════════════════════════════════════════════════════════╝
#WORKDIR /etc/stunnel
#RUN openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -sha256 -days 3650 -nodes -subj "/C=AR/ST=Tierra del Fuego/L=Usuahia/O=Common LLC/OU=Common LLC/CN=localhost"
#RUN cat key.pem cert.pem > stunnel.pem

# ╔══════════════════════════════════════════════╗
# ║ 📁 ARCHIVOS DE TRABAJO                       ║
# ╚══════════════════════════════════════════════╝
WORKDIR /workdir
COPY badvpn-src/ ./badvpn-src
COPY proxy3.js ./
#COPY stunnel.conf /etc/stunnel
COPY run.sh ./

# ╔══════════════════════════════════════════════╗
# ║ ⚙️ COMPILACIÓN DE BADVPN                     ║
# ╚══════════════════════════════════════════════╝
WORKDIR /workdir/badvpn-src
RUN mkdir -p build
WORKDIR /workdir/badvpn-src/build
RUN cmake .. -DBUILD_NOTHING_BY_DEFAULT=1 -DBUILD_TUN2SOCKS=1 -DBUILD_UDPGW=1 -DCMAKE_BUILD_TYPE=Release && \
    make -j2 install

# ╔══════════════════════════════════════════════╗
# ║ 🧹 LIMPIEZA FINAL                            ║
# ╚══════════════════════════════════════════════╝
WORKDIR /workdir
RUN rm -rf badvpn-src && chmod +x /workdir/run.sh

# ╔══════════════════════════════════════════════╗
# ║ 🚪 PUERTO EXPUESTO                          ║
# ╚══════════════════════════════════════════════╝
EXPOSE 8080

# ╔══════════════════════════════════════════════╗
# ║ 🚀 COMANDO DE EJECUCIÓN                     ║
# ╚══════════════════════════════════════════════╝
CMD ./run.sh
