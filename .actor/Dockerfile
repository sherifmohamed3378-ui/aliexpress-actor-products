FROM apify/actor-node-playwright-chrome:22-1.52.0

COPY package.json ./
RUN npm install --include=dev

COPY . ./

RUN npm run build

CMD npm run start
