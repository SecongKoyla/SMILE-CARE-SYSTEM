FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY smilecare-backend/ .

RUN ./mvnw clean package -DskipTests || mvn clean package -DskipTests

CMD ["java", "-jar", "target/*.jar"]