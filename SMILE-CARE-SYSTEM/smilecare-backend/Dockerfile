FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY . .

RUN ./mvnw clean package -DskipTests

EXPOSE 8085

CMD ["java", "-jar", "target/smilecare-backend-0.0.1-SNAPSHOT.jar"]