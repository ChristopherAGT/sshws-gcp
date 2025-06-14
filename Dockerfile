# ╔══════════════════════════════════════════════╗
# ║ 🛠️ ETAPA 1: Compilación (builder)            ║
# ╚══════════════════════════════════════════════╝
FROM alpine:latest AS builder

RUN apk update && apk add --no-cache \
    gcc g++ cmake make linux-headers

WORKDIR /build
COPY badvpn-src/ ./badvpn-src

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

# ╔══════════════════════════════════════════════╗
# ║ 🚀 ETAPA 2: Imagen final (ligera)            ║
# ╚══════════════════════════════════════════════╝
FROM alpine:latest

RUN apk add --no-cache \
    nodejs \
    tmux \
    dropbear \
    bash

COPY --from=builder /build/badvpn-src/build/badvpn-tun2socks /usr/local/bin/
COPY --from=builder /build/badvpn-src/build/badvpn-udpgw /usr/local/bin/

WORKDIR /workdir
COPY proxy3.js ./
COPY run.sh ./

RUN adduser -DH toji -s /bin/false && \
    echo "toji:fushiguro" | chpasswd && \
    chmod +x /workdir/run.sh

EXPOSE 8080

CMD ["/bin/bash", "./run.sh"]
