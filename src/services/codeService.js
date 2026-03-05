import axios from 'axios';

/**
 * Service for executing code using the Piston API.
 * Piston is a high performance code execution engine.
 */
const PISTON_URL = 'https://emkc.org/api/v2/piston';

const codeService = {
    /**
     * Executes the provided source code in the specified language.
     * @param {string} language - The programming language slug (e.g., 'csharp', 'cpp', 'python').
     * @param {string} version - The version of the runtime to use ('*' for latest).
     * @param {string} source - The source code to execute.
     * @returns {Promise<Object>} The execution results (stdout, stderr, etc.).
     */
    execute: async (language, version, source) => {
        try {
            const response = await axios.post(`${PISTON_URL}/execute`, {
                language,
                version,
                files: [
                    {
                        content: source
                    }
                ]
            });
            return response.data;
        } catch (error) {
            console.error('Code execution error:', error);
            throw new Error(error.response?.data?.message || 'Failed to execute code');
        }
    },

    /**
     * Reusable templates for different languages
     */
    templates: {
        csharp: `using System;

namespace HelloWorld
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello from StudySync C# Sandbox!");
            
            // Try some logic
            int a = 10;
            int b = 20;
            Console.WriteLine($"Sum of {a} and {b} is {a + b}");
        }
    }
}`,
        cpp: `#include <iostream>
#include <vector>
#include <string>

int main() {
    std::cout << "Hello from StudySync C++ Sandbox!" << std::endl;
    
    std::vector<std::string> features = {"Live Execution", "Multiple Languages", "Premium UI"};
    
    std::cout << "\\nFeatures of this sandbox:" << std::endl;
    for (const auto& feature : features) {
        std::cout << "- " << feature << std::endl;
    }
    
    return 0;
}`,
        python: `print("Hello from StudySync Python Sandbox!")

def greet(name):
    return f"Welcome to the playground, {name}!"

print(greet("Student"))

# Simple data structure test
scores = [85, 92, 78, 95, 88]
average = sum(scores) / len(scores)
print(f"Average score: {average}")`,
        javascript: `console.log("Hello from StudySync JavaScript Sandbox!");

const students = [
    { name: "Alex", score: 95 },
    { name: "Jordan", score: 88 },
    { name: "Taylor", score: 92 }
];

console.table(students);

const topStudent = students.reduce((prev, current) => 
    (prev.score > current.score) ? prev : current
);

console.log(\`Top student: \${topStudent.name} with \${topStudent.score} points\`);`,
        java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from StudySync Java Sandbox!");
        
        for (int i = 1; i <= 5; i++) {
            System.out.println("Iteration: " + i);
        }
    }
}`
    },

    /**
     * Language metadata for the sandbox
     */
    languages: [
        { id: 'csharp', name: 'C#', version: '6.12.0', extension: 'cs' },
        { id: 'cpp', name: 'C++ (GCC)', version: '10.2.0', extension: 'cpp' },
        { id: 'python', name: 'Python 3', version: '3.10.0', extension: 'py' },
        { id: 'javascript', name: 'JavaScript (Node)', version: '18.15.0', extension: 'js' },
        { id: 'java', name: 'Java', version: '15.0.2', extension: 'java' }
    ]
};

export default codeService;
