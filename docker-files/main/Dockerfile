#
# krain_main Dockerfile
# Author anandkumarpatel
##

# Pull base image.
FROM registry.runnable.com/core/krain_base:latest

WORKDIR /

# Download Repo
RUN git clone git@github.com:CodeNow/krain.git

WORKDIR /krain
RUN npm install

# Expose port to Host
EXPOSE 3000

# Define default command.
CMD ["/usr/local/bin/npm", "start"]
