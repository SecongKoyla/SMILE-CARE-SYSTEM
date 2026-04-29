# Stage 1: Build backend with Maven
FROM maven:3.9-eclipse-temurin-17 AS backend-build
WORKDIR /app/backend

# Copy backend code
COPY smilecare-backend/ ./

# Fix permission for Maven wrapper
RUN chmod +x mvnw

# Build backend
RUN ./mvnw clean package -DskipTests

# Stage 2: Build frontend with Node
FROM node:20 AS frontend-build
WORKDIR /app/frontend

# Copy frontend code
COPY smilecare-frontend/ ./

# Install dependencies and build
RUN npm install
RUN npm run build

# Stage 3: Combine backend + frontend into minimal image
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

# Copy backend JAR
COPY --from=backend-build /app/backend/target/*.jar ./app.jar

# Copy frontend build
COPY --from=frontend-build /app/frontend/build ./frontend

# Expose port
EXPOSE 8085

# Start Spring Boot
CMD ["java", "-jar", "app.jar"]