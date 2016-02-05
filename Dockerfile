# phusion/baseimage-docker runs init process and other nice things
FROM phusion/baseimage:0.9.7

# disable SSH
RUN rm -rf /etc/service/sshd /etc/my_init.d/00_regen_ssh_host_keys.sh

# install curl so we can download other things
RUN apt-get update && apt-get install -y curl

# download and unzip node to /usr
RUN curl -sSL http://nodejs.org/dist/v5.3.0/node-v5.3.0-linux-x64.tar.gz | tar -C /usr --strip-components=1 -xzf -

# environment variables
ENV NODE_ENV production
ENV HOME /root

# the baseimage init process
CMD ["/sbin/my_init"]

# set up a volume to use files from the host
VOLUME /host

# create a directory for the runit script and add it
ADD run.sh /etc/service/app/run

# ===== install the application =====
ADD . /app
