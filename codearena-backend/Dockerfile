# Step 1: Build the Java Backend using Java 22
FROM maven:3.9.6-eclipse-temurin-22 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Step 2: Setup the Execution Environment using Java 22
FROM eclipse-temurin:22-jdk-jammy
WORKDIR /app

# Install Python and C++ to run user code
RUN apt-get update && \
    apt-get install -y python3 g++ && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy the built backend jar
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]