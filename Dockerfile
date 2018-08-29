FROM node:8
ENV NETWORK testnet
ENV DB_URI /db_sqlite

RUN mkdir /app
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 8080
CMD ["node", "server/index.js"]
