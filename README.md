# Introduction 
TODO: Give a short introduction of your project. Let this section explain the objectives or the motivation behind this project. 

# Getting Started
TODO: Guide users through getting your code up and running on their own system. In this section you can talk about:
1.	Installation process
2.	Software dependencies
3.	Latest releases
4.	API references

# Build and Test
TODO: Describe and show how to build your code and run the tests. 

# Contribute
TODO: Explain how other users and developers can contribute to make your code better. 

If you want to learn more about creating good readme files then refer the following [guidelines](https://docs.microsoft.com/en-us/azure/devops/repos/git/create-a-readme?view=azure-devops). You can also seek inspiration from the below readme files:
- [ASP.NET Core](https://github.com/aspnet/Home)
- [Visual Studio Code](https://github.com/Microsoft/vscode)
- [Chakra Core](https://github.com/Microsoft/ChakraCore)
# FishTracker

FishTracker is a project designed to manage and track fish-related data. This application provides an API for registering devices and other functionalities related to fish tracking.

## Table of Contents

- [Project Overview](#project-overview)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Building the Project](#building-the-project)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

FishTracker is built to facilitate the management of fish-related data through a RESTful API. The application allows users to register devices and track their data efficiently.

## Technologies Used

- **Bun**: A modern JavaScript runtime that is used for package management and running the application.
- **TypeScript**: A superset of JavaScript that adds static types, enhancing code quality and maintainability.
- **Hono**: A lightweight web framework for building APIs, providing a simple and efficient way to handle HTTP requests.
- **MongoDB**: A NoSQL database used for storing device data and other related information.
- **Zod**: A TypeScript-first schema declaration and validation library used for validating request data.
- **Swagger**: Used for API documentation, providing a user-friendly interface to explore the API endpoints.

## Installation

To install the necessary dependencies, run the following command:

```sh
bun install
```

## Running the Application

To start the application in development mode, use the following command:

```sh
bun run dev
```

Once the application is running, you can access it at:

```
http://localhost:3000
```

## Building the Project

To build the project for production, use the following command:

```sh
bun build ./src/index.tsx --compile --outfile ./build/fishTracker
```

This command compiles the TypeScript files and outputs the built files to the `./build` directory.
