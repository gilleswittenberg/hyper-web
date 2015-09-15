# use Ubuntu 14 operating system
FROM  ubuntu:14.10

# maintainer
MAINTAINER    Gilles Wittenberg <docker.io@gilleswittenberg.com>

# install npm
# @LINK: https://nodesource.com/blog/nodejs-v012-iojs-and-the-nodesource-linux-repositories
RUN   apt-get install -y curl
RUN   curl -sL https://deb.nodesource.com/setup_0.12 | sudo bash -
RUN   apt-get install -y nodejs

# install http-server globally
# @LINK: https://www.npmjs.com/package/http-server
RUN   npm install http-server -g

# install app
RUN   mkdir -p /var/www
COPY  . /var/www/

# expose port 8080. Default port of http-server
EXPOSE  8080

# start http-server
CMD   http-server /var/www
