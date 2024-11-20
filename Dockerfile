# Step 1: Use the official Node.js image from Docker Hub
FROM node:18

# Step 2: Set the working directory inside the container
WORKDIR /usr/src/app

# Step 3: Copy the package.json and install dependencies
COPY package.json ./
RUN npm install

# Step 4: Copy the entire application to the working directory inside the container
COPY . .

# Step 5: Expose the port the app will run on
EXPOSE 3000

# Step 6: Run the app
CMD ["node", "app.js"]

