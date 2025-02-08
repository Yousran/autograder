# Gunakan image Node.js yang ringan
FROM node:23.4-alpine

# Set direktori kerja di dalam container
WORKDIR /app

# Salin package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin seluruh kode aplikasi ke dalam container
COPY . .

# Ekspose port yang akan digunakan aplikasi
EXPOSE 3000

# Jalankan aplikasi
CMD ["npm", "run", "dev"]