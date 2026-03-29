package com.codearena.code.service;

import org.springframework.stereotype.Service;
import java.io.*;
import java.nio.file.*;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class DockerExecutionService {

    public String executeCode(String code, String language, String input) {
        String tempDirName = "temp_" + UUID.randomUUID().toString();
        Path tempDirPath = Paths.get(System.getProperty("user.dir"), tempDirName);
        
        try {
            Files.createDirectories(tempDirPath);
            String fileName;
            String compileAndRunCmd;

            language = language.toLowerCase();
            boolean isWindows = System.getProperty("os.name").toLowerCase().startsWith("windows");

            // 👇 NO MORE DOCKER! We use native commands based on the OS.
            if (language.equals("java")) {
                fileName = "Main.java";
                compileAndRunCmd = "java Main.java < input.txt";
                
            } else if (language.equals("python")) {
                fileName = "script.py";
                // Render uses python3, Windows usually uses python
                String pyCmd = isWindows ? "python" : "python3"; 
                compileAndRunCmd = pyCmd + " -u script.py < input.txt";
                
            } else if (language.equals("cpp") || language.equals("c++")) {
                fileName = "main.cpp";
                // Windows outputs .exe, Linux outputs standard binary
                if (isWindows) {
                    compileAndRunCmd = "g++ main.cpp -o main.exe && main.exe < input.txt";
                } else {
                    compileAndRunCmd = "g++ main.cpp -o main && ./main < input.txt";
                }
                
            } else {
                return "Unsupported language: " + language;
            }

            // Clean the input data and write to files
            String safeInput = input != null ? input.trim() : "";
            System.out.println("📝 [Native] Received Code Length: " + (code != null ? code.length() : 0));
            Files.writeString(tempDirPath.resolve(fileName), code);
            Files.writeString(tempDirPath.resolve("input.txt"), safeInput);

            System.out.println("🚀 [Native] Testing Language: " + language + " | OS: " + (isWindows ? "Windows" : "Linux"));

            // 👇 Choose the correct terminal shell (cmd for Windows, sh for Linux/Render)
            String shell = isWindows ? "cmd.exe" : "sh";
            String flag = isWindows ? "/c" : "-c";

            ProcessBuilder pb = new ProcessBuilder(shell, flag, compileAndRunCmd);
            pb.directory(tempDirPath.toFile()); // 👈 Run the command INSIDE the temp folder!
            pb.redirectErrorStream(true); 

            Process process = pb.start();
            
            // ⏳ 10 seconds is plenty since we don't have to wait for Docker to spin up anymore!
            boolean finished = process.waitFor(10, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return "Error: Execution Timed Out (Infinite loop or took too long)";
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }

            String finalOutput = output.toString().trim();
            System.out.println("✅ [Native] Raw Output: '" + finalOutput + "'");
            
            return finalOutput;

        } catch (Exception e) {
            System.out.println("❌ [Native] Execution Crash: " + e.getMessage());
            return "Execution Error: " + e.getMessage();
        } finally {
            // Cleanup Temp Files
            try {
                File dir = tempDirPath.toFile();
                if (dir.exists()) {
                    File[] files = dir.listFiles();
                    if (files != null) for (File f : files) f.delete();
                    dir.delete();
                }
            } catch (Exception ignored) {}
        }
    }
}