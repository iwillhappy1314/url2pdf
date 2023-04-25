FROM almalinux:latest

# 复制文件到工作目录
ADD . /app

# 进入工作目录
WORKDIR /app

# 安装依赖，Chrome, 中文语言支持
RUN dnf install atk at-spi2-atk libdrm libXcomposite libXdamage libXrandr mesa-libgbm pango alsa-lib wget -y  \
    && dnf install -y langpacks-zh_CN \
    && dnf module install nodejs:18 -y  \
    && wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm  \
    && dnf localinstall ./google-chrome-stable_current_x86_64.rpm -y  \
    && rm -f ./google-chrome-stable_current_x86_64.rpm \
    && mkdir -p /usr/share/fonts/chinese/ \
    && cp fonts/* /usr/share/fonts/chinese \
    && cd /usr/share/fonts/chinese/ \
    && fc-cache -fv

# 安装依赖
RUN npm install

# 暴露端口
EXPOSE 3030 3000

# 开始命令
CMD ["node", "./app.js"]