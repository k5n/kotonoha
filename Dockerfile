# This Dockerfile defines a build container for Linux (Ubuntu 22.04) to build and package the application.
#
# This Dockerfile is intended for local development only, and should be used by developers working on Linux.
# Release builds are performed by GitHub Actions workflows; do not use this container for production releases.
#
# cSpell:ignore noninteractive ignore libwebkit libappindicator librsvg patchelf libasound libespeak libpcaudio libsonic

FROM ubuntu:jammy-20250730

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y \
    curl \
    build-essential \
    clang \
    cmake \
    libwebkit2gtk-4.1-dev \
    libappindicator3-dev \
    librsvg2-dev \
    patchelf \
    ca-certificates \
    git \
    xdg-utils \
    file \
    libssl-dev \
    libasound2-dev \
    libespeak-ng-dev \
    libpcaudio-dev \
    libsonic-dev

RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y nodejs
RUN npm install -g @tauri-apps/cli

ARG UID=1000
ARG GID=1000
ARG USER_NAME=dev
ARG GROUP_NAME=dev

RUN if [ "$UID" -ne 0 ] && [ "$GID" -ne 0 ]; then \
    groupadd -g ${GID} ${GROUP_NAME} && \
    useradd -m -u ${UID} -g ${GID} ${USER_NAME}; \
    fi

USER ${USER_NAME}

RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/home/${USER_NAME}/.cargo/bin:${PATH}"

WORKDIR /app
