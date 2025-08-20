# Konectile Task

this project is given by Konectile and clone from their github https://github.com/ZiaCodes/mock-plain-js-express-api

---

## Technologies Used

- **Framework:** Serverless Framework
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Redis
- **Cloud Provider:** AWS Lambda, AWS API Gateway
- **Other:** List any other libraries or tools you used (`cors`, `dotenv`, etc.).

---

## Deployment

These instructions are for anyone who wants to deploy the application to their own AWS account.

1.  **Install Dependencies:**

    ```bash
    npm install
    npm install -g serverless
    ```

2.  **Create a serice:**

    The serverless command is an interactive tool that helps you create and deploy a "Service," which is a project defined by a serverless.yml file. This file simplifies the declaration of AWS resources like Lambda functions and API Gateway.

    ```bash
    serverless
    ```

3.  **AWS Credentials:**

    Set up your AWS credentials on your local machine. You can do this by running:

    ```bash
    export AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY_ID>
    export AWS_SECRET_ACCESS_KEY=<AWS_SECRET_ACCESS_KEY>
    ```

4.  **Deploy the Application:**
    - Run the deploy command. This will package your code, create the Lambda function, and configure API Gateway.
    ```bash
    serverless deploy
    ```
    - The deployment process will output your public API endpoint URL upon completion.

---

## Usage

You can use a tool like Postman, cURL, or a web browser to interact with the API.

- **API Endpoint URL:**
  `https://282hsw27p7.execute-api.ap-south-1.amazonaws.com/`

- **Example Request:**

  `"/" : dashboard,`

  `"/health" : reply healthy if reunning properly `
