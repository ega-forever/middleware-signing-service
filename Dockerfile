FROM node:8
ENV NETWORK testnet
ENV DB_PATH db.sqlite

RUN mkdir /app
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 8080
CMD ["node", "server/index.js"]