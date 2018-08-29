FROM node:8
ENV NETWORK testnet
ENV DB_URI /app/sqlite/db.sqlite

RUN mkdir /app /app/sqlite
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 8080
CMD ["node", "server/index.js"]
