const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Assignment Management System API",
      version: "1.0.0",
      description: "Comprehensive API documentation for the Assignment Management System, including Auth, Tasks, and Notifications.",
      contact: {
        name: "Rashid Tahir",
        email: "iamrashid.dev@gmail.com",
      },
    },
    servers: [
      {
        url: "/api",
        description: "Main API Base Path",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            firstname: { type: "string" },
            lastname: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["admin", "user"] },
            profilePicture: { type: "string", description: "URL to user profile image" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Task: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            deadline: { type: "string", format: "date-time" },
            adminFileUrl: { type: "string" },
            createdBy: { $ref: "#/components/schemas/User" },
            assignedTo: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  userId: { $ref: "#/components/schemas/User" },
                  isCompleted: { type: "boolean" },
                  completedAt: { type: "string", format: "date-time" },
                },
              },
            },
            isCompleted: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Notification: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            title: { type: "string" },
            message: { type: "string" },
            type: { type: "string" },
            isRead: { type: "boolean" },
            relatedTaskId: { type: "string" },
            relatedExists: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
        MessageResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/app.js"], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
