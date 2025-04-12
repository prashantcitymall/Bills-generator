import { handler } from "./lambda.js";
import { createLogger } from "./utils/logger.js";

// Create a logger for testing
const logger = createLogger("test-lambda");

// Mock API Gateway event
const event = {
  httpMethod: "GET",
  path: "/health",
  headers: {
    "Content-Type": "application/json",
    Host: "localhost:3001",
  },
  requestContext: {
    identity: {
      sourceIp: "127.0.0.1",
    },
  },
};

// Mock context
const context = {
  callbackWaitsForEmptyEventLoop: true,
  functionName: "bills-generator-local-test",
  functionVersion: "LOCAL",
  invokedFunctionArn:
    "arn:aws:lambda:local:000000000000:function:bills-generator-local-test",
  memoryLimitInMB: "1024",
  awsRequestId: "LOCAL-REQUEST-ID",
  logGroupName: "LOCAL-LOG-GROUP",
  logStreamName: "LOCAL-LOG-STREAM",
  getRemainingTimeInMillis: () => 30000,
};

// Test the Lambda handler
async function testLambda() {
  try {
    logger.info("Testing Lambda handler with mock event");
    logger.debug("Event:", { event });

    // Call the Lambda handler
    const response = await new Promise((resolve, reject) => {
      handler(event, context, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });

    logger.info("Lambda handler response:", { response });
    return response;
  } catch (error) {
    logger.error("Error testing Lambda handler:", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

// Run the test
testLambda()
  .then((response) => {
    logger.info("Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Test failed", { error: error.message });
    process.exit(1);
  });
