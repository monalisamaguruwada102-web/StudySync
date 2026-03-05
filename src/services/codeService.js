import api from './api';

/**
 * Service for executing code using the Piston API via an internal proxy.
 * This avoids CORS issues on the deployed production site.
 */
const codeService = {
    /**
     * Executes the provided source code in the specified language.
     * @param {string} language - The programming language slug.
     * @param {string} version - The version of the runtime to use ('*' for latest).
     * @param {string} source - The source code to execute.
     * @param {string} stdin - Optional standard input.
     * @returns {Promise<Object>} The execution results.
     */
    execute: async (language, version, source, stdin = '') => {
        try {
            const response = await api.post('/code/execute', {
                language,
                version,
                files: [
                    {
                        content: source
                    }
                ],
                stdin
            });
            return response.data;
        } catch (error) {
            console.error('Code execution error:', error);
            throw new Error(error.response?.data?.message || 'Failed to execute code via bridge');
        }
    },

    /**
     * Reusable templates for different languages
     */
    templates: {
        csharp: `using System;

// Modern C# supports top-level statements
Console.WriteLine("Deep-check: Piston C# Runtime");
Console.WriteLine("----------------------------");

string input = "User";
Console.WriteLine($"Hello, {input}! Current Time: {DateTime.Now}");

int x = 42;
int y = 58;
Console.WriteLine($"Computation Test: {x} + {y} = {x + y}");

/* 
  To test stdin:
  1. Click 'Add Input (stdin)' below.
  2. Type your name.
  3. Uncomment the lines below:
*/

// Console.Write("Enter your name: ");
// string name = Console.ReadLine();
// Console.WriteLine($"Greetings, {name}!");`,
        cpp: `#include <iostream>
#include <string>

int main() {
    std::cout << "--- StudySync C++ Compiler Check ---" << std::endl;
    
    std::string version = "GCC Latest";
    std::cout << "Engine: " << version << std::endl;
    
    int val = 100;
    std::cout << "Memory Allocation Check: " << &val << std::endl;
    
    /* 
      To test stdin:
      1. Click 'Add Input (stdin)' below.
      2. Type a number.
      3. Uncomment the lines below:
    */
    
    // int num;
    // std::cout << "Enter a number: ";
    // std::cin >> num;
    // std::cout << "You entered: " << num << std::endl;
    
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
        { id: 'csharp', name: 'C# (Dotnet)', version: '*', extension: 'cs' },
        { id: 'cpp', name: 'C++ (GCC)', version: '*', extension: 'cpp' },
        { id: 'python', name: 'Python 3', version: '*', extension: 'py' },
        { id: 'javascript', name: 'JavaScript (Node)', version: '*', extension: 'js' },
        { id: 'java', name: 'Java', version: '*', extension: 'java' }
    ]
};

export default codeService;
