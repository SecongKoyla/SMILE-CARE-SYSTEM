# Stage 1: Build frontend (Vite)
FROM node:20 AS frontend-build
WORKDIR /app/frontend

COPY smilecare-frontend/ ./
RUN npm install
RUN npm run build

# Stage 2: Build backend
FROM maven:3.9-eclipse-temurin-17 AS backend-build
WORKDIR /app/backend

COPY smilecare-backend/ ./
RUN chmod +x mvnw

# ✅ VERY IMPORTANT: move React build into Spring Boot static folder
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static

RUN ./mvnw clean package -DskipTests

# Stage 3: Run app
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

COPY --from=backend-build /app/backend/target/*.jar app.jar

EXPOSE 8085
CMD ["java", "-jar", "app.jar"]